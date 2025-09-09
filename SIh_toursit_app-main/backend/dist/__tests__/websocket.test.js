"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_service_1 = require("../services/websocket.service");
const http_1 = require("http");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
    },
    locationShare: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
};
describe('WebSocketService', () => {
    let server;
    let webSocketService;
    let clientSocket;
    let authToken;
    const testUserId = 'test-user-123';
    beforeAll((done) => {
        server = (0, http_1.createServer)();
        webSocketService = new websocket_service_1.WebSocketService(server, mockPrisma);
        server.listen(() => {
            const port = server.address()?.port;
            authToken = jsonwebtoken_1.default.sign({ userId: testUserId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
            done();
        });
    });
    afterAll(() => {
        server.close();
        webSocketService.shutdown();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue({
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
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            clientSocket.on('connect', () => {
                expect(webSocketService.isUserConnected(testUserId)).toBe(true);
                done();
            });
            clientSocket.on('connect_error', (error) => {
                done(error);
            });
        });
        it('should reject connection without token', (done) => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`);
            clientSocket.on('connect', () => {
                done(new Error('Should not connect without token'));
            });
            clientSocket.on('connect_error', (error) => {
                expect(error.message).toContain('Authentication error');
                done();
            });
        });
        it('should reject connection with invalid token', (done) => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: 'invalid-token' }
            });
            clientSocket.on('connect', () => {
                done(new Error('Should not connect with invalid token'));
            });
            clientSocket.on('connect_error', (error) => {
                expect(error.message).toContain('Authentication error');
                done();
            });
        });
        it('should reject connection for non-existent user', (done) => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            clientSocket.on('connect', () => {
                done(new Error('Should not connect for non-existent user'));
            });
            clientSocket.on('connect_error', (error) => {
                expect(error.message).toContain('User not found');
                done();
            });
        });
    });
    describe('Location Updates', () => {
        beforeEach((done) => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
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
            mockPrisma.locationShare.upsert.mockResolvedValue({
                id: 'location-1',
                userId: testUserId,
                coordinates: locationUpdate.coordinates,
                precisionLevel: 'high'
            });
            clientSocket.emit('location_update', locationUpdate);
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
            clientSocket.on('error', (error) => {
                expect(error.message).toContain('Failed to process location update');
                done();
            });
        });
    });
    describe('User Subscriptions', () => {
        beforeEach((done) => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            clientSocket.on('connect', done);
        });
        it('should allow subscription to accessible user', (done) => {
            const targetUserId = 'target-user-456';
            mockPrisma.locationShare.findUnique.mockResolvedValue({
                userId: targetUserId,
                isActive: true,
                sharedWith: [{ contactId: testUserId }]
            });
            clientSocket.emit('subscribe_to_user', targetUserId);
            clientSocket.on('subscription_confirmed', (data) => {
                expect(data.userId).toBe(targetUserId);
                done();
            });
        });
        it('should deny subscription to inaccessible user', (done) => {
            const targetUserId = 'target-user-456';
            mockPrisma.locationShare.findUnique.mockResolvedValue({
                userId: targetUserId,
                isActive: true,
                sharedWith: []
            });
            clientSocket.emit('subscribe_to_user', targetUserId);
            clientSocket.on('subscription_denied', (data) => {
                expect(data.userId).toBe(targetUserId);
                done();
            });
        });
        it('should handle unsubscription from user', (done) => {
            const targetUserId = 'target-user-456';
            clientSocket.emit('unsubscribe_from_user', targetUserId);
            clientSocket.on('unsubscription_confirmed', (data) => {
                expect(data.userId).toBe(targetUserId);
                done();
            });
        });
    });
    describe('Real-time Notifications', () => {
        it('should broadcast notification to specific user', async () => {
            const notification = {
                type: 'sharing_started',
                userId: testUserId,
                data: { message: 'Location sharing started' },
                timestamp: new Date()
            };
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            await new Promise((resolve) => {
                clientSocket.on('connect', resolve);
            });
            const notificationPromise = new Promise((resolve) => {
                clientSocket.on('sharing_status_changed', resolve);
            });
            await webSocketService.broadcastNotification(notification);
            const receivedNotification = await notificationPromise;
            expect(receivedNotification).toMatchObject({
                ...notification,
                timestamp: expect.any(String)
            });
        });
    });
    describe('Connection Management', () => {
        it('should track connected users', (done) => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
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
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            clientSocket.on('connect', () => {
                expect(webSocketService.isUserConnected(testUserId)).toBe(true);
                clientSocket.disconnect();
            });
            clientSocket.on('disconnect', () => {
                setTimeout(() => {
                    expect(webSocketService.isUserConnected(testUserId)).toBe(false);
                    done();
                }, 50);
            });
        });
        it('should force disconnect user', async () => {
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
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
            const port = server.address()?.port;
            clientSocket = (0, socket_io_client_1.default)(`http://localhost:${port}`, {
                auth: { token: authToken }
            });
            clientSocket.on('connect', () => {
                mockPrisma.locationShare.upsert.mockRejectedValue(new Error('Database connection failed'));
                const locationUpdate = {
                    userId: testUserId,
                    coordinates: { latitude: 40.7128, longitude: -74.0060 },
                    timestamp: new Date(),
                    precisionLevel: 'high'
                };
                clientSocket.emit('location_update', locationUpdate);
                clientSocket.on('error', (error) => {
                    expect(error.message).toContain('Failed to process location update');
                    done();
                });
            });
        });
    });
});
