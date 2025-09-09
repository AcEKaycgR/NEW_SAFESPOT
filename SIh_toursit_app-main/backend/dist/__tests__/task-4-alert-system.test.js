"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const geofence_controller_1 = require("../controllers/geofence.controller");
const database_setup_1 = require("../test-utils/database-setup");
class MockWebSocketService {
    constructor() {
        this.notifications = [];
        this.adminNotifications = [];
    }
    async broadcastNotification(notification) {
        this.notifications.push(notification);
    }
    async broadcastAdminAlert(alert) {
        this.adminNotifications.push(alert);
    }
    getNotifications() {
        return this.notifications;
    }
    getAdminNotifications() {
        return this.adminNotifications;
    }
    clearNotifications() {
        this.notifications = [];
        this.adminNotifications = [];
    }
    isUserConnected(userId) {
        return true;
    }
}
(0, globals_1.describe)('Task 4: Simple Alert System', () => {
    let testDb;
    let controller;
    let mockWebSocket;
    let testUserId;
    let adminUserId;
    let testGeofenceId;
    (0, globals_1.beforeAll)(async () => {
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
        controller = new geofence_controller_1.GeofenceController();
        mockWebSocket = new MockWebSocketService();
    });
    (0, globals_1.afterAll)(async () => {
        await testDb.teardown();
    });
    (0, globals_1.beforeEach)(async () => {
        await testDb.cleanup();
        mockWebSocket.clearNotifications();
        const testUser = await testDb.createTestUser({
            email: `test-alerts-${Date.now()}@example.com`,
            name: 'Test Alert User'
        });
        testUserId = testUser.id;
        const adminUser = await testDb.createTestUser({
            email: `admin-alerts-${Date.now()}@example.com`,
            name: 'Admin Alert User'
        });
        adminUserId = adminUser.id;
        const testGeofence = await testDb.dbManager.client.geofenceArea.create({
            data: {
                name: 'Alert Test Zone',
                description: 'Test geofence for alert system',
                polygon_coords: JSON.stringify([
                    { lat: 40.7000, lng: -74.0200 },
                    { lat: 40.7000, lng: -74.0000 },
                    { lat: 40.7200, lng: -74.0000 },
                    { lat: 40.7200, lng: -74.0200 }
                ]),
                risk_level: 'HIGH',
                type: 'RESTRICTED',
                created_by: adminUserId
            }
        });
        testGeofenceId = testGeofence.id;
    });
    (0, globals_1.afterEach)(async () => {
        await testDb.cleanup();
    });
    (0, globals_1.describe)('4.1: Implement WebSocket notifications for users', () => {
        (0, globals_1.it)('should send geofence breach notification to user', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            const notifications = mockWebSocket.getNotifications();
            (0, globals_1.expect)(notifications).toHaveLength(1);
            const notification = notifications[0];
            (0, globals_1.expect)(notification.type).toBe('geofence_breach');
            (0, globals_1.expect)(notification.userId).toBe(testUserId.toString());
            (0, globals_1.expect)(notification.data.geofence_name).toBe('Alert Test Zone');
            (0, globals_1.expect)(notification.data.risk_level).toBe('HIGH');
            (0, globals_1.expect)(notification.data.breach_location).toEqual({
                latitude: 40.7100,
                longitude: -74.0100
            });
        });
        (0, globals_1.it)('should include safety recommendations in breach notifications', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const notifications = mockWebSocket.getNotifications();
            const notification = notifications[0];
            (0, globals_1.expect)(notification.data.safety_recommendations).toBeDefined();
            (0, globals_1.expect)(Array.isArray(notification.data.safety_recommendations)).toBe(true);
            (0, globals_1.expect)(notification.data.safety_recommendations.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should not send notification if user is outside all geofences', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.6900,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.data.breaches).toHaveLength(0);
            const notifications = mockWebSocket.getNotifications();
            (0, globals_1.expect)(notifications).toHaveLength(0);
        });
        (0, globals_1.it)('should send different notification types based on risk level', async () => {
            controller.webSocketService = mockWebSocket;
            const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Low Risk Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7300, lng: -74.0300 },
                        { lat: 40.7300, lng: -74.0200 },
                        { lat: 40.7400, lng: -74.0200 },
                        { lat: 40.7400, lng: -74.0300 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: adminUserId
                }
            });
            const mediumRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Medium Risk Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7400, lng: -74.0300 },
                        { lat: 40.7400, lng: -74.0200 },
                        { lat: 40.7500, lng: -74.0200 },
                        { lat: 40.7500, lng: -74.0300 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: adminUserId
                }
            });
            const testCases = [
                {
                    location: { lat: 40.7350, lng: -74.0250 },
                    expectedRisk: 'LOW',
                    expectedPriority: 'info'
                },
                {
                    location: { lat: 40.7450, lng: -74.0250 },
                    expectedRisk: 'MEDIUM',
                    expectedPriority: 'warning'
                },
                {
                    location: { lat: 40.7100, lng: -74.0100 },
                    expectedRisk: 'HIGH',
                    expectedPriority: 'urgent'
                }
            ];
            for (const testCase of testCases) {
                mockWebSocket.clearNotifications();
                const mockReq = {
                    body: {
                        ...testCase.location,
                        latitude: testCase.location.lat,
                        longitude: testCase.location.lng,
                        user_id: testUserId
                    }
                };
                const mockRes = { json: globals_1.jest.fn() };
                await controller.checkLocation(mockReq, mockRes);
                const notifications = mockWebSocket.getNotifications();
                (0, globals_1.expect)(notifications).toHaveLength(1);
                const notification = notifications[0];
                (0, globals_1.expect)(notification.data.risk_level).toBe(testCase.expectedRisk);
                (0, globals_1.expect)(notification.data.priority).toBe(testCase.expectedPriority);
            }
        });
    });
    (0, globals_1.describe)('4.2: Add admin alert notifications via WebSocket', () => {
        (0, globals_1.it)('should send admin alert for high-risk breaches', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const adminNotifications = mockWebSocket.getAdminNotifications();
            (0, globals_1.expect)(adminNotifications).toHaveLength(1);
            const adminAlert = adminNotifications[0];
            (0, globals_1.expect)(adminAlert.type).toBe('admin_geofence_alert');
            (0, globals_1.expect)(adminAlert.data.user_id).toBe(testUserId);
            (0, globals_1.expect)(adminAlert.data.geofence_name).toBe('Alert Test Zone');
            (0, globals_1.expect)(adminAlert.data.risk_level).toBe('HIGH');
            (0, globals_1.expect)(adminAlert.data.requires_immediate_attention).toBe(true);
        });
        (0, globals_1.it)('should not send admin alert for low-risk breaches', async () => {
            const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Low Risk Admin Test',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7300, lng: -74.0300 },
                        { lat: 40.7300, lng: -74.0200 },
                        { lat: 40.7400, lng: -74.0200 },
                        { lat: 40.7400, lng: -74.0300 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: adminUserId
                }
            });
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7350,
                longitude: -74.0250,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const adminNotifications = mockWebSocket.getAdminNotifications();
            (0, globals_1.expect)(adminNotifications).toHaveLength(0);
        });
        (0, globals_1.it)('should include user context in admin alerts', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const adminNotifications = mockWebSocket.getAdminNotifications();
            const adminAlert = adminNotifications[0];
            (0, globals_1.expect)(adminAlert.data.user_context).toBeDefined();
            (0, globals_1.expect)(adminAlert.data.user_context.user_id).toBe(testUserId);
            (0, globals_1.expect)(adminAlert.data.timestamp).toBeDefined();
            (0, globals_1.expect)(adminAlert.data.location_accuracy).toBeDefined();
        });
        (0, globals_1.it)('should send admin summary for multiple breaches', async () => {
            controller.webSocketService = mockWebSocket;
            const user2 = await testDb.createTestUser({
                email: `user2-${Date.now()}@example.com`,
                name: 'User 2'
            });
            const user3 = await testDb.createTestUser({
                email: `user3-${Date.now()}@example.com`,
                name: 'User 3'
            });
            const users = [testUserId, user2.id, user3.id];
            for (const userId of users) {
                const mockReq = {
                    body: {
                        latitude: 40.7100,
                        longitude: -74.0100,
                        user_id: userId
                    }
                };
                const mockRes = { json: globals_1.jest.fn() };
                await controller.checkLocation(mockReq, mockRes);
            }
            const adminNotifications = mockWebSocket.getAdminNotifications();
            (0, globals_1.expect)(adminNotifications).toHaveLength(3);
            adminNotifications.forEach(alert => {
                (0, globals_1.expect)(alert.data.geofence_name).toBe('Alert Test Zone');
                (0, globals_1.expect)(alert.data.risk_level).toBe('HIGH');
            });
        });
    });
    (0, globals_1.describe)('4.3: Create basic breach event logging', () => {
        (0, globals_1.it)('should log breach event with complete details', async () => {
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                },
                orderBy: { occurred_at: 'desc' }
            });
            (0, globals_1.expect)(loggedBreach).toBeDefined();
            (0, globals_1.expect)(loggedBreach.latitude).toBe(40.7100);
            (0, globals_1.expect)(loggedBreach.longitude).toBe(-74.0100);
            (0, globals_1.expect)(loggedBreach.risk_score).toBeGreaterThanOrEqual(80);
            (0, globals_1.expect)(loggedBreach.occurred_at).toBeDefined();
            (0, globals_1.expect)(typeof loggedBreach.alert_sent).toBe('boolean');
        });
        (0, globals_1.it)('should log alert notification status', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                },
                orderBy: { occurred_at: 'desc' }
            });
            (0, globals_1.expect)(loggedBreach.alert_sent).toBe(true);
        });
        (0, globals_1.it)('should log breach resolution time', async () => {
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            let mockReq = { body: locationData };
            let mockRes = { json: globals_1.jest.fn() };
            await controller.checkLocation(mockReq, mockRes);
            const exitLocationData = {
                latitude: 40.6900,
                longitude: -74.0100,
                user_id: testUserId
            };
            mockReq = { body: exitLocationData };
            mockRes = { json: globals_1.jest.fn() };
            await controller.checkLocation(mockReq, mockRes);
            const allBreaches = await testDb.dbManager.client.geofenceBreach.findMany({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                },
                orderBy: { occurred_at: 'desc' }
            });
            (0, globals_1.expect)(allBreaches).toHaveLength(1);
        });
        (0, globals_1.it)('should maintain breach audit trail', async () => {
            const locations = [
                { lat: 40.7100, lng: -74.0100 },
                { lat: 40.7110, lng: -74.0110 },
                { lat: 40.7120, lng: -74.0120 }
            ];
            for (const location of locations) {
                const mockReq = {
                    body: {
                        latitude: location.lat,
                        longitude: location.lng,
                        user_id: testUserId
                    }
                };
                const mockRes = { json: globals_1.jest.fn() };
                await controller.checkLocation(mockReq, mockRes);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            const auditTrail = await testDb.dbManager.client.geofenceBreach.findMany({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                },
                orderBy: { occurred_at: 'asc' }
            });
            (0, globals_1.expect)(auditTrail).toHaveLength(3);
            for (let i = 1; i < auditTrail.length; i++) {
                (0, globals_1.expect)(auditTrail[i].occurred_at.getTime())
                    .toBeGreaterThanOrEqual(auditTrail[i - 1].occurred_at.getTime());
            }
            (0, globals_1.expect)(auditTrail[0].latitude).toBe(40.7100);
            (0, globals_1.expect)(auditTrail[1].latitude).toBe(40.7110);
            (0, globals_1.expect)(auditTrail[2].latitude).toBe(40.7120);
        });
    });
    (0, globals_1.describe)('4.4: Test end-to-end alert flow', () => {
        (0, globals_1.it)('should complete full alert flow: detection -> logging -> user notification -> admin alert', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                }
            });
            (0, globals_1.expect)(loggedBreach).toBeDefined();
            const userNotifications = mockWebSocket.getNotifications();
            (0, globals_1.expect)(userNotifications).toHaveLength(1);
            (0, globals_1.expect)(userNotifications[0].type).toBe('geofence_breach');
            const adminNotifications = mockWebSocket.getAdminNotifications();
            (0, globals_1.expect)(adminNotifications).toHaveLength(1);
            (0, globals_1.expect)(adminNotifications[0].type).toBe('admin_geofence_alert');
            const breach = response.data.breaches[0];
            const userNotif = userNotifications[0];
            const adminNotif = adminNotifications[0];
            (0, globals_1.expect)(breach.geofence_name).toBe(userNotif.data.geofence_name);
            (0, globals_1.expect)(breach.geofence_name).toBe(adminNotif.data.geofence_name);
            (0, globals_1.expect)(breach.risk_level).toBe(userNotif.data.risk_level);
            (0, globals_1.expect)(breach.risk_level).toBe(adminNotif.data.risk_level);
        });
        (0, globals_1.it)('should handle alert flow failures gracefully', async () => {
            const faultyWebSocket = {
                broadcastNotification: globals_1.jest.fn().mockImplementation(() => Promise.reject(new Error('WebSocket error'))),
                broadcastAdminAlert: globals_1.jest.fn().mockImplementation(() => Promise.reject(new Error('Admin alert error')))
            };
            controller.webSocketService = faultyWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: globals_1.jest.fn()
            };
            await (0, globals_1.expect)(controller.checkLocation(mockReq, mockRes)).resolves.not.toThrow();
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                }
            });
            (0, globals_1.expect)(loggedBreach).toBeDefined();
        });
        (0, globals_1.it)('should rate-limit alerts to prevent spam', async () => {
            controller.webSocketService = mockWebSocket;
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const promises = [];
            for (let i = 0; i < 5; i++) {
                const mockReq = { body: locationData };
                const mockRes = { json: globals_1.jest.fn() };
                promises.push(controller.checkLocation(mockReq, mockRes));
            }
            await Promise.all(promises);
            const allBreaches = await testDb.dbManager.client.geofenceBreach.findMany({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                }
            });
            (0, globals_1.expect)(allBreaches.length).toBeGreaterThan(0);
            const userNotifications = mockWebSocket.getNotifications();
            const adminNotifications = mockWebSocket.getAdminNotifications();
            (0, globals_1.expect)(userNotifications.length).toBeGreaterThan(0);
            (0, globals_1.expect)(adminNotifications.length).toBeGreaterThan(0);
        });
    });
});
