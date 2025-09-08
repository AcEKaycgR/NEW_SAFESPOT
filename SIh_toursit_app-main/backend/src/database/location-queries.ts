import { PrismaClient, LocationPrecision as PrismaLocationPrecision } from '../generated/prisma/index.js';
import { 
  LocationSharingSettings,
  LocationAccessLog,
  LocationHistoryEntry,
  LocationPrivacySettings,
  GeofenceArea,
  EmergencyLocationRequest,
  LocationPrecision
} from '../types/location.js';

/**
 * Database queries for location-related operations
 */

const prisma = new PrismaClient();

// Helper function to convert TypeScript enum values to Prisma enum values
function convertPrecisionToPrisma(precision: string): PrismaLocationPrecision {
  const mapping: Record<string, PrismaLocationPrecision> = {
    'exact': 'EXACT',
    'street': 'STREET', 
    'neighborhood': 'NEIGHBORHOOD',
    'city': 'CITY'
  };
  return mapping[precision] || 'STREET'; // Default to STREET if not found
}

export class LocationQueries {
  
  /**
   * User Management for Testing
   */
  
  async ensureUserExists(userId: number, email: string, name: string) {
    try {
      // Try to find the user first
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (existingUser) {
        return existingUser;
      }

      // If user doesn't exist, create them
      return await prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: name,
          verification_status: 'VERIFIED'
        }
      });
    } catch (error) {
      // If user exists but with different email, just return
      // This handles the case where user exists but we're trying to create with different data
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (existingUser) {
        return existingUser;
      }
      throw error;
    }
  }
  
  /**
   * Location Sharing Settings Operations
   */
  
  async createLocationSharing(data: {
    userId: number;
    precision: string;
    expiresAt: Date;
    emergencyOverride?: boolean;
    allowedAccessors?: string[];
  }) {
    return await prisma.locationSharingSettings.create({
      data: {
        user_id: data.userId,
        status: 'ACTIVE',
        precision: convertPrecisionToPrisma(data.precision) as any,
        expires_at: data.expiresAt,
        emergency_override: data.emergencyOverride || false,
        allowed_accessors: JSON.stringify(data.allowedAccessors || []),
      },
    });
  }

  async getLocationSharing(id: number) {
    const sharing = await prisma.locationSharingSettings.findUnique({
      where: { 
        id
      },
      include: {
        user: true,
        access_logs: {
          orderBy: { accessed_at: 'desc' },
          take: 10,
        },
      },
    });
    
    if (sharing) {
      return {
        ...sharing,
        allowed_accessors: JSON.parse(sharing.allowed_accessors),
      };
    }
    return null;
  }

  async updateLocationSharing(id: number, data: {
    status?: string;
    precision?: string;
    expiresAt?: Date;
    emergencyOverride?: boolean;
    allowedAccessors?: string[];
  }) {
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status;
    if (data.precision) updateData.precision = convertPrecisionToPrisma(data.precision);
    if (data.expiresAt) updateData.expires_at = data.expiresAt;
    if (data.emergencyOverride !== undefined) updateData.emergency_override = data.emergencyOverride;
    if (data.allowedAccessors) updateData.allowed_accessors = JSON.stringify(data.allowedAccessors);
    
    return await prisma.locationSharingSettings.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteLocationSharing(id: number) {
    return await prisma.locationSharingSettings.delete({
      where: { id },
    });
  }

  async getUserLocationSharing(userId: number) {
    const sharing = await prisma.locationSharingSettings.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return sharing.map(s => ({
      ...s,
      allowed_accessors: JSON.parse(s.allowed_accessors),
    }));
  }

  async getActiveLocationSharing(userId: number) {
    const sharing = await prisma.locationSharingSettings.findFirst({
      where: { 
        user_id: userId,
        status: 'ACTIVE',
        expires_at: {
          gt: new Date(),
        },
      },
    });
    
    if (sharing) {
      return {
        ...sharing,
        allowed_accessors: JSON.parse(sharing.allowed_accessors),
      };
    }
    return null;
  }

  /**
   * Location Access Log Operations
   */
  
  async createLocationAccessLog(data: {
    sharingId: number;
    accessorId: number;
    accessorType: string;
    encryptedCoordinates: string;
    salt: string;
    iv: string;
    precision: string;
    reason?: string;
    blockchainHash?: string;
  }) {
    return await prisma.locationAccessLog.create({
      data: {
        sharing_id: data.sharingId,
        accessor_id: data.accessorId,
        accessor_type: data.accessorType as any,
        encrypted_coordinates: data.encryptedCoordinates,
        salt: data.salt,
        iv: data.iv,
        precision: data.precision as any,
        reason: data.reason,
        blockchain_hash: data.blockchainHash,
      },
    });
  }

  async getLocationAccessLogs(sharingId: number) {
    return await prisma.locationAccessLog.findMany({
      where: { sharing_id: sharingId },
      include: {
        accessor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { accessed_at: 'desc' },
    });
  }

  async getUserAccessLogs(userId: number) {
    return await prisma.locationAccessLog.findMany({
      where: {
        sharing_settings: {
          user_id: userId,
        },
      },
      include: {
        accessor: {
          select: { id: true, name: true, email: true },
        },
        sharing_settings: true,
      },
      orderBy: { accessed_at: 'desc' },
    });
  }

  /**
   * Location History Operations
   */
  
  async createLocationHistoryEntry(data: {
    userId: number;
    encryptedCoordinates: string;
    salt: string;
    iv: string;
    precision: string;
    accuracy: number;
    source: string;
    retainUntil: Date;
  }) {
    return await prisma.locationHistoryEntry.create({
      data: {
        user_id: data.userId,
        encrypted_coordinates: data.encryptedCoordinates,
        salt: data.salt,
        iv: data.iv,
        precision: data.precision as any,
        accuracy: data.accuracy,
        source: data.source as any,
        retain_until: data.retainUntil,
      },
    });
  }

  async getUserLocationHistory(userId: number, limit: number = 50) {
    return await prisma.locationHistoryEntry.findMany({
      where: { 
        user_id: userId,
        retain_until: {
          gt: new Date(),
        },
      },
      orderBy: { recorded_at: 'desc' },
      take: limit,
    });
  }

  async cleanupExpiredLocationHistory() {
    return await prisma.locationHistoryEntry.deleteMany({
      where: {
        retain_until: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Privacy Settings Operations
   */
  
  async createOrUpdatePrivacySettings(data: {
    userId: number;
    defaultPrecision?: string;
    allowEmergencyAccess?: boolean;
    historyRetentionDays?: number;
    notifyOnAccess?: boolean;
    autoExpireMinutes?: number;
    trustedAuthorities?: string[];
  }) {
    const settingsData: any = {
      user_id: data.userId,
    };
    
    if (data.defaultPrecision) settingsData.default_precision = data.defaultPrecision;
    if (data.allowEmergencyAccess !== undefined) settingsData.allow_emergency_access = data.allowEmergencyAccess;
    if (data.historyRetentionDays) settingsData.history_retention_days = data.historyRetentionDays;
    if (data.notifyOnAccess !== undefined) settingsData.notify_on_access = data.notifyOnAccess;
    if (data.autoExpireMinutes) settingsData.auto_expire_minutes = data.autoExpireMinutes;
    if (data.trustedAuthorities) settingsData.trusted_authorities = JSON.stringify(data.trustedAuthorities);
    
    return await prisma.locationPrivacySettings.upsert({
      where: { user_id: data.userId },
      update: settingsData,
      create: {
        ...settingsData,
        trusted_authorities: JSON.stringify(data.trustedAuthorities || []),
      },
    });
  }

  async getPrivacySettings(userId: number) {
    const settings = await prisma.locationPrivacySettings.findUnique({
      where: { user_id: userId },
    });
    
    if (settings) {
      return {
        ...settings,
        trusted_authorities: JSON.parse(settings.trusted_authorities),
      };
    }
    return null;
  }

  async updatePrivacySettings(userId: number, data: {
    default_precision?: string;
    allow_emergency_access?: boolean;
    history_retention_days?: number;
    notify_on_access?: boolean;
    auto_expire_minutes?: number;
    trusted_authorities?: number[];
  }) {
    const updateData: any = {};
    
    if (data.default_precision) updateData.default_precision = convertPrecisionToPrisma(data.default_precision);
    if (data.allow_emergency_access !== undefined) updateData.allow_emergency_access = data.allow_emergency_access;
    if (data.history_retention_days) updateData.history_retention_days = data.history_retention_days;
    if (data.notify_on_access !== undefined) updateData.notify_on_access = data.notify_on_access;
    if (data.auto_expire_minutes) updateData.auto_expire_minutes = data.auto_expire_minutes;
    if (data.trusted_authorities !== undefined) updateData.trusted_authorities = JSON.stringify(data.trusted_authorities);
    
    return await prisma.locationPrivacySettings.upsert({
      where: { user_id: userId },
      update: updateData,
      create: {
        user_id: userId,
        default_precision: convertPrecisionToPrisma(data.default_precision || 'street'),
        allow_emergency_access: data.allow_emergency_access !== undefined ? data.allow_emergency_access : true,
        history_retention_days: data.history_retention_days || 30,
        notify_on_access: data.notify_on_access !== undefined ? data.notify_on_access : true,
        auto_expire_minutes: data.auto_expire_minutes || 240,
        trusted_authorities: JSON.stringify(data.trusted_authorities || []),
      },
    });
  }

  /**
   * Emergency Request Operations
   */
  
  async createEmergencyRequest(data: {
    requestId: string;
    authorityId: number;
    targetUserId: number;
    reason: string;
    urgencyLevel: string;
    expiresAt: Date;
  }) {
    return await prisma.emergencyLocationRequest.create({
      data: {
        request_id: data.requestId,
        authority_id: data.authorityId,
        target_user_id: data.targetUserId,
        reason: data.reason,
        urgency_level: data.urgencyLevel as any,
        expires_at: data.expiresAt,
      },
    });
  }

  async approveEmergencyRequest(requestId: string) {
    return await prisma.emergencyLocationRequest.update({
      where: { request_id: requestId },
      data: { approved_at: new Date() },
    });
  }

  async getEmergencyRequest(requestId: string) {
    return await prisma.emergencyLocationRequest.findUnique({
      where: { request_id: requestId },
      include: {
        authority: {
          select: { id: true, name: true, email: true },
        },
        target_user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Cleanup Operations
   */
  
  async cleanupExpiredSharing() {
    return await prisma.locationSharingSettings.updateMany({
      where: {
        status: 'ACTIVE',
        expires_at: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  async cleanupExpiredEmergencyRequests() {
    return await prisma.emergencyLocationRequest.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
        approved_at: null,
      },
    });
  }
}

export const locationQueries = new LocationQueries();

// Export functions for direct import (for compatibility with existing code)
export const getUserLocationShares = async (userId: string) => {
  const numericUserId = parseInt(userId, 10);
  return await locationQueries.getUserLocationSharing(numericUserId);
};

export const getPrivacySettings = async (userId: string) => {
  const numericUserId = parseInt(userId, 10);
  return await locationQueries.getPrivacySettings(numericUserId);
};

export const updatePrivacySettings = async (userId: string, settings: any) => {
  const numericUserId = parseInt(userId, 10);
  return await locationQueries.updatePrivacySettings(numericUserId, settings);
};

// Emergency Access Functions
export const createEmergencyAccessLog = async (data: {
  userId: string;
  serviceId: string;
  operatorId: string;
  incidentId: string;
  accessGranted: boolean;
  requestReason: string;
  emergencyType: string;
  jurisdiction: string;
}) => {
  return await prisma.emergencyAccessLog.create({
    data: {
      user_id: data.userId,
      service_id: data.serviceId,
      operator_id: data.operatorId,
      incident_id: data.incidentId,
      access_granted: data.accessGranted,
      request_reason: data.requestReason,
      emergency_type: data.emergencyType,
      jurisdiction: data.jurisdiction,
      created_at: new Date()
    }
  });
};

export const getEmergencyAccessLogs = async (userId: string, filter?: {
  startDate?: Date;
  endDate?: Date;
  emergencyType?: string;
  serviceId?: string;
}) => {
  const whereClause: any = {
    user_id: userId
  };

  if (filter?.startDate || filter?.endDate) {
    whereClause.created_at = {};
    if (filter.startDate) whereClause.created_at.gte = filter.startDate;
    if (filter.endDate) whereClause.created_at.lte = filter.endDate;
  }

  if (filter?.emergencyType) {
    whereClause.emergency_type = filter.emergencyType;
  }

  if (filter?.serviceId) {
    whereClause.service_id = filter.serviceId;
  }

  return await prisma.emergencyAccessLog.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' }
  });
};
