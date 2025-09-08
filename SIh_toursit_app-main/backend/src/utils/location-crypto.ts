import * as crypto from 'crypto';
import { LocationCoordinates, EncryptedLocationData, LocationPrecision } from '../types/location';

/**
 * Location Encryption and Privacy Utilities
 */

const ALGORITHM = 'aes-256-ctr';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16;  // 128 bits

/**
 * Generate a cryptographically secure encryption key from a password and salt
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt location coordinates with AES-256-GCM
 */
export function encryptLocationData(
  coordinates: LocationCoordinates,
  precision: LocationPrecision,
  password: string
): EncryptedLocationData {
  try {
    // Validate password
    if (!password || password.trim().length === 0) {
      throw new Error('Password is required for encryption');
    }
    
    // Apply privacy obfuscation based on precision level
    const obfuscatedCoords = obfuscateLocation(coordinates, precision);
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive encryption key
    const key = deriveKey(password, salt);
    
    // Prepare data for encryption
    const locationData = JSON.stringify({
      latitude: obfuscatedCoords.latitude,
      longitude: obfuscatedCoords.longitude,
      accuracy: obfuscatedCoords.accuracy,
      originalTimestamp: coordinates.timestamp,
      precision: precision
    });
    
    // Encrypt the data
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(locationData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine encrypted data without tag for CTR mode
    const encryptedWithTag = encrypted;
    
    return {
      encryptedCoordinates: encryptedWithTag,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      precision: precision,
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(`Location encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt location coordinates
 */
export function decryptLocationData(
  encryptedData: EncryptedLocationData,
  password: string
): LocationCoordinates {
  try {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = deriveKey(password, salt);
    
    // Split encrypted data (no auth tag for CTR mode)
    const encrypted = encryptedData.encryptedCoordinates;
    
    // Decrypt the data
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const locationData = JSON.parse(decrypted);
    
    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: new Date(locationData.originalTimestamp)
    };
  } catch (error) {
    throw new Error(`Location decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Obfuscate location based on precision level
 */
export function obfuscateLocation(
  coordinates: LocationCoordinates,
  precision: LocationPrecision
): LocationCoordinates {
  let lat = coordinates.latitude;
  let lng = coordinates.longitude;
  
  switch (precision) {
    case LocationPrecision.EXACT:
      // No obfuscation for emergency use
      break;
      
    case LocationPrecision.STREET:
      // Round to ~100m precision (3 decimal places)
      lat = Math.round(lat * 1000) / 1000;
      lng = Math.round(lng * 1000) / 1000;
      // Add small random offset
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;
      break;
      
    case LocationPrecision.NEIGHBORHOOD:
      // Round to ~1km precision (2 decimal places)
      lat = Math.round(lat * 100) / 100;
      lng = Math.round(lng * 100) / 100;
      // Add larger random offset
      lat += (Math.random() - 0.5) * 0.01;
      lng += (Math.random() - 0.5) * 0.01;
      break;
      
    case LocationPrecision.CITY:
      // Round to city level (1 decimal place)
      lat = Math.round(lat * 10) / 10;
      lng = Math.round(lng * 10) / 10;
      // Add city-level offset
      lat += (Math.random() - 0.5) * 0.1;
      lng += (Math.random() - 0.5) * 0.1;
      break;
  }
  
  return {
    ...coordinates,
    latitude: lat,
    longitude: lng,
    accuracy: getPrecisionAccuracy(precision)
  };
}

/**
 * Get accuracy value for precision level
 */
function getPrecisionAccuracy(precision: LocationPrecision): number {
  switch (precision) {
    case LocationPrecision.EXACT:
      return 5; // GPS accuracy
    case LocationPrecision.STREET:
      return 100;
    case LocationPrecision.NEIGHBORHOOD:
      return 1000;
    case LocationPrecision.CITY:
      return 10000;
    default:
      return 1000;
  }
}

/**
 * Generate a cryptographic hash of location data for blockchain storage
 */
export function generateLocationHash(
  coordinates: LocationCoordinates,
  userId: string,
  timestamp: Date = new Date()
): string {
  const data = `${coordinates.latitude},${coordinates.longitude},${userId},${timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify location hash against coordinates
 */
export function verifyLocationHash(
  hash: string,
  coordinates: LocationCoordinates,
  userId: string,
  timestamp: Date
): boolean {
  const expectedHash = generateLocationHash(coordinates, userId, timestamp);
  return hash === expectedHash;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Check if coordinates are within a geofence
 */
export function isWithinGeofence(
  coordinates: LocationCoordinates,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  const center: LocationCoordinates = {
    latitude: centerLat,
    longitude: centerLng,
    timestamp: new Date()
  };
  
  const distance = calculateDistance(coordinates, center);
  return distance <= radiusMeters;
}

/**
 * Sanitize location data by removing sensitive metadata
 */
export function sanitizeLocationData(coordinates: LocationCoordinates): LocationCoordinates {
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accuracy: coordinates.accuracy,
    timestamp: coordinates.timestamp
  };
}
