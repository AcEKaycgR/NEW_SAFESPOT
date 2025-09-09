"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLocationUpdate = exports.validateLocationSharing = exports.UpdateLocationSharingSchema = exports.CreateLocationSharingSchema = exports.validatePrivacySettings = exports.validateEmergencyRequest = exports.validateLocationSharingSettings = exports.validateLocationUpdateRequest = exports.validateLocationCoordinates = exports.LocationVerificationDataSchema = exports.LocationShareResponseSchema = exports.LocationUpdateRequestSchema = exports.GeofenceAreaSchema = exports.LocationPrivacySettingsSchema = exports.LocationHistoryEntrySchema = exports.EmergencyLocationRequestSchema = exports.LocationAccessLogSchema = exports.LocationSharingSettingsSchema = exports.EncryptedLocationDataSchema = exports.LocationSharingStatusSchema = exports.LocationPrecisionSchema = exports.LocationCoordinatesSchema = void 0;
const zod_1 = require("zod");
const location_1 = require("../types/location");
exports.LocationCoordinatesSchema = zod_1.z.object({
    latitude: zod_1.z.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
    longitude: zod_1.z.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
    accuracy: zod_1.z.number().positive().optional(),
    timestamp: zod_1.z.date()
});
exports.LocationPrecisionSchema = zod_1.z.nativeEnum(location_1.LocationPrecision);
exports.LocationSharingStatusSchema = zod_1.z.nativeEnum(location_1.LocationSharingStatus);
exports.EncryptedLocationDataSchema = zod_1.z.object({
    encryptedCoordinates: zod_1.z.string().min(1, 'Encrypted coordinates required'),
    salt: zod_1.z.string().min(1, 'Salt required for encryption'),
    iv: zod_1.z.string().min(1, 'Initialization vector required'),
    precision: exports.LocationPrecisionSchema,
    timestamp: zod_1.z.date()
});
exports.LocationSharingSettingsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid sharing ID format'),
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    status: exports.LocationSharingStatusSchema,
    precision: exports.LocationPrecisionSchema,
    expiresAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    emergencyOverride: zod_1.z.boolean(),
    allowedAccessors: zod_1.z.array(zod_1.z.string().uuid()).default([])
});
exports.LocationAccessLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    sharingId: zod_1.z.string().uuid(),
    accessorId: zod_1.z.string().uuid(),
    accessorType: zod_1.z.enum(['emergency', 'authority', 'user']),
    accessedAt: zod_1.z.date(),
    location: exports.EncryptedLocationDataSchema,
    reason: zod_1.z.string().optional(),
    blockchainHash: zod_1.z.string().optional()
});
exports.EmergencyLocationRequestSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid(),
    authorityId: zod_1.z.string().uuid(),
    targetUserId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(10, 'Emergency reason must be at least 10 characters'),
    urgencyLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    requestedAt: zod_1.z.date(),
    approvedAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date()
});
exports.LocationHistoryEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    encryptedLocation: exports.EncryptedLocationDataSchema,
    accuracy: zod_1.z.number().positive(),
    recordedAt: zod_1.z.date(),
    source: zod_1.z.enum(['gps', 'network', 'manual']),
    retainUntil: zod_1.z.date()
});
exports.LocationPrivacySettingsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    defaultPrecision: exports.LocationPrecisionSchema,
    allowEmergencyAccess: zod_1.z.boolean(),
    historyRetentionDays: zod_1.z.number()
        .min(1, 'Retention must be at least 1 day')
        .max(365, 'Retention cannot exceed 365 days'),
    notifyOnAccess: zod_1.z.boolean(),
    autoExpireMinutes: zod_1.z.number()
        .min(15, 'Auto-expire must be at least 15 minutes')
        .max(1440, 'Auto-expire cannot exceed 24 hours'),
    trustedAuthorities: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    updatedAt: zod_1.z.date()
});
exports.GeofenceAreaSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1, 'Geofence name required'),
    centerLat: zod_1.z.number().min(-90).max(90),
    centerLng: zod_1.z.number().min(-180).max(180),
    radiusMeters: zod_1.z.number()
        .min(10, 'Radius must be at least 10 meters')
        .max(50000, 'Radius cannot exceed 50km'),
    type: zod_1.z.enum(['safe_zone', 'alert_zone', 'restricted']),
    createdBy: zod_1.z.string().uuid(),
    isActive: zod_1.z.boolean()
});
exports.LocationUpdateRequestSchema = zod_1.z.object({
    coordinates: exports.LocationCoordinatesSchema,
    precision: exports.LocationPrecisionSchema,
    shareFor: zod_1.z.number()
        .min(15, 'Sharing duration must be at least 15 minutes')
        .max(1440, 'Sharing duration cannot exceed 24 hours')
        .optional(),
    emergencyMode: zod_1.z.boolean().optional()
});
exports.LocationShareResponseSchema = zod_1.z.object({
    shareId: zod_1.z.string().uuid(),
    expiresAt: zod_1.z.date(),
    precision: exports.LocationPrecisionSchema,
    blockchainHash: zod_1.z.string().optional()
});
exports.LocationVerificationDataSchema = zod_1.z.object({
    locationHash: zod_1.z.string().min(1, 'Location hash required'),
    timestamp: zod_1.z.date(),
    authorityId: zod_1.z.string().uuid(),
    blockchainTxHash: zod_1.z.string().min(1, 'Blockchain transaction hash required'),
    verified: zod_1.z.boolean()
});
const validateLocationCoordinates = (data) => {
    return exports.LocationCoordinatesSchema.parse(data);
};
exports.validateLocationCoordinates = validateLocationCoordinates;
const validateLocationUpdateRequest = (data) => {
    return exports.LocationUpdateRequestSchema.parse(data);
};
exports.validateLocationUpdateRequest = validateLocationUpdateRequest;
const validateLocationSharingSettings = (data) => {
    return exports.LocationSharingSettingsSchema.parse(data);
};
exports.validateLocationSharingSettings = validateLocationSharingSettings;
const validateEmergencyRequest = (data) => {
    return exports.EmergencyLocationRequestSchema.parse(data);
};
exports.validateEmergencyRequest = validateEmergencyRequest;
const validatePrivacySettings = (data) => {
    return exports.LocationPrivacySettingsSchema.parse(data);
};
exports.validatePrivacySettings = validatePrivacySettings;
exports.CreateLocationSharingSchema = zod_1.z.object({
    precision: exports.LocationPrecisionSchema,
    expiresAt: zod_1.z.string().datetime(),
    emergencyOverride: zod_1.z.boolean().optional().default(false),
    allowedAccessors: zod_1.z.array(zod_1.z.string()).optional(),
    coordinates: exports.LocationCoordinatesSchema.optional()
});
exports.UpdateLocationSharingSchema = zod_1.z.object({
    precision: exports.LocationPrecisionSchema.optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    emergencyOverride: zod_1.z.boolean().optional(),
    allowedAccessors: zod_1.z.array(zod_1.z.string()).optional(),
    status: exports.LocationSharingStatusSchema.optional()
});
const validateLocationSharing = (data) => {
    return exports.CreateLocationSharingSchema.safeParse(data);
};
exports.validateLocationSharing = validateLocationSharing;
const validateLocationUpdate = (data) => {
    return exports.UpdateLocationSharingSchema.safeParse(data);
};
exports.validateLocationUpdate = validateLocationUpdate;
