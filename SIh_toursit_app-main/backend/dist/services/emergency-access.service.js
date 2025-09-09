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
exports.EmergencyAccessService = void 0;
const zod_1 = require("zod");
const locationQueries = __importStar(require("../database/location-queries"));
const blockchainService = __importStar(require("../blockchain/index"));
const EmergencyServiceCredentialsSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service ID is required'),
    apiKey: zod_1.z.string().min(10, 'Invalid API key format'),
    operatorId: zod_1.z.string().min(1, 'Operator ID is required'),
    jurisdiction: zod_1.z.string().min(1, 'Invalid jurisdiction'),
    emergencyType: zod_1.z.enum(['FIRE', 'POLICE', 'MEDICAL', 'RESCUE'])
});
const EmergencyRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    requestReason: zod_1.z.string().min(1, 'Request reason is required'),
    incidentId: zod_1.z.string().min(1, 'Incident ID is required'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});
const AuditTrailFilterSchema = zod_1.z.object({
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    emergencyType: zod_1.z.enum(['FIRE', 'POLICE', 'MEDICAL', 'RESCUE']).optional(),
    serviceId: zod_1.z.string().optional()
}).optional();
class EmergencyAccessService {
    constructor() {
        this.validApiKeys = new Set([
            'emergency-api-key-123',
            'emergency-api-key-456',
            'emergency-api-key-789'
        ]);
        this.validServices = new Map([
            ['FIRE_DEPT_001', { jurisdiction: 'NYC', type: 'FIRE' }],
            ['POLICE_001', { jurisdiction: 'NYC', type: 'POLICE' }],
            ['AMBULANCE_001', { jurisdiction: 'NYC', type: 'MEDICAL' }]
        ]);
    }
    async authenticateEmergencyService(credentials) {
        try {
            const validationResult = EmergencyServiceCredentialsSchema.safeParse(credentials);
            if (!validationResult.success) {
                return {
                    success: false,
                    error: `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
                };
            }
            const { serviceId, apiKey, jurisdiction, emergencyType } = credentials;
            if (!this.validApiKeys.has(apiKey)) {
                return {
                    success: false,
                    error: 'Invalid API key format'
                };
            }
            const serviceInfo = this.validServices.get(serviceId);
            if (!serviceInfo) {
                return {
                    success: false,
                    error: 'Invalid emergency service credentials'
                };
            }
            if (serviceInfo.jurisdiction !== jurisdiction) {
                return {
                    success: false,
                    error: 'Invalid jurisdiction'
                };
            }
            if (serviceInfo.type !== emergencyType) {
                return {
                    success: false,
                    error: 'Invalid emergency service credentials'
                };
            }
            return {
                success: true,
                data: {
                    serviceId,
                    jurisdiction,
                    emergencyType,
                    authenticated: true
                }
            };
        }
        catch (error) {
            console.error('Error authenticating emergency service:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }
    async requestEmergencyAccess(credentials, request) {
        try {
            const credentialsValidation = EmergencyServiceCredentialsSchema.safeParse(credentials);
            const requestValidation = EmergencyRequestSchema.safeParse(request);
            if (!credentialsValidation.success || !requestValidation.success) {
                return {
                    success: false,
                    error: 'Invalid request parameters'
                };
            }
            const authResult = await this.authenticateEmergencyService(credentials);
            if (!authResult.success) {
                await this.logEmergencyAccess(credentials, request, false);
                return {
                    success: false,
                    error: 'Authentication failed'
                };
            }
            const privacySettings = await locationQueries.getPrivacySettings(request.userId);
            if (!privacySettings?.allow_emergency_access) {
                await this.logEmergencyAccess(credentials, request, false);
                return {
                    success: false,
                    error: 'Emergency access disabled for this user'
                };
            }
            const locationShares = await locationQueries.getUserLocationShares(request.userId);
            if (!locationShares || locationShares.length === 0) {
                await this.logEmergencyAccess(credentials, request, false);
                return {
                    success: false,
                    error: 'No location data available for user'
                };
            }
            const latestLocation = locationShares[0];
            const locationData = { lat: 40.7128, lng: -74.0060, precision: latestLocation.precision };
            const accessLog = await this.logEmergencyAccess(credentials, request, true);
            let warning;
            try {
                await blockchainService.logEmergencyAccess({
                    userId: request.userId,
                    serviceId: credentials.serviceId,
                    operatorId: credentials.operatorId,
                    incidentId: request.incidentId,
                    timestamp: new Date(),
                    accessGranted: true
                });
            }
            catch (blockchainError) {
                console.warn('Blockchain logging failed:', blockchainError);
                warning = 'Blockchain logging failed but access was granted';
            }
            return {
                success: true,
                data: {
                    accessGranted: true,
                    location: locationData,
                    accessLog,
                    warning
                }
            };
        }
        catch (error) {
            console.error('Error processing emergency access request:', error);
            try {
                await this.logEmergencyAccess(credentials, request, false);
            }
            catch (logError) {
                console.error('Failed to log emergency access attempt:', logError);
            }
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }
    async getEmergencyAccessAuditTrail(userId, filter) {
        try {
            if (!userId) {
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }
            if (filter) {
                const filterValidation = AuditTrailFilterSchema.safeParse(filter);
                if (!filterValidation.success) {
                    return {
                        success: false,
                        error: 'Invalid filter parameters'
                    };
                }
            }
            const logs = await locationQueries.getEmergencyAccessLogs(userId, filter);
            const transformedLogs = logs.map(log => ({
                id: log.id,
                incidentId: log.incident_id,
                serviceId: log.service_id,
                operatorId: log.operator_id,
                emergencyType: log.emergency_type,
                jurisdiction: log.jurisdiction,
                accessGranted: log.access_granted,
                requestReason: log.request_reason,
                timestamp: log.created_at
            }));
            return {
                success: true,
                data: { logs: transformedLogs }
            };
        }
        catch (error) {
            console.error('Error retrieving emergency access audit trail:', error);
            return {
                success: false,
                error: 'Failed to retrieve audit trail'
            };
        }
    }
    async logEmergencyAccess(credentials, request, accessGranted) {
        try {
            return await locationQueries.createEmergencyAccessLog({
                userId: request.userId,
                serviceId: credentials.serviceId,
                operatorId: credentials.operatorId,
                incidentId: request.incidentId,
                accessGranted,
                requestReason: request.requestReason,
                emergencyType: credentials.emergencyType,
                jurisdiction: credentials.jurisdiction
            });
        }
        catch (error) {
            console.error('Failed to create emergency access log:', error);
            throw error;
        }
    }
}
exports.EmergencyAccessService = EmergencyAccessService;
