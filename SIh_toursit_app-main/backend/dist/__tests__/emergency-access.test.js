"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const database_setup_1 = require("../test-utils/database-setup");
const emergency_access_service_1 = require("../services/emergency-access.service");
const locationQueries = __importStar(require("../database/location-queries"));
const blockchainService = __importStar(require("../blockchain/index"));
jest.mock('../blockchain/index', () => ({
    logEmergencyAccess: jest.fn()
}));
const mockBlockchainService = blockchainService;
jest.mock('../database/location-queries', () => ({
    getUserLocationShares: jest.fn(),
    getPrivacySettings: jest.fn(),
    createEmergencyAccessLog: jest.fn(),
    getEmergencyAccessLogs: jest.fn()
}));
const mockLocationQueries = locationQueries;
describe('Emergency Access Service', () => {
    let testDbSetup;
    let emergencyService;
    beforeAll(async () => {
        testDbSetup = new database_setup_1.TestDatabaseSetup();
        await testDbSetup.setup();
    });
    afterAll(async () => {
        await testDbSetup.teardown();
    });
    beforeEach(async () => {
        await testDbSetup.cleanup();
        emergencyService = new emergency_access_service_1.EmergencyAccessService();
        jest.clearAllMocks();
    });
    describe('Emergency Service Authentication', () => {
        it('should authenticate valid emergency service credentials', async () => {
            const credentials = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const result = await emergencyService.authenticateEmergencyService(credentials);
            expect(result.success).toBe(true);
            expect(result.data?.authenticated).toBe(true);
            expect(result.data?.serviceId).toBe(credentials.serviceId);
            expect(result.data?.jurisdiction).toBe(credentials.jurisdiction);
            expect(result.data?.emergencyType).toBe(credentials.emergencyType);
        });
        it('should reject invalid emergency service credentials', async () => {
            const invalidCredentials = {
                serviceId: 'INVALID_SERVICE',
                apiKey: 'invalid-api-key',
                operatorId: 'OP-999',
                jurisdiction: 'UNKNOWN',
                emergencyType: 'UNKNOWN'
            };
            const result = await emergencyService.authenticateEmergencyService(invalidCredentials);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid enum value');
        });
        it('should validate emergency service API key format', async () => {
            const credentialsWithInvalidKey = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'short',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const result = await emergencyService.authenticateEmergencyService(credentialsWithInvalidKey);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid API key format');
        });
        it('should validate jurisdiction authority', async () => {
            const credentialsWithInvalidJurisdiction = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: '',
                emergencyType: 'FIRE'
            };
            const result = await emergencyService.authenticateEmergencyService(credentialsWithInvalidJurisdiction);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid jurisdiction');
        });
    });
    describe('Emergency Location Access', () => {
        beforeEach(() => {
            mockLocationQueries.getUserLocationShares.mockResolvedValue([
                {
                    id: 1,
                    user_id: 123,
                    status: 'ACTIVE',
                    precision: 'EXACT',
                    expires_at: new Date(Date.now() + 3600000),
                    created_at: new Date(),
                    updated_at: new Date(),
                    emergency_override: false,
                    allowed_accessors: []
                }
            ]);
            mockLocationQueries.getPrivacySettings.mockResolvedValue({
                id: 1,
                user_id: 123,
                default_precision: 'EXACT',
                allow_emergency_access: true,
                history_retention_days: 30,
                notify_on_access: true,
                auto_expire_minutes: 240,
                trusted_authorities: [],
                updated_at: new Date()
            });
            mockLocationQueries.createEmergencyAccessLog.mockResolvedValue({
                id: 'log-123',
                user_id: 'user-123',
                service_id: 'FIRE_DEPT_001',
                operator_id: 'OP-001',
                incident_id: 'INC-001',
                access_granted: true,
                request_reason: 'Fire emergency response',
                emergency_type: 'FIRE',
                jurisdiction: 'NYC',
                created_at: new Date()
            });
        });
        it('should grant emergency access to user location with valid credentials', async () => {
            const credentials = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const emergencyRequest = {
                userId: 'user-123',
                requestReason: 'Fire emergency response',
                incidentId: 'INC-001',
                priority: 'HIGH'
            };
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(true);
            expect(result.data?.location).toBeDefined();
            expect(result.data?.accessGranted).toBe(true);
            expect(result.data?.accessLog).toBeDefined();
        });
        it('should deny emergency access when user has disabled emergency access', async () => {
            mockLocationQueries.getPrivacySettings.mockResolvedValue({
                id: 1,
                user_id: 123,
                default_precision: 'EXACT',
                allow_emergency_access: false,
                history_retention_days: 30,
                notify_on_access: true,
                auto_expire_minutes: 240,
                trusted_authorities: [],
                updated_at: new Date()
            });
            const credentials = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const emergencyRequest = {
                userId: 'user-123',
                requestReason: 'Fire emergency response',
                incidentId: 'INC-001',
                priority: 'HIGH'
            };
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Emergency access disabled');
        });
        it('should deny emergency access with invalid credentials', async () => {
            const invalidCredentials = {
                serviceId: 'INVALID_SERVICE',
                apiKey: 'invalid-key',
                operatorId: 'OP-999',
                jurisdiction: 'UNKNOWN',
                emergencyType: 'UNKNOWN'
            };
            const emergencyRequest = {
                userId: 'user-123',
                requestReason: 'Emergency response',
                incidentId: 'INC-001',
                priority: 'HIGH'
            };
            const result = await emergencyService.requestEmergencyAccess(invalidCredentials, emergencyRequest);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid request parameters');
        });
        it('should handle database errors gracefully during emergency access', async () => {
            mockLocationQueries.getPrivacySettings.mockRejectedValue(new Error('Database error'));
            const credentials = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const emergencyRequest = {
                userId: 'user-123',
                requestReason: 'Fire emergency response',
                incidentId: 'INC-001',
                priority: 'HIGH'
            };
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Internal server error');
        });
    });
    describe('Emergency Access Logging', () => {
        it('should create audit log for successful emergency access', async () => {
            const credentials = {
                serviceId: 'POLICE_001',
                apiKey: 'emergency-api-key-456',
                operatorId: 'OP-002',
                jurisdiction: 'NYC',
                emergencyType: 'POLICE'
            };
            const emergencyRequest = {
                userId: 'user-456',
                requestReason: 'Missing person case',
                incidentId: 'INC-002',
                priority: 'MEDIUM'
            };
            mockLocationQueries.getPrivacySettings.mockResolvedValue({
                user_id: 'user-456',
                location_sharing_enabled: true,
                default_precision: 'EXACT',
                allow_emergency_access: true,
                emergency_contact_notification: true,
                data_retention_days: 30,
                auto_delete_enabled: false
            });
            mockLocationQueries.getUserLocationShares.mockResolvedValue([{
                    id: 'loc-001',
                    user_id: 'user-456',
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 10,
                    timestamp: new Date(),
                    is_encrypted: false,
                    precision: 'EXACT'
                }]);
            mockBlockchainService.logEmergencyAccess.mockResolvedValue({
                transactionHash: 'tx-hash-123',
                blockNumber: 12345
            });
            mockLocationQueries.createEmergencyAccessLog.mockResolvedValue({
                id: 'log-001',
                user_id: 'user-456',
                service_id: 'POLICE_001',
                operator_id: 'OP-002',
                incident_id: 'INC-002',
                access_granted: true,
                request_reason: 'Missing person case',
                emergency_type: 'POLICE',
                jurisdiction: 'NYC',
                created_at: new Date()
            });
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(true);
            expect(mockLocationQueries.createEmergencyAccessLog).toHaveBeenCalledWith({
                userId: 'user-456',
                serviceId: 'POLICE_001',
                operatorId: 'OP-002',
                incidentId: 'INC-002',
                accessGranted: true,
                requestReason: 'Missing person case',
                emergencyType: 'POLICE',
                jurisdiction: 'NYC'
            });
        });
        it('should create audit log for denied emergency access', async () => {
            const invalidCredentials = {
                serviceId: 'INVALID_SERVICE',
                apiKey: 'invalid-key',
                operatorId: 'OP-999',
                jurisdiction: 'UNKNOWN',
                emergencyType: 'FIRE'
            };
            const emergencyRequest = {
                userId: 'user-789',
                requestReason: 'Emergency response',
                incidentId: 'INC-003',
                priority: 'HIGH'
            };
            mockLocationQueries.createEmergencyAccessLog.mockResolvedValue({
                id: 'log-002',
                user_id: 'user-789',
                service_id: 'INVALID_SERVICE',
                operator_id: 'OP-999',
                incident_id: 'INC-003',
                access_granted: false,
                request_reason: 'Emergency response',
                emergency_type: 'FIRE',
                jurisdiction: 'UNKNOWN',
                created_at: new Date()
            });
            const result = await emergencyService.requestEmergencyAccess(invalidCredentials, emergencyRequest);
            expect(result.success).toBe(false);
            expect(mockLocationQueries.createEmergencyAccessLog).toHaveBeenCalledWith({
                userId: 'user-789',
                serviceId: 'INVALID_SERVICE',
                operatorId: 'OP-999',
                incidentId: 'INC-003',
                accessGranted: false,
                requestReason: 'Emergency response',
                emergencyType: 'FIRE',
                jurisdiction: 'UNKNOWN'
            });
        });
    });
    describe('Blockchain Integration', () => {
        beforeEach(() => {
            mockLocationQueries.getUserLocationShares.mockResolvedValue([
                {
                    id: 1,
                    user_id: 123,
                    status: 'ACTIVE',
                    precision: 'EXACT',
                    expires_at: new Date(Date.now() + 3600000),
                    created_at: new Date(),
                    updated_at: new Date(),
                    emergency_override: false,
                    allowed_accessors: []
                }
            ]);
            mockLocationQueries.getPrivacySettings.mockResolvedValue({
                id: 1,
                user_id: 123,
                default_precision: 'EXACT',
                allow_emergency_access: true,
                history_retention_days: 30,
                notify_on_access: true,
                auto_expire_minutes: 240,
                trusted_authorities: [],
                updated_at: new Date()
            });
            mockLocationQueries.createEmergencyAccessLog.mockResolvedValue({
                id: 'log-123',
                created_at: new Date()
            });
        });
        it('should log emergency access event to blockchain', async () => {
            mockBlockchainService.logEmergencyAccess.mockResolvedValue({
                success: true,
                transactionHash: '0x123456789',
                blockNumber: 12345
            });
            const credentials = {
                serviceId: 'AMBULANCE_001',
                apiKey: 'emergency-api-key-789',
                operatorId: 'OP-003',
                jurisdiction: 'NYC',
                emergencyType: 'MEDICAL'
            };
            const emergencyRequest = {
                userId: 'user-999',
                requestReason: 'Medical emergency',
                incidentId: 'INC-004',
                priority: 'CRITICAL'
            };
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(true);
            expect(mockBlockchainService.logEmergencyAccess).toHaveBeenCalledWith({
                userId: 'user-999',
                serviceId: 'AMBULANCE_001',
                operatorId: 'OP-003',
                incidentId: 'INC-004',
                timestamp: expect.any(Date),
                accessGranted: true
            });
        });
        it('should handle blockchain logging errors gracefully', async () => {
            mockBlockchainService.logEmergencyAccess.mockRejectedValue(new Error('Blockchain error'));
            const credentials = {
                serviceId: 'FIRE_DEPT_001',
                apiKey: 'emergency-api-key-123',
                operatorId: 'OP-001',
                jurisdiction: 'NYC',
                emergencyType: 'FIRE'
            };
            const emergencyRequest = {
                userId: 'user-123',
                requestReason: 'Fire emergency response',
                incidentId: 'INC-005',
                priority: 'HIGH'
            };
            const result = await emergencyService.requestEmergencyAccess(credentials, emergencyRequest);
            expect(result.success).toBe(true);
            expect(result.data?.warning).toContain('Blockchain logging failed');
        });
    });
    describe('Emergency Access Audit Trail', () => {
        it('should retrieve emergency access logs for a specific user', async () => {
            const mockLogs = [
                {
                    id: 'log-001',
                    user_id: 'user-123',
                    service_id: 'FIRE_DEPT_001',
                    operator_id: 'OP-001',
                    incident_id: 'INC-001',
                    access_granted: true,
                    request_reason: 'Fire emergency',
                    emergency_type: 'FIRE',
                    jurisdiction: 'NYC',
                    created_at: new Date()
                },
                {
                    id: 'log-002',
                    user_id: 'user-123',
                    service_id: 'POLICE_001',
                    operator_id: 'OP-002',
                    incident_id: 'INC-002',
                    access_granted: false,
                    request_reason: 'Investigation',
                    emergency_type: 'POLICE',
                    jurisdiction: 'NYC',
                    created_at: new Date()
                }
            ];
            mockLocationQueries.getEmergencyAccessLogs.mockResolvedValue(mockLogs);
            const result = await emergencyService.getEmergencyAccessAuditTrail('user-123');
            expect(result.success).toBe(true);
            expect(result.data?.logs).toHaveLength(2);
            expect(result.data?.logs[0]).toMatchObject({
                incidentId: 'INC-001',
                accessGranted: true,
                emergencyType: 'FIRE'
            });
        });
        it('should retrieve emergency access logs with date range filter', async () => {
            const startDate = new Date('2025-01-01');
            const endDate = new Date('2025-12-31');
            mockLocationQueries.getEmergencyAccessLogs.mockResolvedValue([]);
            const result = await emergencyService.getEmergencyAccessAuditTrail('user-123', { startDate, endDate });
            expect(result.success).toBe(true);
            expect(mockLocationQueries.getEmergencyAccessLogs).toHaveBeenCalledWith('user-123', { startDate, endDate });
        });
        it('should handle audit trail retrieval errors', async () => {
            mockLocationQueries.getEmergencyAccessLogs.mockRejectedValue(new Error('Database error'));
            const result = await emergencyService.getEmergencyAccessAuditTrail('user-123');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to retrieve audit trail');
        });
    });
});
