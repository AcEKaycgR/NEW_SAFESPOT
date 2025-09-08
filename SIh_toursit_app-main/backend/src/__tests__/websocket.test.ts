import { WebSocketService } from '../services/websocket.service';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import ioClient from 'socket.io-client';
import jwt from 'jsonwebtoken';

type ClientSocket = ReturnType<typeof ioClient>;

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  locationShare: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
} as unknown as PrismaClient;

describe('WebSocketService', () => {
  let server: any;
  let webSocketService: WebSocketService;
  let clientSocket: ClientSocket;
  let authToken: string;
  const testUserId = 'test-user-123';

  beforeAll((done) => {
    // Create HTTP server
    server = createServer();
    
    // Create WebSocket service
    webSocketService = new WebSocketService(server, mockPrisma);
    
    // Start server
    server.listen(() => {
      const port = (server.address() as any)?.port;
      
      // Generate test JWT token
      authToken = jwt.sign(
        { userId: testUserId },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );
      
      done();
    });
  });

  afterAll(() => {
    server.close();
    webSocketService.shutdown();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user exists
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com'
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Authentication', () => {
    it('should allow connection with valid token', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', () => {
        expect(webSocketService.isUserConnected(testUserId)).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(error);
      });
    });

    it('should reject connection without token', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });

      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('Authentication error');
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('Authentication error');
        done();
      });
    });

    it('should reject connection for non-existent user', (done) => {
      // Mock user not found
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect for non-existent user'));
      });

      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('User not found');
        done();
      });
    });
  });

  describe('Location Updates', () => {
    beforeEach((done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', done);
    });

    it('should handle location update from client', (done) => {
      const locationUpdate = {
        userId: testUserId,
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date(),
        precisionLevel: 'high'
      };

      // Mock successful database upsert
      (mockPrisma.locationShare.upsert as jest.Mock).mockResolvedValue({
        id: 'location-1',
        userId: testUserId,
        coordinates: locationUpdate.coordinates,
        precisionLevel: 'high'
      });

      clientSocket.emit('location_update', locationUpdate);

      // Verify database was called
      setTimeout(() => {
        expect(mockPrisma.locationShare.upsert).toHaveBeenCalledWith({
          where: { userId: testUserId },
          update: {
            coordinates: locationUpdate.coordinates,
            precisionLevel: locationUpdate.precisionLevel,
            lastUpdated: expect.any(Date)
          },
          create: {
            userId: testUserId,
            coordinates: locationUpdate.coordinates,
            precisionLevel: locationUpdate.precisionLevel,
            isActive: true,
            lastUpdated: expect.any(Date)
          }
        });
        done();
      }, 100);
    });

    it('should reject invalid location coordinates', (done) => {
      const invalidUpdate = {
        userId: testUserId,
        coordinates: { latitude: 'invalid', longitude: -74.0060 },
        timestamp: new Date(),
        precisionLevel: 'high'
      };

      clientSocket.emit('location_update', invalidUpdate);

      clientSocket.on('error', (error: any) => {
        expect(error.message).toContain('Failed to process location update');
        done();
      });
    });
  });

  describe('User Subscriptions', () => {
    beforeEach((done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', done);
    });

    it('should allow subscription to accessible user', (done) => {
      const targetUserId = 'target-user-456';

      // Mock location access check
      (mockPrisma.locationShare.findUnique as jest.Mock).mockResolvedValue({
        userId: targetUserId,
        isActive: true,
        sharedWith: [{ contactId: testUserId }]
      });

      clientSocket.emit('subscribe_to_user', targetUserId);

      clientSocket.on('subscription_confirmed', (data: any) => {
        expect(data.userId).toBe(targetUserId);
        done();
      });
    });

    it('should deny subscription to inaccessible user', (done) => {
      const targetUserId = 'target-user-456';

      // Mock no access
      (mockPrisma.locationShare.findUnique as jest.Mock).mockResolvedValue({
        userId: targetUserId,
        isActive: true,
        sharedWith: [] // No shared contacts
      });

      clientSocket.emit('subscribe_to_user', targetUserId);

      clientSocket.on('subscription_denied', (data: any) => {
        expect(data.userId).toBe(targetUserId);
        done();
      });
    });

    it('should handle unsubscription from user', (done) => {
      const targetUserId = 'target-user-456';

      clientSocket.emit('unsubscribe_from_user', targetUserId);

      clientSocket.on('unsubscription_confirmed', (data: any) => {
        expect(data.userId).toBe(targetUserId);
        done();
      });
    });
  });

  describe('Real-time Notifications', () => {
    it('should broadcast notification to specific user', async () => {
      const notification = {
        type: 'sharing_started' as const,
        userId: testUserId,
        data: { message: 'Location sharing started' },
        timestamp: new Date()
      };

      // Connect client first
      const port = (server.address() as any)?.port;
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      await new Promise((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // Set up listener for notification
      const notificationPromise = new Promise((resolve) => {
        clientSocket.on('sharing_status_changed', resolve);
      });

      // Broadcast notification
      await webSocketService.broadcastNotification(notification);

      // Verify notification received
      const receivedNotification = await notificationPromise;
      expect(receivedNotification).toMatchObject({
        ...notification,
        timestamp: expect.any(String) // Timestamp gets serialized as string over WebSocket
      });
    });
  });

  describe('Connection Management', () => {
    it('should track connected users', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', () => {
        expect(webSocketService.isUserConnected(testUserId)).toBe(true);
        expect(webSocketService.getConnectedUserCount()).toBeGreaterThan(0);
        
        const userSockets = webSocketService.getUserSockets(testUserId);
        expect(userSockets).toHaveLength(1);
        
        done();
      });
    });

    it('should handle user disconnection', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', () => {
        expect(webSocketService.isUserConnected(testUserId)).toBe(true);
        
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        // Give some time for cleanup
        setTimeout(() => {
          expect(webSocketService.isUserConnected(testUserId)).toBe(false);
          done();
        }, 50);
      });
    });

    it('should force disconnect user', async () => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      await new Promise((resolve) => {
        clientSocket.on('connect', resolve);
      });

      const disconnectPromise = new Promise((resolve) => {
        clientSocket.on('force_disconnect', resolve);
      });

      await webSocketService.disconnectUser(testUserId, 'Test disconnect');

      const disconnectData = await disconnectPromise;
      expect(disconnectData).toMatchObject({
        reason: 'Test disconnect'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', (done) => {
      const port = (server.address() as any)?.port;
      
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: authToken }
      });

      clientSocket.on('connect', () => {
        // Mock database error
        (mockPrisma.locationShare.upsert as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        const locationUpdate = {
          userId: testUserId,
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          timestamp: new Date(),
          precisionLevel: 'high'
        };

        clientSocket.emit('location_update', locationUpdate);

        clientSocket.on('error', (error: any) => {
          expect(error.message).toContain('Failed to process location update');
          done();
        });
      });
    });
  });
});
