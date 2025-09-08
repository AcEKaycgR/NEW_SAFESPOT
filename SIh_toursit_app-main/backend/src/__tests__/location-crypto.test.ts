import {
  encryptLocationData,
  decryptLocationData,
  obfuscateLocation,
  generateLocationHash,
  verifyLocationHash,
  calculateDistance,
  isWithinGeofence,
  sanitizeLocationData
} from '../utils/location-crypto';
import { LocationCoordinates, LocationPrecision } from '../types/location';

describe('Location Crypto Utilities', () => {
  const testCoordinates: LocationCoordinates = {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 5,
    timestamp: new Date('2025-08-31T12:00:00Z')
  };

  const testPassword = 'secure-test-password-123';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  describe('Location Encryption/Decryption', () => {
    test('should encrypt and decrypt location data successfully', () => {
      const encrypted = encryptLocationData(testCoordinates, LocationPrecision.EXACT, testPassword);
      
      expect(encrypted.encryptedCoordinates).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.precision).toBe(LocationPrecision.EXACT);
      expect(encrypted.timestamp).toBeInstanceOf(Date);

      const decrypted = decryptLocationData(encrypted, testPassword);
      
      expect(decrypted.latitude).toBeCloseTo(testCoordinates.latitude, 6);
      expect(decrypted.longitude).toBeCloseTo(testCoordinates.longitude, 6);
      expect(decrypted.accuracy).toBe(testCoordinates.accuracy);
    });

    test('should fail to decrypt with wrong password', () => {
      const encrypted = encryptLocationData(testCoordinates, LocationPrecision.EXACT, testPassword);
      
      expect(() => {
        decryptLocationData(encrypted, 'wrong-password');
      }).toThrow('Location decryption failed');
    });

    test('should encrypt same data differently each time', () => {
      const encrypted1 = encryptLocationData(testCoordinates, LocationPrecision.EXACT, testPassword);
      const encrypted2 = encryptLocationData(testCoordinates, LocationPrecision.EXACT, testPassword);
      
      expect(encrypted1.encryptedCoordinates).not.toBe(encrypted2.encryptedCoordinates);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Location Obfuscation', () => {
    test('should not obfuscate exact precision', () => {
      const obfuscated = obfuscateLocation(testCoordinates, LocationPrecision.EXACT);
      
      expect(obfuscated.latitude).toBe(testCoordinates.latitude);
      expect(obfuscated.longitude).toBe(testCoordinates.longitude);
      expect(obfuscated.accuracy).toBe(5);
    });

    test('should obfuscate street level precision', () => {
      const obfuscated = obfuscateLocation(testCoordinates, LocationPrecision.STREET);
      
      expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(0.01);
      expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(0.01);
      expect(obfuscated.accuracy).toBe(100);
    });

    test('should obfuscate neighborhood level precision', () => {
      const obfuscated = obfuscateLocation(testCoordinates, LocationPrecision.NEIGHBORHOOD);
      
      expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(0.1);
      expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(0.1);
      expect(obfuscated.accuracy).toBe(1000);
    });

    test('should obfuscate city level precision', () => {
      const obfuscated = obfuscateLocation(testCoordinates, LocationPrecision.CITY);
      
      expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(1);
      expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(1);
      expect(obfuscated.accuracy).toBe(10000);
    });
  });

  describe('Location Hashing', () => {
    test('should generate consistent hash for same inputs', () => {
      const hash1 = generateLocationHash(testCoordinates, testUserId, testCoordinates.timestamp);
      const hash2 = generateLocationHash(testCoordinates, testUserId, testCoordinates.timestamp);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    test('should generate different hashes for different inputs', () => {
      const hash1 = generateLocationHash(testCoordinates, testUserId, testCoordinates.timestamp);
      
      const differentCoords = { ...testCoordinates, latitude: 41.7128 };
      const hash2 = generateLocationHash(differentCoords, testUserId, testCoordinates.timestamp);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should verify hash correctly', () => {
      const hash = generateLocationHash(testCoordinates, testUserId, testCoordinates.timestamp);
      
      const isValid = verifyLocationHash(hash, testCoordinates, testUserId, testCoordinates.timestamp);
      expect(isValid).toBe(true);
      
      const differentCoords = { ...testCoordinates, latitude: 41.7128 };
      const isInvalid = verifyLocationHash(hash, differentCoords, testUserId, testCoordinates.timestamp);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between two points', () => {
      const newYork: LocationCoordinates = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date()
      };
      
      const losAngeles: LocationCoordinates = {
        latitude: 34.0522,
        longitude: -118.2437,
        timestamp: new Date()
      };
      
      const distance = calculateDistance(newYork, losAngeles);
      
      // Distance between NYC and LA is approximately 3,944 km
      expect(distance).toBeGreaterThan(3900000); // 3,900 km
      expect(distance).toBeLessThan(4000000);    // 4,000 km
    });

    test('should return zero distance for same coordinates', () => {
      const distance = calculateDistance(testCoordinates, testCoordinates);
      expect(distance).toBe(0);
    });
  });

  describe('Geofence Utilities', () => {
    test('should detect point within geofence', () => {
      const center = testCoordinates;
      const testPoint: LocationCoordinates = {
        latitude: center.latitude + 0.001, // ~111 meters north
        longitude: center.longitude,
        timestamp: new Date()
      };
      
      const withinRadius = isWithinGeofence(testPoint, center.latitude, center.longitude, 200);
      expect(withinRadius).toBe(true);
      
      const outsideRadius = isWithinGeofence(testPoint, center.latitude, center.longitude, 50);
      expect(outsideRadius).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize location data', () => {
      const sensitiveData = {
        ...testCoordinates,
        deviceId: 'sensitive-device-123',
        ipAddress: '192.168.1.1'
      } as any;
      
      const sanitized = sanitizeLocationData(sensitiveData);
      
      expect(sanitized).toEqual({
        latitude: testCoordinates.latitude,
        longitude: testCoordinates.longitude,
        accuracy: testCoordinates.accuracy,
        timestamp: testCoordinates.timestamp
      });
      
      expect(sanitized).not.toHaveProperty('deviceId');
      expect(sanitized).not.toHaveProperty('ipAddress');
    });
  });

  describe('Input Validation', () => {
    test('should handle invalid coordinates', () => {
      const invalidCoords: LocationCoordinates = {
        latitude: 91, // Invalid latitude > 90
        longitude: -74.0060,
        timestamp: new Date()
      };
      
      expect(() => {
        encryptLocationData(invalidCoords, LocationPrecision.EXACT, testPassword);
      }).not.toThrow(); // Should handle gracefully with obfuscation
    });

    test('should handle empty password', () => {
      expect(() => {
        encryptLocationData(testCoordinates, LocationPrecision.EXACT, '');
      }).toThrow();
    });
  });
});
