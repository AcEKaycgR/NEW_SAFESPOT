"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const geofence_controller_1 = require("../controllers/geofence.controller");
const database_setup_1 = require("../test-utils/database-setup");
(0, globals_1.describe)('Task 2: Simple Geofence API', () => {
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
            email: `test-geofence-${Date.now()}@example.com`,
            name: 'Test Geofence User'
        });
        testUserId = testUser.id;
    });
    (0, globals_1.afterEach)(async () => {
        await testDb.cleanup();
    });
    (0, globals_1.describe)('2.1: Create POST /api/geofences endpoint for zone creation', () => {
        (0, globals_1.it)('should create a new geofence with valid data', async () => {
            const geofenceData = {
                name: 'Test Safety Zone',
                description: 'A test geofence for unit testing',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 },
                    { lat: 40.7123, lng: -74.0062 }
                ],
                risk_level: 'MEDIUM',
                type: 'ALERT_ZONE'
            };
            const mockReq = {
                body: geofenceData,
                user: { id: testUserId }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createGeofence(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: globals_1.expect.objectContaining({
                    name: geofenceData.name,
                    description: geofenceData.description,
                    risk_level: geofenceData.risk_level,
                    type: geofenceData.type,
                    is_active: true,
                    polygon_coords: geofenceData.polygon_coords
                })
            });
        });
        (0, globals_1.it)('should reject geofence with insufficient coordinates', async () => {
            const invalidGeofenceData = {
                name: 'Invalid Zone',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 }
                ],
                risk_level: 'LOW',
                type: 'SAFE_ZONE'
            };
            const mockReq = {
                body: invalidGeofenceData,
                user: { id: testUserId }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createGeofence(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation error',
                details: globals_1.expect.any(Array)
            });
        });
        (0, globals_1.it)('should reject geofence with invalid risk level', async () => {
            const invalidGeofenceData = {
                name: 'Invalid Zone',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'INVALID_LEVEL',
                type: 'SAFE_ZONE'
            };
            const mockReq = {
                body: invalidGeofenceData,
                user: { id: testUserId }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createGeofence(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation error',
                details: globals_1.expect.any(Array)
            });
        });
    });
    (0, globals_1.describe)('2.2: Add GET /api/geofences to list all zones', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Test Zone for GET',
                    description: 'Test geofence for API retrieval',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7128, lng: -74.0060 },
                        { lat: 40.7130, lng: -74.0058 },
                        { lat: 40.7125, lng: -74.0055 },
                        { lat: 40.7123, lng: -74.0062 }
                    ]),
                    risk_level: 'HIGH',
                    type: 'RESTRICTED',
                    created_by: testUserId
                }
            });
            testGeofenceId = testGeofence.id;
        });
        (0, globals_1.it)('should retrieve all active geofences', async () => {
            const mockReq = {
                query: {}
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.getGeofences(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    geofences: globals_1.expect.arrayContaining([
                        globals_1.expect.objectContaining({
                            id: testGeofenceId,
                            name: 'Test Zone for GET',
                            risk_level: 'HIGH',
                            type: 'RESTRICTED'
                        })
                    ]),
                    total: globals_1.expect.any(Number)
                }
            });
        });
        (0, globals_1.it)('should filter geofences by risk level', async () => {
            const mockReq = {
                query: { risk_level: 'HIGH' }
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.getGeofences(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    geofences: globals_1.expect.any(Array),
                    total: globals_1.expect.any(Number)
                }
            });
            const response = mockRes.json.mock.calls[0][0];
            response.data.geofences.forEach((geofence) => {
                (0, globals_1.expect)(geofence.risk_level).toBe('HIGH');
            });
        });
        (0, globals_1.it)('should filter geofences by type', async () => {
            const mockReq = {
                query: { type: 'RESTRICTED' }
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.getGeofences(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    geofences: globals_1.expect.any(Array),
                    total: globals_1.expect.any(Number)
                }
            });
            const response = mockRes.json.mock.calls[0][0];
            response.data.geofences.forEach((geofence) => {
                (0, globals_1.expect)(geofence.type).toBe('RESTRICTED');
            });
        });
    });
    (0, globals_1.describe)('2.3: Implement POST /api/check-location for breach detection', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Manhattan Test Zone',
                    description: 'Test geofence covering part of Manhattan',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7200, lng: -74.0200 },
                        { lat: 40.7200, lng: -73.9800 },
                        { lat: 40.7000, lng: -73.9800 }
                    ]),
                    risk_level: 'MEDIUM',
                    type: 'ALERT_ZONE',
                    created_by: testUserId
                }
            });
            testGeofenceId = testGeofence.id;
        });
        (0, globals_1.it)('should detect location inside geofence', async () => {
            const locationData = {
                latitude: 40.7128,
                longitude: -74.0060,
                user_id: testUserId
            };
            const mockReq = {
                body: locationData
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    breaches: globals_1.expect.arrayContaining([
                        globals_1.expect.objectContaining({
                            geofence_id: testGeofenceId,
                            geofence_name: 'Manhattan Test Zone',
                            risk_level: 'MEDIUM',
                            risk_score: globals_1.expect.any(Number),
                            recommendations: globals_1.expect.any(Array)
                        })
                    ])
                }
            });
            const response = mockRes.json.mock.calls[0][0];
            const breach = response.data.breaches[0];
            (0, globals_1.expect)(breach.risk_score).toBeGreaterThanOrEqual(40);
            (0, globals_1.expect)(breach.risk_score).toBeLessThan(80);
        });
        (0, globals_1.it)('should not detect breach for location outside geofence', async () => {
            const locationData = {
                latitude: 41.0000,
                longitude: -75.0000,
                user_id: testUserId
            };
            const mockReq = {
                body: locationData
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    breaches: []
                }
            });
        });
        (0, globals_1.it)('should validate location coordinates', async () => {
            const invalidLocationData = {
                latitude: 200,
                longitude: -74.0060,
                user_id: testUserId
            };
            const mockReq = {
                body: invalidLocationData
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation error',
                details: globals_1.expect.any(Array)
            });
        });
        (0, globals_1.it)('should log breach in database', async () => {
            const locationData = {
                latitude: 40.7128,
                longitude: -74.0060,
                user_id: testUserId
            };
            const mockReq = {
                body: locationData
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.checkLocation(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    breaches: globals_1.expect.any(Array)
                }
            });
            const breachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                }
            });
            (0, globals_1.expect)(breachCount).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('2.4: Write basic API tests for core functionality', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Stats Test Zone',
                    polygon_coords: JSON.stringify([
                        { lat: 40.7000, lng: -74.0200 },
                        { lat: 40.7200, lng: -74.0200 },
                        { lat: 40.7200, lng: -73.9800 },
                        { lat: 40.7000, lng: -73.9800 }
                    ]),
                    risk_level: 'LOW',
                    type: 'SAFE_ZONE',
                    created_by: testUserId
                }
            });
            testGeofenceId = testGeofence.id;
            await testDb.dbManager.client.geofenceBreach.create({
                data: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId,
                    latitude: 40.7128,
                    longitude: -74.0060,
                    risk_score: 25
                }
            });
        });
        (0, globals_1.it)('should return geofence statistics', async () => {
            const mockReq = {};
            const mockRes = {
                json: jest.fn()
            };
            await controller.getStats(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalGeofences: globals_1.expect.any(Number),
                    activeGeofences: globals_1.expect.any(Number),
                    totalBreaches: globals_1.expect.any(Number),
                    recentBreaches: globals_1.expect.any(Number)
                }
            });
            const response = mockRes.json.mock.calls[0][0];
            (0, globals_1.expect)(response.data.totalGeofences).toBeGreaterThan(0);
            (0, globals_1.expect)(response.data.activeGeofences).toBeGreaterThan(0);
            (0, globals_1.expect)(response.data.totalBreaches).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should update geofence with valid data', async () => {
            const updateData = {
                name: 'Updated Zone',
                description: 'Updated description',
                risk_level: 'HIGH'
            };
            const mockReq = {
                params: { id: testGeofenceId.toString() },
                body: updateData
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.updateGeofence(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: globals_1.expect.objectContaining({
                    name: 'Updated Zone',
                    description: 'Updated description',
                    risk_level: 'HIGH'
                })
            });
        });
        (0, globals_1.it)('should soft delete geofence', async () => {
            const mockReq = {
                params: { id: testGeofenceId.toString() }
            };
            const mockRes = {
                json: jest.fn()
            };
            await controller.deleteGeofence(mockReq, mockRes);
            (0, globals_1.expect)(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Geofence deleted successfully'
            });
            const deletedGeofence = await testDb.dbManager.client.geofenceArea.findUnique({
                where: { id: testGeofenceId }
            });
            (0, globals_1.expect)(deletedGeofence?.is_active).toBe(false);
        });
    });
});
