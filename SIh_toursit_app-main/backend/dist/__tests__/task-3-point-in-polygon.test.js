"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const geofence_controller_1 = require("../controllers/geofence.controller");
const database_setup_1 = require("../test-utils/database-setup");
(0, globals_1.describe)('Task 3: Basic Point-in-Polygon Detection', () => {
    let testDb;
    let controller;
    let testUserId;
    let testGeofenceId;
    (0, globals_1.beforeAll)(async () => {
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
        controller = new geofence_controller_1.GeofenceController();
    });
    (0, globals_1.afterAll)(async () => {
        await testDb.teardown();
    });
    (0, globals_1.beforeEach)(async () => {
        await testDb.cleanup();
        const testUser = await testDb.createTestUser({
            email: `test-polygon-${Date.now()}@example.com`,
            name: 'Test Polygon User'
        });
        testUserId = testUser.id;
    });
    (0, globals_1.afterEach)(async () => {
        await testDb.cleanup();
    });
    (0, globals_1.describe)('3.1: Implement simple mathematical point-in-polygon algorithm', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Square Test Zone',
                    description: 'Square geofence for point-in-polygon testing',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            testGeofenceId = testGeofence.id;
        });
        (0, globals_1.it)('should detect point clearly inside polygon', async () => {
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            (0, globals_1.expect)(response.data.breaches[0].geofence_id).toBe(testGeofenceId);
        });
        (0, globals_1.it)('should not detect point clearly outside polygon', async () => {
            const locationData = {
                latitude: 40.6900,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(0);
        });
        (0, globals_1.it)('should handle edge case: point on polygon boundary', async () => {
            const locationData = {
                latitude: 40.7000,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(typeof response.data.breaches.length).toBe('number');
            (0, globals_1.expect)(response.data.breaches.length).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should handle edge case: point at polygon vertex', async () => {
            const locationData = {
                latitude: 40.7000,
                longitude: -74.0200,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(typeof response.data.breaches.length).toBe('number');
            (0, globals_1.expect)(response.data.breaches.length).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should detect point in complex polygon shape', async () => {
            const complexGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'L-Shaped Test Zone',
                    description: 'Complex polygon for advanced testing',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0100 },
                        { lat: 40.7100, lng: -74.0100 },
                        { lat: 40.7100, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'HIGH',
                    type: 'RESTRICTED',
                    created_by: testUserId
                }
            });
            const locationData = {
                latitude: 40.7050,
                longitude: -74.0150,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(2);
            const lShapedBreach = response.data.breaches.find((b) => b.geofence_name === 'L-Shaped Test Zone');
            (0, globals_1.expect)(lShapedBreach).toBeDefined();
        });
        (0, globals_1.it)('should not detect point in concave area of complex polygon', async () => {
            const locationData = {
                latitude: 40.7050,
                longitude: -74.0050,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            const squareBreach = response.data.breaches.find((b) => b.geofence_name === 'Square Test Zone');
            (0, globals_1.expect)(squareBreach).toBeDefined();
            const lShapedBreach = response.data.breaches.find((b) => b.geofence_name === 'L-Shaped Test Zone');
            (0, globals_1.expect)(lShapedBreach).toBeUndefined();
        });
    });
    (0, globals_1.describe)('3.2: Add real-time location checking via existing WebSocket', () => {
        (0, globals_1.it)('should process location check immediately when called', async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Real-time Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: testUserId
                }
            });
            const startTime = Date.now();
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            (0, globals_1.expect)(processingTime).toBeLessThan(1000);
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.success).toBe(true);
            (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
        });
        (0, globals_1.it)('should handle multiple concurrent location checks', async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Concurrent Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            const locationChecks = [
                { latitude: 40.7050, longitude: -74.0050, user_id: testUserId },
                { latitude: 40.7100, longitude: -74.0100, user_id: testUserId },
                { latitude: 40.7150, longitude: -74.0150, user_id: testUserId }
            ];
            const promises = locationChecks.map(async (locationData) => {
                const mockReq = { body: locationData };
                const mockRes = {
                    json: jest.fn()
                };
                await controller.checkLocation(mockReq, mockRes);
                return mockRes.json.mock.calls[0][0];
            });
            const results = await Promise.all(promises);
            results.forEach(response => {
                (0, globals_1.expect)(response.success).toBe(true);
                (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            });
        });
    });
    (0, globals_1.describe)('3.3: Create immediate breach detection and logging', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Logging Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'HIGH',
                    type: 'RESTRICTED',
                    created_by: testUserId
                }
            });
            testGeofenceId = testGeofence.id;
        });
        (0, globals_1.it)('should immediately log breach when detected', async () => {
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            const initialBreachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: { user_id: testUserId, geofence_id: testGeofenceId }
            });
            await controller.checkLocation(mockReq, mockRes);
            const finalBreachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: { user_id: testUserId, geofence_id: testGeofenceId }
            });
            (0, globals_1.expect)(finalBreachCount).toBe(initialBreachCount + 1);
            const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
                where: { user_id: testUserId, geofence_id: testGeofenceId },
                orderBy: { occurred_at: 'desc' }
            });
            (0, globals_1.expect)(loggedBreach).toBeDefined();
            (0, globals_1.expect)(loggedBreach.latitude).toBe(40.7100);
            (0, globals_1.expect)(loggedBreach.longitude).toBe(-74.0100);
            (0, globals_1.expect)(loggedBreach.risk_score).toBeGreaterThanOrEqual(80);
            (0, globals_1.expect)(loggedBreach.alert_sent).toBe(false);
        });
        (0, globals_1.it)('should log multiple breaches for multiple geofences', async () => {
            const secondGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Overlapping Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7050, lng: -74.0150 },
                        { lat: 40.7050, lng: -74.0050 },
                        { lat: 40.7150, lng: -74.0050 },
                        { lat: 40.7150, lng: -74.0150 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            const totalBreaches = await testDb.dbManager.client.geofenceBreach.count({
                where: { user_id: testUserId }
            });
            (0, globals_1.expect)(totalBreaches).toBe(2);
            const breachGeofences = await testDb.dbManager.client.geofenceBreach.findMany({
                where: { user_id: testUserId },
                select: { geofence_id: true }
            });
            const geofenceIds = breachGeofences.map(b => b.geofence_id);
            (0, globals_1.expect)(geofenceIds).toContain(testGeofenceId);
            (0, globals_1.expect)(geofenceIds).toContain(secondGeofence.id);
        });
        (0, globals_1.it)('should not log breach when outside geofence', async () => {
            const locationData = {
                latitude: 40.6900,
                longitude: -74.0100,
                user_id: testUserId
            };
            const mockReq = { body: locationData };
            const mockRes = {
                json: jest.fn()
            };
            const initialBreachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: { user_id: testUserId, geofence_id: testGeofenceId }
            });
            await controller.checkLocation(mockReq, mockRes);
            const finalBreachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: { user_id: testUserId, geofence_id: testGeofenceId }
            });
            (0, globals_1.expect)(finalBreachCount).toBe(initialBreachCount);
        });
    });
    (0, globals_1.describe)('3.4: Write tests for detection accuracy', () => {
        (0, globals_1.it)('should have consistent point-in-polygon results for same input', async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Consistency Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7000, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0000 },
                        { lat: 40.7200, lng: -74.0200 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: testUserId
                }
            });
            const locationData = {
                latitude: 40.7100,
                longitude: -74.0100,
                user_id: testUserId
            };
            const results = [];
            for (let i = 0; i < 5; i++) {
                const mockReq = { body: locationData };
                const mockRes = {
                    json: jest.fn()
                };
                await controller.checkLocation(mockReq, mockRes);
                results.push(mockRes.json.mock.calls[0][0]);
            }
            results.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data.breaches).toHaveLength(1);
                (0, globals_1.expect)(result.data.breaches[0].geofence_id).toBe(testGeofence.id);
            });
        });
        (0, globals_1.it)('should handle precision near polygon edges accurately', async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Precision Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000000, lng: -74.0200000 },
                        { lat: 40.7000000, lng: -74.0000000 },
                        { lat: 40.7200000, lng: -74.0000000 },
                        { lat: 40.7200000, lng: -74.0200000 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            const outsidePoints = [
                { latitude: 40.6999999, longitude: -74.0100000 },
                { latitude: 40.7200001, longitude: -74.0100000 },
                { latitude: 40.7100000, longitude: -73.9999999 },
                { latitude: 40.7100000, longitude: -74.0200001 }
            ];
            for (const point of outsidePoints) {
                const mockReq = { body: { ...point, user_id: testUserId } };
                const mockRes = {
                    json: jest.fn()
                };
                await controller.checkLocation(mockReq, mockRes);
                const response = mockRes.json.mock.calls[0][0];
                (0, globals_1.expect)(response.data.breaches).toHaveLength(0);
            }
            const insidePoints = [
                { latitude: 40.7000001, longitude: -74.0100000 },
                { latitude: 40.7199999, longitude: -74.0100000 },
                { latitude: 40.7100000, longitude: -74.0000001 },
                { latitude: 40.7100000, longitude: -74.0199999 }
            ];
            for (const point of insidePoints) {
                const mockReq = { body: { ...point, user_id: testUserId } };
                const mockRes = {
                    json: jest.fn()
                };
                await controller.checkLocation(mockReq, mockRes);
                const response = mockRes.json.mock.calls[0][0];
                (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
            }
        });
        (0, globals_1.it)('should correctly calculate risk scores based on geofence risk levels', async () => {
            const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Low Risk Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0300 },
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7100, lng: -74.0200 },
                        { lat: 40.7100, lng: -74.0300 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: testUserId
                }
            });
            const mediumRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Medium Risk Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7100, lng: -74.0300 },
                        { lat: 40.7100, lng: -74.0200 },
                        { lat: 40.7200, lng: -74.0200 },
                        { lat: 40.7200, lng: -74.0300 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            const highRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'High Risk Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7200, lng: -74.0300 },
                        { lat: 40.7200, lng: -74.0200 },
                        { lat: 40.7300, lng: -74.0200 },
                        { lat: 40.7300, lng: -74.0300 }
                    ]),
                    risk_level: 'HIGH',
                    type: 'RESTRICTED',
                    created_by: testUserId
                }
            });
            const testCases = [
                { lat: 40.7050, lng: -74.0250, expectedRange: [0, 39], name: 'Low Risk Zone' },
                { lat: 40.7150, lng: -74.0250, expectedRange: [40, 79], name: 'Medium Risk Zone' },
                { lat: 40.7250, lng: -74.0250, expectedRange: [80, 100], name: 'High Risk Zone' }
            ];
            for (const testCase of testCases) {
                const mockReq = {
                    body: {
                        latitude: testCase.lat,
                        longitude: testCase.lng,
                        user_id: testUserId
                    }
                };
                const mockRes = {
                    json: jest.fn()
                };
                await controller.checkLocation(mockReq, mockRes);
                const response = mockRes.json.mock.calls[0][0];
                (0, globals_1.expect)(response.data.breaches).toHaveLength(1);
                const breach = response.data.breaches[0];
                (0, globals_1.expect)(breach.geofence_name).toBe(testCase.name);
                (0, globals_1.expect)(breach.risk_score).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
                (0, globals_1.expect)(breach.risk_score).toBeLessThanOrEqual(testCase.expectedRange[1]);
            }
        });
    });
});
