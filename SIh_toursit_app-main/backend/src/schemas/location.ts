import { z } from 'zod';
import { LocationPrecision, LocationSharingStatus } from '../types/location';

/**
 * Zod Schemas for Location Data Validation
 */

export const LocationCoordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  accuracy: z.number().positive().optional(),
  timestamp: z.date()
});

export const LocationPrecisionSchema = z.nativeEnum(LocationPrecision);

export const LocationSharingStatusSchema = z.nativeEnum(LocationSharingStatus);

export const EncryptedLocationDataSchema = z.object({
  encryptedCoordinates: z.string().min(1, 'Encrypted coordinates required'),
  salt: z.string().min(1, 'Salt required for encryption'),
  iv: z.string().min(1, 'Initialization vector required'),
  precision: LocationPrecisionSchema,
  timestamp: z.date()
});

export const LocationSharingSettingsSchema = z.object({
  id: z.string().uuid('Invalid sharing ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  status: LocationSharingStatusSchema,
  precision: LocationPrecisionSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  emergencyOverride: z.boolean(),
  allowedAccessors: z.array(z.string().uuid()).default([])
});

export const LocationAccessLogSchema = z.object({
  id: z.string().uuid(),
  sharingId: z.string().uuid(),
  accessorId: z.string().uuid(),
  accessorType: z.enum(['emergency', 'authority', 'user']),
  accessedAt: z.date(),
  location: EncryptedLocationDataSchema,
  reason: z.string().optional(),
  blockchainHash: z.string().optional()
});

export const EmergencyLocationRequestSchema = z.object({
  requestId: z.string().uuid(),
  authorityId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  reason: z.string().min(10, 'Emergency reason must be at least 10 characters'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']),
  requestedAt: z.date(),
  approvedAt: z.date().optional(),
  expiresAt: z.date()
});

export const LocationHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  encryptedLocation: EncryptedLocationDataSchema,
  accuracy: z.number().positive(),
  recordedAt: z.date(),
  source: z.enum(['gps', 'network', 'manual']),
  retainUntil: z.date()
});

export const LocationPrivacySettingsSchema = z.object({
  userId: z.string().uuid(),
  defaultPrecision: LocationPrecisionSchema,
  allowEmergencyAccess: z.boolean(),
  historyRetentionDays: z.number()
    .min(1, 'Retention must be at least 1 day')
    .max(365, 'Retention cannot exceed 365 days'),
  notifyOnAccess: z.boolean(),
  autoExpireMinutes: z.number()
    .min(15, 'Auto-expire must be at least 15 minutes')
    .max(1440, 'Auto-expire cannot exceed 24 hours'),
  trustedAuthorities: z.array(z.string().uuid()).default([]),
  updatedAt: z.date()
});

export const GeofenceAreaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Geofence name required'),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusMeters: z.number()
    .min(10, 'Radius must be at least 10 meters')
    .max(50000, 'Radius cannot exceed 50km'),
  type: z.enum(['safe_zone', 'alert_zone', 'restricted']),
  createdBy: z.string().uuid(),
  isActive: z.boolean()
});

export const LocationUpdateRequestSchema = z.object({
  coordinates: LocationCoordinatesSchema,
  precision: LocationPrecisionSchema,
  shareFor: z.number()
    .min(15, 'Sharing duration must be at least 15 minutes')
    .max(1440, 'Sharing duration cannot exceed 24 hours')
    .optional(),
  emergencyMode: z.boolean().optional()
});

export const LocationShareResponseSchema = z.object({
  shareId: z.string().uuid(),
  expiresAt: z.date(),
  precision: LocationPrecisionSchema,
  blockchainHash: z.string().optional()
});

export const LocationVerificationDataSchema = z.object({
  locationHash: z.string().min(1, 'Location hash required'),
  timestamp: z.date(),
  authorityId: z.string().uuid(),
  blockchainTxHash: z.string().min(1, 'Blockchain transaction hash required'),
  verified: z.boolean()
});

// Validation functions for common use cases
export const validateLocationCoordinates = (data: unknown) => {
  return LocationCoordinatesSchema.parse(data);
};

export const validateLocationUpdateRequest = (data: unknown) => {
  return LocationUpdateRequestSchema.parse(data);
};

export const validateLocationSharingSettings = (data: unknown) => {
  return LocationSharingSettingsSchema.parse(data);
};

export const validateEmergencyRequest = (data: unknown) => {
  return EmergencyLocationRequestSchema.parse(data);
};

export const validatePrivacySettings = (data: unknown) => {
  return LocationPrivacySettingsSchema.parse(data);
};

// Additional schemas for API requests
export const CreateLocationSharingSchema = z.object({
  precision: LocationPrecisionSchema,
  expiresAt: z.string().datetime(),
  emergencyOverride: z.boolean().optional().default(false),
  allowedAccessors: z.array(z.string()).optional(),
  coordinates: LocationCoordinatesSchema.optional()
});

export const UpdateLocationSharingSchema = z.object({
  precision: LocationPrecisionSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  emergencyOverride: z.boolean().optional(),
  allowedAccessors: z.array(z.string()).optional(),
  status: LocationSharingStatusSchema.optional()
});

// Safe validation functions that return SafeParseResult
export const validateLocationSharing = (data: unknown) => {
  return CreateLocationSharingSchema.safeParse(data);
};

export const validateLocationUpdate = (data: unknown) => {
  return UpdateLocationSharingSchema.safeParse(data);
};
