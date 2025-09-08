/**
 * Location Data Types
 * Defines TypeScript interfaces for location tracking and privacy features
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export interface EncryptedLocationData {
  encryptedCoordinates: string;
  salt: string;
  iv: string;
  precision: LocationPrecision;
  timestamp: Date;
}

export enum LocationPrecision {
  EXACT = 'exact',           // GPS coordinates (emergency use)
  STREET = 'street',         // ~100m radius
  NEIGHBORHOOD = 'neighborhood', // ~1km radius
  CITY = 'city'              // City level only
}

export enum LocationSharingStatus {
  DISABLED = 'disabled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EMERGENCY = 'emergency'
}

export interface LocationSharingSettings {
  id: string;
  userId: string;
  status: LocationSharingStatus;
  precision: LocationPrecision;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  emergencyOverride: boolean;
  allowedAccessors: string[]; // List of authority IDs
}

export interface LocationAccessLog {
  id: string;
  sharingId: string;
  accessorId: string;
  accessorType: 'emergency' | 'authority' | 'user';
  accessedAt: Date;
  location: EncryptedLocationData;
  reason?: string;
  blockchainHash?: string;
}

export interface EmergencyLocationRequest {
  requestId: string;
  authorityId: string;
  targetUserId: string;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  requestedAt: Date;
  approvedAt?: Date;
  expiresAt: Date;
}

export interface LocationHistoryEntry {
  id: string;
  userId: string;
  encryptedLocation: EncryptedLocationData;
  accuracy: number;
  recordedAt: Date;
  source: 'gps' | 'network' | 'manual';
  retainUntil: Date;
}

export interface LocationPrivacySettings {
  userId: string;
  defaultPrecision: LocationPrecision;
  allowEmergencyAccess: boolean;
  historyRetentionDays: number;
  notifyOnAccess: boolean;
  autoExpireMinutes: number;
  trustedAuthorities: string[];
  updatedAt: Date;
}

export interface GeofenceArea {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  type: 'safe_zone' | 'alert_zone' | 'restricted';
  createdBy: string;
  isActive: boolean;
}

export interface LocationUpdateRequest {
  coordinates: LocationCoordinates;
  precision: LocationPrecision;
  shareFor?: number; // minutes
  emergencyMode?: boolean;
}

export interface LocationShareResponse {
  shareId: string;
  expiresAt: Date;
  precision: LocationPrecision;
  blockchainHash?: string;
}

export interface LocationVerificationData {
  locationHash: string;
  timestamp: Date;
  authorityId: string;
  blockchainTxHash: string;
  verified: boolean;
}
