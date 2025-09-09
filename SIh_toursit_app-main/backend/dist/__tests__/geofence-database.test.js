"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const prisma_1 = require("../generated/prisma");
const geofence_queries_1 = require("../database/geofence-queries");
const prisma = new prisma_1.PrismaClient();
const geofenceDb = new geofence_queries_1.GeofenceDatabase();
(0, globals_1.describe)('Geofence Database Operations', () => {
    let testUserId;
    let testGeofenceId;
    (0, globals_1.beforeEach)(async () => {
        const timestamp = Date.now();
        const testUser = await prisma.user.create({
            data: {
                email: `test-${timestamp}@example.com`,
                name: 'Test User',
                blockchain_address: `0x123test${timestamp}`
            }
        });
        testUserId = testUser.id;
    });
    (0, globals_1.afterEach)(async () => {
        if (testUserId) {
            await prisma.geofenceBreach.deleteMany({
                where: { user_id: testUserId }
            });
            await prisma.geofenceArea.deleteMany({
                where: { created_by: testUserId }
            });
            await prisma.user.delete({
                where: { id: testUserId }
            });
        }
    });
    (0, globals_1.describe)('createGeofence', () => {
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
                type: 'SAFE_ZONE'
            };
            const result = await geofenceDb.createGeofence(geofenceData, testUserId);
            testGeofenceId = result.id;
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.name).toBe('Test Safety Zone');
            (0, globals_1.expect)(result.polygon_coords).toHaveLength(4);
            (0, globals_1.expect)(result.risk_level).toBe('MEDIUM');
            (0, globals_1.expect)(result.type).toBe('SAFE_ZONE');
            (0, globals_1.expect)(result.created_by).toBe(testUserId);
            (0, globals_1.expect)(result.is_active).toBe(true);
        });
        (0, globals_1.it)('should handle geofence creation with minimal data', async () => {
            const geofenceData = {
                name: 'Minimal Geofence',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'LOW',
                type: 'ALERT_ZONE'
            };
            const result = await geofenceDb.createGeofence(geofenceData, testUserId);
            testGeofenceId = result.id;
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.name).toBe('Minimal Geofence');
            (0, globals_1.expect)(result.description).toBe(null);
            (0, globals_1.expect)(result.polygon_coords).toHaveLength(3);
        });
    });
    (0, globals_1.describe)('getActiveGeofences', () => {
        (0, globals_1.beforeEach)(async () => {
            const geofence1 = await geofenceDb.createGeofence({
                name: 'Active Zone 1',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'HIGH',
                type: 'RESTRICTED'
            }, testUserId);
            const geofence2 = await geofenceDb.createGeofence({
                name: 'Active Zone 2',
                polygon_coords: [
                    { lat: 40.7140, lng: -74.0070 },
                    { lat: 40.7142, lng: -74.0068 },
                    { lat: 40.7138, lng: -74.0065 }
                ],
                risk_level: 'MEDIUM',
                type: 'ALERT_ZONE'
            }, testUserId);
            await geofenceDb.deleteGeofence(geofence2.id);
        });
        (0, globals_1.it)('should return only active geofences', async () => {
            const activeGeofences = await geofenceDb.getActiveGeofences();
            const testGeofences = activeGeofences.filter(g => g.created_by === testUserId);
            (0, globals_1.expect)(testGeofences).toHaveLength(1);
            (0, globals_1.expect)(testGeofences[0].name).toBe('Active Zone 1');
            (0, globals_1.expect)(testGeofences[0].is_active).toBe(true);
        });
    });
    (0, globals_1.describe)('logBreach', () => {
        (0, globals_1.beforeEach)(async () => {
            const geofence = await geofenceDb.createGeofence({
                name: 'Breach Test Zone',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'HIGH',
                type: 'RESTRICTED'
            }, testUserId);
            testGeofenceId = geofence.id;
        });
        (0, globals_1.it)('should log a geofence breach', async () => {
            const location = { latitude: 40.7129, longitude: -74.0059 };
            const riskScore = 85;
            const breach = await geofenceDb.logBreach(testUserId, testGeofenceId, location, riskScore);
            (0, globals_1.expect)(breach).toBeDefined();
            (0, globals_1.expect)(breach.user_id).toBe(testUserId);
            (0, globals_1.expect)(breach.geofence_id).toBe(testGeofenceId);
            (0, globals_1.expect)(breach.latitude).toBe(location.latitude);
            (0, globals_1.expect)(breach.longitude).toBe(location.longitude);
            (0, globals_1.expect)(breach.risk_score).toBe(riskScore);
            (0, globals_1.expect)(breach.alert_sent).toBe(false);
        });
    });
    (0, globals_1.describe)('getGeofenceStats', () => {
        (0, globals_1.beforeEach)(async () => {
            const geofence = await geofenceDb.createGeofence({
                name: 'Stats Test Zone',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'MEDIUM',
                type: 'ALERT_ZONE'
            }, testUserId);
            await geofenceDb.logBreach(testUserId, geofence.id, { latitude: 40.7129, longitude: -74.0059 }, 60);
        });
        (0, globals_1.it)('should return correct statistics', async () => {
            const stats = await geofenceDb.getGeofenceStats();
            (0, globals_1.expect)(stats).toBeDefined();
            (0, globals_1.expect)(typeof stats.totalGeofences).toBe('number');
            (0, globals_1.expect)(typeof stats.activeGeofences).toBe('number');
            (0, globals_1.expect)(typeof stats.totalBreaches).toBe('number');
            (0, globals_1.expect)(typeof stats.recentBreaches).toBe('number');
            (0, globals_1.expect)(stats.activeGeofences).toBeLessThanOrEqual(stats.totalGeofences);
        });
    });
    (0, globals_1.describe)('updateGeofence', () => {
        (0, globals_1.beforeEach)(async () => {
            const geofence = await geofenceDb.createGeofence({
                name: 'Update Test Zone',
                polygon_coords: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7130, lng: -74.0058 },
                    { lat: 40.7125, lng: -74.0055 }
                ],
                risk_level: 'LOW',
                type: 'SAFE_ZONE'
            }, testUserId);
            testGeofenceId = geofence.id;
        });
        (0, globals_1.it)('should update geofence properties', async () => {
            const updatedGeofence = await geofenceDb.updateGeofence(testGeofenceId, {
                name: 'Updated Zone Name',
                risk_level: 'HIGH'
            });
            (0, globals_1.expect)(updatedGeofence).toBeDefined();
            (0, globals_1.expect)(updatedGeofence.name).toBe('Updated Zone Name');
            (0, globals_1.expect)(updatedGeofence.risk_level).toBe('HIGH');
            (0, globals_1.expect)(updatedGeofence.type).toBe('SAFE_ZONE');
        });
    });
});
