"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class WebSocketService {
    constructor(server, prisma) {
        this.connectedUsers = new Map();
        this.socketAuth = new Map();
        this.prisma = prisma;
        this.io = new socket_io_1.Server(server, {
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
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                const user = await this.prisma.user.findUnique({
                    where: { id: decoded.userId }
                });
                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }
                this.socketAuth.set(socket.id, {
                    userId: decoded.userId,
                    isAuthenticated: true
                });
                next();
            }
            catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }
    setupConnectionHandlers() {
        this.io.on('connection', (socket) => {
            const authInfo = this.socketAuth.get(socket.id);
            if (!authInfo) {
                socket.disconnect();
                return;
            }
            const userId = authInfo.userId;
            console.log(`User ${userId} connected with socket ${socket.id}`);
            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId).add(socket.id);
            socket.join(`user_${userId}`);
            socket.on('location_update', async (data) => {
                try {
                    await this.handleLocationUpdate(userId, data);
                }
                catch (error) {
                    socket.emit('error', { message: 'Failed to process location update' });
                }
            });
            socket.on('subscribe_to_user', async (targetUserId) => {
                try {
                    const canAccess = await this.checkLocationAccess(userId, targetUserId);
                    if (canAccess) {
                        socket.join(`location_${targetUserId}`);
                        socket.emit('subscription_confirmed', { userId: targetUserId });
                    }
                    else {
                        socket.emit('subscription_denied', { userId: targetUserId });
                    }
                }
                catch (error) {
                    socket.emit('error', { message: 'Failed to subscribe to user location' });
                }
            });
            socket.on('unsubscribe_from_user', (targetUserId) => {
                socket.leave(`location_${targetUserId}`);
                socket.emit('unsubscription_confirmed', { userId: targetUserId });
            });
            socket.on('disconnect', () => {
                console.log(`User ${userId} disconnected socket ${socket.id}`);
                this.handleDisconnect(userId, socket.id);
            });
        });
    }
    async handleLocationUpdate(userId, data) {
        if (!data.coordinates || typeof data.coordinates.latitude !== 'number' || typeof data.coordinates.longitude !== 'number') {
            throw new Error('Invalid location coordinates');
        }
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
        const notification = {
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
    async checkLocationAccess(requesterId, targetUserId) {
        try {
            const locationShare = await this.prisma.locationShare.findUnique({
                where: { userId: targetUserId },
                include: { sharedWith: true }
            });
            if (!locationShare || !locationShare.isActive) {
                return false;
            }
            const hasAccess = locationShare.sharedWith.some((contact) => contact.contactId === requesterId);
            return hasAccess;
        }
        catch (error) {
            console.error('Error checking location access:', error);
            return false;
        }
    }
    handleDisconnect(userId, socketId) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                this.connectedUsers.delete(userId);
            }
        }
        this.socketAuth.delete(socketId);
    }
    async broadcastNotification(notification) {
        const { type, userId, data } = notification;
        switch (type) {
            case 'sharing_started':
            case 'sharing_stopped':
                this.io.to(`user_${userId}`).emit('sharing_status_changed', notification);
                break;
            case 'emergency_access':
                this.io.to(`user_${userId}`).emit('emergency_access_alert', notification);
                break;
            case 'geofence_breach':
                this.io.to(`user_${userId}`).emit('geofence_breach_alert', notification);
                break;
            default:
                this.io.to(`user_${userId}`).emit('notification', notification);
        }
    }
    async broadcastAdminAlert(alert) {
        this.io.emit('admin_alert', alert);
    }
    getConnectedUserCount() {
        return this.connectedUsers.size;
    }
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
    getUserSockets(userId) {
        const sockets = this.connectedUsers.get(userId);
        return sockets ? Array.from(sockets) : [];
    }
    async disconnectUser(userId, reason) {
        const socketIds = this.getUserSockets(userId);
        socketIds.forEach(socketId => {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('force_disconnect', { reason: reason || 'Administrative disconnect' });
                socket.disconnect(true);
            }
        });
    }
    async shutdown() {
        console.log('Shutting down WebSocket service...');
        this.connectedUsers.clear();
        this.socketAuth.clear();
        this.io.close();
    }
}
exports.WebSocketService = WebSocketService;
