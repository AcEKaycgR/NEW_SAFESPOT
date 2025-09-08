import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface LocationUpdate {
  userId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  precisionLevel: string;
}

interface NotificationPayload {
  type: 'location_update' | 'sharing_started' | 'sharing_stopped' | 'emergency_access' | 'geofence_breach';
  userId: string;
  data: any;
  timestamp: Date;
}

interface AuthenticatedSocket {
  userId: string;
  isAuthenticated: boolean;
}

export class WebSocketService {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs
  private socketAuth: Map<string, AuthenticatedSocket> = new Map(); // socketId -> auth info

  constructor(server: any, prisma: PrismaClient) {
    this.prisma = prisma;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        // Verify user exists in database
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Store auth info for this socket
        this.socketAuth.set(socket.id, {
          userId: decoded.userId,
          isAuthenticated: true
        });

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const authInfo = this.socketAuth.get(socket.id);
      if (!authInfo) {
        socket.disconnect();
        return;
      }

      const userId = authInfo.userId;
      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Track user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Join user-specific room for targeted updates
      socket.join(`user_${userId}`);

      // Handle location updates from client
      socket.on('location_update', async (data: LocationUpdate) => {
        try {
          await this.handleLocationUpdate(userId, data);
        } catch (error) {
          socket.emit('error', { message: 'Failed to process location update' });
        }
      });

      // Handle subscription to other users' locations
      socket.on('subscribe_to_user', async (targetUserId: string) => {
        try {
          const canAccess = await this.checkLocationAccess(userId, targetUserId);
          if (canAccess) {
            socket.join(`location_${targetUserId}`);
            socket.emit('subscription_confirmed', { userId: targetUserId });
          } else {
            socket.emit('subscription_denied', { userId: targetUserId });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to subscribe to user location' });
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe_from_user', (targetUserId: string) => {
        socket.leave(`location_${targetUserId}`);
        socket.emit('unsubscription_confirmed', { userId: targetUserId });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected socket ${socket.id}`);
        this.handleDisconnect(userId, socket.id);
      });
    });
  }

  private async handleLocationUpdate(userId: string, data: LocationUpdate) {
    // Validate location data
    if (!data.coordinates || typeof data.coordinates.latitude !== 'number' || typeof data.coordinates.longitude !== 'number') {
      throw new Error('Invalid location coordinates');
    }

    // Store location update in database
    await this.prisma.locationShare.upsert({
      where: { userId },
      update: {
        coordinates: data.coordinates,
        precisionLevel: data.precisionLevel,
        lastUpdated: new Date()
      },
      create: {
        userId,
        coordinates: data.coordinates,
        precisionLevel: data.precisionLevel,
        isActive: true,
        lastUpdated: new Date()
      }
    });

    // Broadcast to subscribers
    const notification: NotificationPayload = {
      type: 'location_update',
      userId,
      data: {
        coordinates: data.coordinates,
        precisionLevel: data.precisionLevel,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    this.io.to(`location_${userId}`).emit('location_updated', notification);
  }

  private async checkLocationAccess(requesterId: string, targetUserId: string): Promise<boolean> {
    try {
      // Check if target user is sharing location
      const locationShare = await this.prisma.locationShare.findUnique({
        where: { userId: targetUserId },
        include: { sharedWith: true }
      });

      if (!locationShare || !locationShare.isActive) {
        return false;
      }

      // Check if requester is in the shared contacts list
      const hasAccess = locationShare.sharedWith.some((contact: any) => contact.contactId === requesterId);
      return hasAccess;
    } catch (error) {
      console.error('Error checking location access:', error);
      return false;
    }
  }

  private handleDisconnect(userId: string, socketId: string) {
    // Remove socket from user's connection set
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    // Clean up auth info
    this.socketAuth.delete(socketId);
  }

  // Public method to broadcast notifications
  public async broadcastNotification(notification: NotificationPayload) {
    const { type, userId, data } = notification;
    
    switch (type) {
      case 'sharing_started':
      case 'sharing_stopped':
        // Notify the user who started/stopped sharing
        this.io.to(`user_${userId}`).emit('sharing_status_changed', notification);
        break;
        
      case 'emergency_access':
        // Notify the user whose location was accessed
        this.io.to(`user_${userId}`).emit('emergency_access_alert', notification);
        break;
        
      case 'geofence_breach':
        // Notify the user who breached the geofence
        this.io.to(`user_${userId}`).emit('geofence_breach_alert', notification);
        break;
        
      default:
        // Generic notification
        this.io.to(`user_${userId}`).emit('notification', notification);
    }
  }

  // Method to broadcast admin alerts for geofence breaches
  public async broadcastAdminAlert(alert: any) {
    // Broadcast to all admin users (in a real app, would have admin role checking)
    // For now, emit to a general admin room
    this.io.emit('admin_alert', alert);
    
    // Could also emit to specific admin users if we tracked admin user IDs
    // this.io.to('admin_room').emit('admin_geofence_alert', alert);
  }

  // Method to get connected user count
  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  // Method to check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Method to get user's socket IDs
  public getUserSockets(userId: string): string[] {
    const sockets = this.connectedUsers.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  // Method to disconnect specific user
  public async disconnectUser(userId: string, reason?: string) {
    const socketIds = this.getUserSockets(userId);
    socketIds.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('force_disconnect', { reason: reason || 'Administrative disconnect' });
        socket.disconnect(true);
      }
    });
  }

  // Cleanup method
  public async shutdown() {
    console.log('Shutting down WebSocket service...');
    this.connectedUsers.clear();
    this.socketAuth.clear();
    this.io.close();
  }
}
