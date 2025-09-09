"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmergencyAccessLogs = exports.createEmergencyAccessLog = exports.updatePrivacySettings = exports.getPrivacySettings = exports.getUserLocationShares = exports.locationQueries = exports.LocationQueries = void 0;
const index_js_1 = require("../generated/prisma/index.js");
const prisma = new index_js_1.PrismaClient();
function convertPrecisionToPrisma(precision) {
    const mapping = {
        'exact': 'EXACT',
        'street': 'STREET',
        'neighborhood': 'NEIGHBORHOOD',
        'city': 'CITY'
    };
    return mapping[precision] || 'STREET';
}
class LocationQueries {
    async ensureUserExists(userId, email, name) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (existingUser) {
                return existingUser;
            }
            return await prisma.user.create({
                data: {
                    id: userId,
                    email: email,
                    name: name,
                    verification_status: 'VERIFIED'
                }
            });
        }
        catch (error) {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (existingUser) {
                return existingUser;
            }
            throw error;
        }
    }
    async createLocationSharing(data) {
        return await prisma.locationSharingSettings.create({
            data: {
                user_id: data.userId,
                status: 'ACTIVE',
                precision: convertPrecisionToPrisma(data.precision),
                expires_at: data.expiresAt,
                emergency_override: data.emergencyOverride || false,
                allowed_accessors: JSON.stringify(data.allowedAccessors || []),
            },
        });
    }
    async getLocationSharing(id) {
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
    async updateLocationSharing(id, data) {
        const updateData = {};
        if (data.status)
            updateData.status = data.status;
        if (data.precision)
            updateData.precision = convertPrecisionToPrisma(data.precision);
        if (data.expiresAt)
            updateData.expires_at = data.expiresAt;
        if (data.emergencyOverride !== undefined)
            updateData.emergency_override = data.emergencyOverride;
        if (data.allowedAccessors)
            updateData.allowed_accessors = JSON.stringify(data.allowedAccessors);
        return await prisma.locationSharingSettings.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteLocationSharing(id) {
        return await prisma.locationSharingSettings.delete({
            where: { id },
        });
    }
    async getUserLocationSharing(userId) {
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
    async getActiveLocationSharing(userId) {
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
    async createLocationAccessLog(data) {
        return await prisma.locationAccessLog.create({
            data: {
                sharing_id: data.sharingId,
                accessor_id: data.accessorId,
                accessor_type: data.accessorType,
                encrypted_coordinates: data.encryptedCoordinates,
                salt: data.salt,
                iv: data.iv,
                precision: data.precision,
                reason: data.reason,
                blockchain_hash: data.blockchainHash,
            },
        });
    }
    async getLocationAccessLogs(sharingId) {
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
    async getUserAccessLogs(userId) {
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
    async createLocationHistoryEntry(data) {
        return await prisma.locationHistoryEntry.create({
            data: {
                user_id: data.userId,
                encrypted_coordinates: data.encryptedCoordinates,
                salt: data.salt,
                iv: data.iv,
                precision: data.precision,
                accuracy: data.accuracy,
                source: data.source,
                retain_until: data.retainUntil,
            },
        });
    }
    async getUserLocationHistory(userId, limit = 50) {
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
    async createOrUpdatePrivacySettings(data) {
        const settingsData = {
            user_id: data.userId,
        };
        if (data.defaultPrecision)
            settingsData.default_precision = data.defaultPrecision;
        if (data.allowEmergencyAccess !== undefined)
            settingsData.allow_emergency_access = data.allowEmergencyAccess;
        if (data.historyRetentionDays)
            settingsData.history_retention_days = data.historyRetentionDays;
        if (data.notifyOnAccess !== undefined)
            settingsData.notify_on_access = data.notifyOnAccess;
        if (data.autoExpireMinutes)
            settingsData.auto_expire_minutes = data.autoExpireMinutes;
        if (data.trustedAuthorities)
            settingsData.trusted_authorities = JSON.stringify(data.trustedAuthorities);
        return await prisma.locationPrivacySettings.upsert({
            where: { user_id: data.userId },
            update: settingsData,
            create: {
                ...settingsData,
                trusted_authorities: JSON.stringify(data.trustedAuthorities || []),
            },
        });
    }
    async getPrivacySettings(userId) {
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
    async updatePrivacySettings(userId, data) {
        const updateData = {};
        if (data.default_precision)
            updateData.default_precision = convertPrecisionToPrisma(data.default_precision);
        if (data.allow_emergency_access !== undefined)
            updateData.allow_emergency_access = data.allow_emergency_access;
        if (data.history_retention_days)
            updateData.history_retention_days = data.history_retention_days;
        if (data.notify_on_access !== undefined)
            updateData.notify_on_access = data.notify_on_access;
        if (data.auto_expire_minutes)
            updateData.auto_expire_minutes = data.auto_expire_minutes;
        if (data.trusted_authorities !== undefined)
            updateData.trusted_authorities = JSON.stringify(data.trusted_authorities);
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
    async createEmergencyRequest(data) {
        return await prisma.emergencyLocationRequest.create({
            data: {
                request_id: data.requestId,
                authority_id: data.authorityId,
                target_user_id: data.targetUserId,
                reason: data.reason,
                urgency_level: data.urgencyLevel,
                expires_at: data.expiresAt,
            },
        });
    }
    async approveEmergencyRequest(requestId) {
        return await prisma.emergencyLocationRequest.update({
            where: { request_id: requestId },
            data: { approved_at: new Date() },
        });
    }
    async getEmergencyRequest(requestId) {
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
exports.LocationQueries = LocationQueries;
exports.locationQueries = new LocationQueries();
const getUserLocationShares = async (userId) => {
    const numericUserId = parseInt(userId, 10);
    return await exports.locationQueries.getUserLocationSharing(numericUserId);
};
exports.getUserLocationShares = getUserLocationShares;
const getPrivacySettings = async (userId) => {
    const numericUserId = parseInt(userId, 10);
    return await exports.locationQueries.getPrivacySettings(numericUserId);
};
exports.getPrivacySettings = getPrivacySettings;
const updatePrivacySettings = async (userId, settings) => {
    const numericUserId = parseInt(userId, 10);
    return await exports.locationQueries.updatePrivacySettings(numericUserId, settings);
};
exports.updatePrivacySettings = updatePrivacySettings;
const createEmergencyAccessLog = async (data) => {
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
exports.createEmergencyAccessLog = createEmergencyAccessLog;
const getEmergencyAccessLogs = async (userId, filter) => {
    const whereClause = {
        user_id: userId
    };
    if (filter?.startDate || filter?.endDate) {
        whereClause.created_at = {};
        if (filter.startDate)
            whereClause.created_at.gte = filter.startDate;
        if (filter.endDate)
            whereClause.created_at.lte = filter.endDate;
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
exports.getEmergencyAccessLogs = getEmergencyAccessLogs;
