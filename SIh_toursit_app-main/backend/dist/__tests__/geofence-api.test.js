"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const geofence_routes_1 = require("../routes/geofence.routes");
const database_setup_1 = require("../test-utils/database-setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
let currentTestUserId = 1;
app.use((req, res, next) => {
    req.user = { id: currentTestUserId };
    next();
});
app.use('/api', geofence_routes_1.geofenceRoutes);
(0, globals_1.describe)('Geofence API Endpoints', () => {
    let testDb;
    let testUserId;
    let testGeofenceId;
    (0, globals_1.beforeAll)(async () => {
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
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
        currentTestUserId = testUserId;
    });
    (0, globals_1.afterEach)(async () => {
        await testDb.cleanup();
    });
    (0, globals_1.describe)('POST /api/geofences', () => {
        (0, globals_1.it)('should create a new geofence with valid data', async () => {
            const geofenceData = {
                name: 'Test Safety Zone API',
                description: 'A test geofence created via API',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 },
                    { lat: 40.7123, lng: -74.0062 }
                ],
                risk_level: 'MEDIUM',
                type: 'ALERT_ZONE'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences')
                .send(geofenceData)
                .expect(201);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toMatchObject({
                name: geofenceData.name,
                description: geofenceData.description,
                risk_level: geofenceData.risk_level,
                type: geofenceData.type,
                is_active: true
            });
            (0, globals_1.expect)(response.body.data.polygon_coords).toEqual(geofenceData.polygon_coords);
            testGeofenceId = response.body.data.id;
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences')
                .send(invalidGeofenceData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation error');
        });
        (0, globals_1.it)('should reject geofence with invalid coordinates', async () => {
            const invalidGeofenceData = {
                name: 'Invalid Zone',
                polygon_coords: [
                    { lat: 200, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'LOW',
                type: 'SAFE_ZONE'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences')
                .send(invalidGeofenceData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation error');
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences')
                .send(invalidGeofenceData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation error');
        });
    });
    (0, globals_1.describe)('GET /api/geofences', () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/geofences')
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.geofences).toBeInstanceOf(Array);
            (0, globals_1.expect)(response.body.data.total).toBeGreaterThan(0);
            const testGeofence = response.body.data.geofences.find((g) => g.id === testGeofenceId);
            (0, globals_1.expect)(testGeofence).toBeDefined();
            (0, globals_1.expect)(testGeofence.name).toBe('Test Zone for GET');
        });
        (0, globals_1.it)('should filter geofences by risk level', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/geofences?risk_level=HIGH')
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.geofences).toBeInstanceOf(Array);
            response.body.data.geofences.forEach((geofence) => {
                (0, globals_1.expect)(geofence.risk_level).toBe('HIGH');
            });
        });
        (0, globals_1.it)('should filter geofences by type', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/geofences?type=RESTRICTED')
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.geofences).toBeInstanceOf(Array);
            response.body.data.geofences.forEach((geofence) => {
                (0, globals_1.expect)(geofence.type).toBe('RESTRICTED');
            });
        });
    });
    (0, globals_1.describe)('POST /api/geofences/check-location', () => {
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences/check-location')
                .send(locationData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.breaches).toBeInstanceOf(Array);
            (0, globals_1.expect)(response.body.data.breaches.length).toBeGreaterThan(0);
            const breach = response.body.data.breaches[0];
            (0, globals_1.expect)(breach.geofence_id).toBe(testGeofenceId);
            (0, globals_1.expect)(breach.geofence_name).toBe('Manhattan Test Zone');
            (0, globals_1.expect)(breach.risk_level).toBe('MEDIUM');
            (0, globals_1.expect)(breach.risk_score).toBeGreaterThanOrEqual(40);
            (0, globals_1.expect)(breach.risk_score).toBeLessThan(80);
            (0, globals_1.expect)(breach.recommendations).toBeInstanceOf(Array);
        });
        (0, globals_1.it)('should not detect breach for location outside geofence', async () => {
            const locationData = {
                latitude: 41.0000,
                longitude: -75.0000,
                user_id: testUserId
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences/check-location')
                .send(locationData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.breaches).toBeInstanceOf(Array);
            (0, globals_1.expect)(response.body.data.breaches.length).toBe(0);
        });
        (0, globals_1.it)('should validate location coordinates', async () => {
            const invalidLocationData = {
                latitude: 200,
                longitude: -74.0060,
                user_id: testUserId
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences/check-location')
                .send(invalidLocationData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation error');
        });
        (0, globals_1.it)('should require user_id', async () => {
            const locationData = {
                latitude: 40.7128,
                longitude: -74.0060
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences/check-location')
                .send(locationData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation error');
        });
        (0, globals_1.it)('should log breach in database', async () => {
            const locationData = {
                latitude: 40.7128,
                longitude: -74.0060,
                user_id: testUserId
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/geofences/check-location')
                .send(locationData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.breaches.length).toBeGreaterThan(0);
            const breachCount = await testDb.dbManager.client.geofenceBreach.count({
                where: {
                    user_id: testUserId,
                    geofence_id: testGeofenceId
                }
            });
            (0, globals_1.expect)(breachCount).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('GET /api/geofences/stats', () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/geofences/stats')
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toMatchObject({
                totalGeofences: globals_1.expect.any(Number),
                activeGeofences: globals_1.expect.any(Number),
                totalBreaches: globals_1.expect.any(Number),
                recentBreaches: globals_1.expect.any(Number)
            });
            (0, globals_1.expect)(response.body.data.totalGeofences).toBeGreaterThan(0);
            (0, globals_1.expect)(response.body.data.activeGeofences).toBeGreaterThan(0);
            (0, globals_1.expect)(response.body.data.totalBreaches).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('PUT /api/geofences/:id', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Original Zone',
                    description: 'Original description',
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
        });
        (0, globals_1.it)('should update geofence with valid data', async () => {
            const updateData = {
                name: 'Updated Zone',
                description: 'Updated description',
                risk_level: 'HIGH'
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/geofences/${testGeofenceId}`)
                .send(updateData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.name).toBe('Updated Zone');
            (0, globals_1.expect)(response.body.data.description).toBe('Updated description');
            (0, globals_1.expect)(response.body.data.risk_level).toBe('HIGH');
        });
        (0, globals_1.it)('should return 404 for non-existent geofence', async () => {
            const updateData = {
                name: 'Updated Zone'
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/geofences/99999')
                .send(updateData)
                .expect(404);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Geofence not found');
        });
    });
    (0, globals_1.describe)('DELETE /api/geofences/:id', () => {
        (0, globals_1.beforeEach)(async () => {
            const testGeofence = await testDb.dbManager.client.geofenceArea.create({
                data: {
                    name: 'Zone to Delete',
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
        (0, globals_1.it)('should soft delete geofence', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/geofences/${testGeofenceId}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.message).toBe('Geofence deleted successfully');
            const deletedGeofence = await testDb.dbManager.client.geofenceArea.findUnique({
                where: { id: testGeofenceId }
            });
            (0, globals_1.expect)(deletedGeofence?.is_active).toBe(false);
        });
        (0, globals_1.it)('should return 404 for non-existent geofence', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/geofences/99999')
                .expect(404);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Geofence not found');
        });
    });
});
