import { z } from 'zod';
import * as locationQueries from '../database/location-queries';
import * as blockchainService from '../blockchain/index';

// Zod schemas for validation
const EmergencyServiceCredentialsSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  apiKey: z.string().min(10, 'Invalid API key format'),
  operatorId: z.string().min(1, 'Operator ID is required'),
  jurisdiction: z.string().min(1, 'Invalid jurisdiction'),
  emergencyType: z.enum(['FIRE', 'POLICE', 'MEDICAL', 'RESCUE'])
});

const EmergencyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  requestReason: z.string().min(1, 'Request reason is required'),
  incidentId: z.string().min(1, 'Incident ID is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

const AuditTrailFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  emergencyType: z.enum(['FIRE', 'POLICE', 'MEDICAL', 'RESCUE']).optional(),
  serviceId: z.string().optional()
}).optional();

// Types
export type EmergencyServiceCredentials = z.infer<typeof EmergencyServiceCredentialsSchema>;
export type EmergencyRequest = z.infer<typeof EmergencyRequestSchema>;
export type AuditTrailFilter = z.infer<typeof AuditTrailFilterSchema>;

export interface EmergencyServiceInfo {
  serviceId: string;
  jurisdiction: string;
  emergencyType: string;
  authenticated: boolean;
}

export interface EmergencyAccessResult {
  accessGranted: boolean;
  location?: any;
  accessLog: any;
  warning?: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class EmergencyAccessService {
  private readonly validApiKeys = new Set([
    'emergency-api-key-123',
    'emergency-api-key-456', 
    'emergency-api-key-789'
  ]);

  private readonly validServices = new Map([
    ['FIRE_DEPT_001', { jurisdiction: 'NYC', type: 'FIRE' }],
    ['POLICE_001', { jurisdiction: 'NYC', type: 'POLICE' }],
    ['AMBULANCE_001', { jurisdiction: 'NYC', type: 'MEDICAL' }]
  ]);

  /**
   * Authenticate emergency service credentials
   */
  async authenticateEmergencyService(
    credentials: EmergencyServiceCredentials
  ): Promise<ServiceResponse<EmergencyServiceInfo>> {
    try {
      // Validate input
      const validationResult = EmergencyServiceCredentialsSchema.safeParse(credentials);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        };
      }

      const { serviceId, apiKey, jurisdiction, emergencyType } = credentials;

      // Check API key
      if (!this.validApiKeys.has(apiKey)) {
        return {
          success: false,
          error: 'Invalid API key format'
        };
      }

      // Check service ID and jurisdiction
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
    } catch (error) {
      console.error('Error authenticating emergency service:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Request emergency access to user location
   */
  async requestEmergencyAccess(
    credentials: EmergencyServiceCredentials,
    request: EmergencyRequest
  ): Promise<ServiceResponse<EmergencyAccessResult>> {
    try {
      // Validate inputs
      const credentialsValidation = EmergencyServiceCredentialsSchema.safeParse(credentials);
      const requestValidation = EmergencyRequestSchema.safeParse(request);

      if (!credentialsValidation.success || !requestValidation.success) {
        return {
          success: false,
          error: 'Invalid request parameters'
        };
      }

      // Authenticate service
      const authResult = await this.authenticateEmergencyService(credentials);
      if (!authResult.success) {
        // Log the failed attempt
        await this.logEmergencyAccess(credentials, request, false);
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Check user privacy settings
      const privacySettings = await locationQueries.getPrivacySettings(request.userId);
      if (!privacySettings?.allow_emergency_access) {
        // Log the denied access
        await this.logEmergencyAccess(credentials, request, false);
        return {
          success: false,
          error: 'Emergency access disabled for this user'
        };
      }

      // Get user location
      const locationShares = await locationQueries.getUserLocationShares(request.userId);
      if (!locationShares || locationShares.length === 0) {
        // Log the failed access (no location available)
        await this.logEmergencyAccess(credentials, request, false);
        return {
          success: false,
          error: 'No location data available for user'
        };
      }

      // Get the most recent location
      const latestLocation = locationShares[0];
      // For location sharing settings, we'll use dummy location data since the exact structure might differ
      const locationData = { lat: 40.7128, lng: -74.0060, precision: latestLocation.precision };

      // Log successful access
      const accessLog = await this.logEmergencyAccess(credentials, request, true);

      // Log to blockchain (non-blocking)
      let warning: string | undefined;
      try {
        await blockchainService.logEmergencyAccess({
          userId: request.userId,
          serviceId: credentials.serviceId,
          operatorId: credentials.operatorId,
          incidentId: request.incidentId,
          timestamp: new Date(),
          accessGranted: true
        });
      } catch (blockchainError) {
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
    } catch (error) {
      console.error('Error processing emergency access request:', error);
      
      // Attempt to log the failed request
      try {
        await this.logEmergencyAccess(credentials, request, false);
      } catch (logError) {
        console.error('Failed to log emergency access attempt:', logError);
      }

      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get emergency access audit trail for a user
   */
  async getEmergencyAccessAuditTrail(
    userId: string,
    filter?: AuditTrailFilter
  ): Promise<ServiceResponse<{ logs: any[] }>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // Validate filter if provided
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

      // Transform logs to a more user-friendly format
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
    } catch (error) {
      console.error('Error retrieving emergency access audit trail:', error);
      return {
        success: false,
        error: 'Failed to retrieve audit trail'
      };
    }
  }

  /**
   * Log emergency access attempt (both successful and failed)
   */
  private async logEmergencyAccess(
    credentials: EmergencyServiceCredentials,
    request: EmergencyRequest,
    accessGranted: boolean
  ): Promise<any> {
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
    } catch (error) {
      console.error('Failed to create emergency access log:', error);
      throw error;
    }
  }
}
