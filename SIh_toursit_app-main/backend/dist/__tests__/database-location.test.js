"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const location_queries_1 = require("../database/location-queries");
const database_setup_1 = require("../test-utils/database-setup");
describe('Location Database Operations', () => {
    const dbSetup = new database_setup_1.TestDatabaseSetup();
    let testUserId;
    let testAuthorityId;
    let testSharingId;
    beforeAll(async () => {
        await dbSetup.setup();
    });
    afterAll(async () => {
        await dbSetup.teardown();
    });
    beforeEach(async () => {
        await dbSetup.cleanup();
        const testUser = await dbSetup.userModel.createUser({
            email: 'testuser@example.com',
            name: 'Test User',
        });
        testUserId = testUser.id;
        const testAuthority = await dbSetup.userModel.createUser({
            email: 'authority@example.com',
            name: 'Test Authority',
        });
        testAuthorityId = testAuthority.id;
        const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
        const sharing = await location_queries_1.locationQueries.createLocationSharing({
            userId: testUserId,
            precision: 'STREET',
            expiresAt,
            emergencyOverride: true,
            allowedAccessors: [testAuthorityId.toString()],
        });
        testSharingId = sharing.id;
    });
    describe('Location Sharing Settings', () => {
        test('should create location sharing settings', async () => {
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
            const sharing = await location_queries_1.locationQueries.createLocationSharing({
                userId: testUserId,
                precision: 'STREET',
                expiresAt,
                emergencyOverride: true,
                allowedAccessors: [testAuthorityId.toString()],
            });
            expect(sharing).toBeDefined();
            expect(sharing.user_id).toBe(testUserId);
            expect(sharing.precision).toBe('STREET');
            expect(sharing.status).toBe('ACTIVE');
            expect(sharing.emergency_override).toBe(true);
        });
        test('should get location sharing with access logs', async () => {
            const retrieved = await location_queries_1.locationQueries.getLocationSharing(testSharingId);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(testSharingId);
            expect(retrieved.user).toBeDefined();
            expect(retrieved.access_logs).toBeDefined();
            expect(Array.isArray(retrieved.allowed_accessors)).toBe(true);
        });
        test('should update location sharing settings', async () => {
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
            const sharing = await location_queries_1.locationQueries.createLocationSharing({
                userId: testUserId,
                precision: 'STREET',
                expiresAt,
            });
            const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
            const updated = await location_queries_1.locationQueries.updateLocationSharing(sharing.id, {
                precision: 'neighborhood',
                expiresAt: newExpiresAt,
                emergencyOverride: true,
            });
            expect(updated.precision).toBe('NEIGHBORHOOD');
            expect(updated.emergency_override).toBe(true);
            expect(updated.expires_at.getTime()).toBe(newExpiresAt.getTime());
        });
        test('should get user active location sharing', async () => {
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
            await location_queries_1.locationQueries.createLocationSharing({
                userId: testUserId,
                precision: 'STREET',
                expiresAt,
            });
            const active = await location_queries_1.locationQueries.getActiveLocationSharing(testUserId);
            expect(active).toBeDefined();
            expect(active.status).toBe('ACTIVE');
            expect(active.user_id).toBe(testUserId);
        });
        test('should not get expired location sharing', async () => {
            await location_queries_1.locationQueries.updateLocationSharing(testSharingId, {
                status: 'EXPIRED'
            });
            const expiredDate = new Date(Date.now() - 1000);
            await location_queries_1.locationQueries.createLocationSharing({
                userId: testUserId,
                precision: 'STREET',
                expiresAt: expiredDate,
            });
            const active = await location_queries_1.locationQueries.getActiveLocationSharing(testUserId);
            expect(active).toBeNull();
        });
    });
    describe('Location Access Logs', () => {
        test('should create location access log', async () => {
            const accessLog = await location_queries_1.locationQueries.createLocationAccessLog({
                sharingId: testSharingId,
                accessorId: testAuthorityId,
                accessorType: 'AUTHORITY',
                encryptedCoordinates: 'encrypted_coords_123',
                salt: 'salt_123',
                iv: 'iv_123',
                precision: 'STREET',
                reason: 'Emergency response',
                blockchainHash: 'blockchain_hash_123',
            });
            expect(accessLog).toBeDefined();
            expect(accessLog.sharing_id).toBe(testSharingId);
            expect(accessLog.accessor_id).toBe(testAuthorityId);
            expect(accessLog.accessor_type).toBe('AUTHORITY');
            expect(accessLog.reason).toBe('Emergency response');
        });
        test('should get location access logs with accessor info', async () => {
            await location_queries_1.locationQueries.createLocationAccessLog({
                sharingId: testSharingId,
                accessorId: testAuthorityId,
                accessorType: 'AUTHORITY',
                encryptedCoordinates: 'encrypted_coords_123',
                salt: 'salt_123',
                iv: 'iv_123',
                precision: 'STREET',
            });
            const logs = await location_queries_1.locationQueries.getLocationAccessLogs(testSharingId);
            expect(logs).toHaveLength(1);
            expect(logs[0].accessor).toBeDefined();
            expect(logs[0].accessor.name).toBe('Test Authority');
        });
    });
    describe('Location History', () => {
        test('should create location history entry', async () => {
            const retainUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const historyEntry = await location_queries_1.locationQueries.createLocationHistoryEntry({
                userId: testUserId,
                encryptedCoordinates: 'encrypted_coords_123',
                salt: 'salt_123',
                iv: 'iv_123',
                precision: 'STREET',
                accuracy: 5.0,
                source: 'GPS',
                retainUntil,
            });
            expect(historyEntry).toBeDefined();
            expect(historyEntry.user_id).toBe(testUserId);
            expect(historyEntry.source).toBe('GPS');
            expect(historyEntry.accuracy).toBe(5.0);
        });
        test('should get user location history', async () => {
            const retainUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await location_queries_1.locationQueries.createLocationHistoryEntry({
                userId: testUserId,
                encryptedCoordinates: 'encrypted_coords_1',
                salt: 'salt_1',
                iv: 'iv_1',
                precision: 'STREET',
                accuracy: 5.0,
                source: 'GPS',
                retainUntil,
            });
            await location_queries_1.locationQueries.createLocationHistoryEntry({
                userId: testUserId,
                encryptedCoordinates: 'encrypted_coords_2',
                salt: 'salt_2',
                iv: 'iv_2',
                precision: 'NEIGHBORHOOD',
                accuracy: 10.0,
                source: 'NETWORK',
                retainUntil,
            });
            const history = await location_queries_1.locationQueries.getUserLocationHistory(testUserId);
            expect(history).toHaveLength(2);
            expect(history[0].recorded_at.getTime()).toBeGreaterThanOrEqual(history[1].recorded_at.getTime());
        });
        test('should not return expired location history', async () => {
            const expiredDate = new Date(Date.now() - 1000);
            await location_queries_1.locationQueries.createLocationHistoryEntry({
                userId: testUserId,
                encryptedCoordinates: 'expired_coords',
                salt: 'salt_expired',
                iv: 'iv_expired',
                precision: 'STREET',
                accuracy: 5.0,
                source: 'GPS',
                retainUntil: expiredDate,
            });
            const history = await location_queries_1.locationQueries.getUserLocationHistory(testUserId);
            expect(history).toHaveLength(0);
        });
    });
    describe('Privacy Settings', () => {
        test('should create privacy settings', async () => {
            const settings = await location_queries_1.locationQueries.createOrUpdatePrivacySettings({
                userId: testUserId,
                defaultPrecision: 'NEIGHBORHOOD',
                allowEmergencyAccess: true,
                historyRetentionDays: 60,
                notifyOnAccess: true,
                autoExpireMinutes: 480,
                trustedAuthorities: [testAuthorityId.toString()],
            });
            expect(settings).toBeDefined();
            expect(settings.user_id).toBe(testUserId);
            expect(settings.default_precision).toBe('NEIGHBORHOOD');
            expect(settings.allow_emergency_access).toBe(true);
            expect(settings.history_retention_days).toBe(60);
        });
        test('should update existing privacy settings', async () => {
            await location_queries_1.locationQueries.createOrUpdatePrivacySettings({
                userId: testUserId,
                defaultPrecision: 'STREET',
                allowEmergencyAccess: false,
            });
            const updated = await location_queries_1.locationQueries.createOrUpdatePrivacySettings({
                userId: testUserId,
                defaultPrecision: 'NEIGHBORHOOD',
                historyRetentionDays: 90,
            });
            expect(updated.default_precision).toBe('NEIGHBORHOOD');
            expect(updated.history_retention_days).toBe(90);
            expect(updated.allow_emergency_access).toBe(false);
        });
        test('should get privacy settings with parsed trusted authorities', async () => {
            await location_queries_1.locationQueries.createOrUpdatePrivacySettings({
                userId: testUserId,
                trustedAuthorities: [testAuthorityId.toString(), '999'],
            });
            const settings = await location_queries_1.locationQueries.getPrivacySettings(testUserId);
            expect(settings).toBeDefined();
            expect(Array.isArray(settings.trusted_authorities)).toBe(true);
            expect(settings.trusted_authorities).toContain(testAuthorityId.toString());
            expect(settings.trusted_authorities).toContain('999');
        });
    });
    describe('Emergency Requests', () => {
        test('should create emergency request', async () => {
            const requestId = 'emergency_' + Date.now();
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const request = await location_queries_1.locationQueries.createEmergencyRequest({
                requestId,
                authorityId: testAuthorityId,
                targetUserId: testUserId,
                reason: 'Missing person report',
                urgencyLevel: 'HIGH',
                expiresAt,
            });
            expect(request).toBeDefined();
            expect(request.request_id).toBe(requestId);
            expect(request.authority_id).toBe(testAuthorityId);
            expect(request.target_user_id).toBe(testUserId);
            expect(request.urgency_level).toBe('HIGH');
        });
        test('should approve emergency request', async () => {
            const requestId = 'emergency_' + Date.now();
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await location_queries_1.locationQueries.createEmergencyRequest({
                requestId,
                authorityId: testAuthorityId,
                targetUserId: testUserId,
                reason: 'Emergency situation',
                urgencyLevel: 'CRITICAL',
                expiresAt,
            });
            const approved = await location_queries_1.locationQueries.approveEmergencyRequest(requestId);
            expect(approved.approved_at).toBeDefined();
            expect(approved.approved_at).toBeInstanceOf(Date);
        });
        test('should get emergency request with user details', async () => {
            const requestId = 'emergency_' + Date.now();
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await location_queries_1.locationQueries.createEmergencyRequest({
                requestId,
                authorityId: testAuthorityId,
                targetUserId: testUserId,
                reason: 'Emergency situation',
                urgencyLevel: 'MEDIUM',
                expiresAt,
            });
            const request = await location_queries_1.locationQueries.getEmergencyRequest(requestId);
            expect(request).toBeDefined();
            expect(request.authority).toBeDefined();
            expect(request.target_user).toBeDefined();
            expect(request.authority.name).toBe('Test Authority');
            expect(request.target_user.name).toBe('Test User');
        });
    });
    describe('Cleanup Operations', () => {
        test('should cleanup expired sharing settings', async () => {
            const expiredDate = new Date(Date.now() - 1000);
            await location_queries_1.locationQueries.createLocationSharing({
                userId: testUserId,
                precision: 'STREET',
                expiresAt: expiredDate,
            });
            const result = await location_queries_1.locationQueries.cleanupExpiredSharing();
            expect(result.count).toBe(1);
            const sharing = await location_queries_1.locationQueries.getUserLocationSharing(testUserId);
            expect(sharing[0].status).toBe('EXPIRED');
        });
        test('should cleanup expired location history', async () => {
            const expiredDate = new Date(Date.now() - 1000);
            await location_queries_1.locationQueries.createLocationHistoryEntry({
                userId: testUserId,
                encryptedCoordinates: 'expired_coords',
                salt: 'salt_expired',
                iv: 'iv_expired',
                precision: 'STREET',
                accuracy: 5.0,
                source: 'GPS',
                retainUntil: expiredDate,
            });
            const result = await location_queries_1.locationQueries.cleanupExpiredLocationHistory();
            expect(result.count).toBe(1);
        });
    });
});
