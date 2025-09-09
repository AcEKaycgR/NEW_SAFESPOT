"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const location_crypto_1 = require("../utils/location-crypto");
const location_1 = require("../types/location");
describe('Location Crypto Utilities', () => {
    const testCoordinates = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date('2025-08-31T12:00:00Z')
    };
    const testPassword = 'secure-test-password-123';
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    describe('Location Encryption/Decryption', () => {
        test('should encrypt and decrypt location data successfully', () => {
            const encrypted = (0, location_crypto_1.encryptLocationData)(testCoordinates, location_1.LocationPrecision.EXACT, testPassword);
            expect(encrypted.encryptedCoordinates).toBeDefined();
            expect(encrypted.salt).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.precision).toBe(location_1.LocationPrecision.EXACT);
            expect(encrypted.timestamp).toBeInstanceOf(Date);
            const decrypted = (0, location_crypto_1.decryptLocationData)(encrypted, testPassword);
            expect(decrypted.latitude).toBeCloseTo(testCoordinates.latitude, 6);
            expect(decrypted.longitude).toBeCloseTo(testCoordinates.longitude, 6);
            expect(decrypted.accuracy).toBe(testCoordinates.accuracy);
        });
        test('should fail to decrypt with wrong password', () => {
            const encrypted = (0, location_crypto_1.encryptLocationData)(testCoordinates, location_1.LocationPrecision.EXACT, testPassword);
            expect(() => {
                (0, location_crypto_1.decryptLocationData)(encrypted, 'wrong-password');
            }).toThrow('Location decryption failed');
        });
        test('should encrypt same data differently each time', () => {
            const encrypted1 = (0, location_crypto_1.encryptLocationData)(testCoordinates, location_1.LocationPrecision.EXACT, testPassword);
            const encrypted2 = (0, location_crypto_1.encryptLocationData)(testCoordinates, location_1.LocationPrecision.EXACT, testPassword);
            expect(encrypted1.encryptedCoordinates).not.toBe(encrypted2.encryptedCoordinates);
            expect(encrypted1.salt).not.toBe(encrypted2.salt);
            expect(encrypted1.iv).not.toBe(encrypted2.iv);
        });
    });
    describe('Location Obfuscation', () => {
        test('should not obfuscate exact precision', () => {
            const obfuscated = (0, location_crypto_1.obfuscateLocation)(testCoordinates, location_1.LocationPrecision.EXACT);
            expect(obfuscated.latitude).toBe(testCoordinates.latitude);
            expect(obfuscated.longitude).toBe(testCoordinates.longitude);
            expect(obfuscated.accuracy).toBe(5);
        });
        test('should obfuscate street level precision', () => {
            const obfuscated = (0, location_crypto_1.obfuscateLocation)(testCoordinates, location_1.LocationPrecision.STREET);
            expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(0.01);
            expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(0.01);
            expect(obfuscated.accuracy).toBe(100);
        });
        test('should obfuscate neighborhood level precision', () => {
            const obfuscated = (0, location_crypto_1.obfuscateLocation)(testCoordinates, location_1.LocationPrecision.NEIGHBORHOOD);
            expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(0.1);
            expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(0.1);
            expect(obfuscated.accuracy).toBe(1000);
        });
        test('should obfuscate city level precision', () => {
            const obfuscated = (0, location_crypto_1.obfuscateLocation)(testCoordinates, location_1.LocationPrecision.CITY);
            expect(Math.abs(obfuscated.latitude - testCoordinates.latitude)).toBeLessThan(1);
            expect(Math.abs(obfuscated.longitude - testCoordinates.longitude)).toBeLessThan(1);
            expect(obfuscated.accuracy).toBe(10000);
        });
    });
    describe('Location Hashing', () => {
        test('should generate consistent hash for same inputs', () => {
            const hash1 = (0, location_crypto_1.generateLocationHash)(testCoordinates, testUserId, testCoordinates.timestamp);
            const hash2 = (0, location_crypto_1.generateLocationHash)(testCoordinates, testUserId, testCoordinates.timestamp);
            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
        });
        test('should generate different hashes for different inputs', () => {
            const hash1 = (0, location_crypto_1.generateLocationHash)(testCoordinates, testUserId, testCoordinates.timestamp);
            const differentCoords = { ...testCoordinates, latitude: 41.7128 };
            const hash2 = (0, location_crypto_1.generateLocationHash)(differentCoords, testUserId, testCoordinates.timestamp);
            expect(hash1).not.toBe(hash2);
        });
        test('should verify hash correctly', () => {
            const hash = (0, location_crypto_1.generateLocationHash)(testCoordinates, testUserId, testCoordinates.timestamp);
            const isValid = (0, location_crypto_1.verifyLocationHash)(hash, testCoordinates, testUserId, testCoordinates.timestamp);
            expect(isValid).toBe(true);
            const differentCoords = { ...testCoordinates, latitude: 41.7128 };
            const isInvalid = (0, location_crypto_1.verifyLocationHash)(hash, differentCoords, testUserId, testCoordinates.timestamp);
            expect(isInvalid).toBe(false);
        });
    });
    describe('Distance Calculation', () => {
        test('should calculate distance between two points', () => {
            const newYork = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: new Date()
            };
            const losAngeles = {
                latitude: 34.0522,
                longitude: -118.2437,
                timestamp: new Date()
            };
            const distance = (0, location_crypto_1.calculateDistance)(newYork, losAngeles);
            expect(distance).toBeGreaterThan(3900000);
            expect(distance).toBeLessThan(4000000);
        });
        test('should return zero distance for same coordinates', () => {
            const distance = (0, location_crypto_1.calculateDistance)(testCoordinates, testCoordinates);
            expect(distance).toBe(0);
        });
    });
    describe('Geofence Utilities', () => {
        test('should detect point within geofence', () => {
            const center = testCoordinates;
            const testPoint = {
                latitude: center.latitude + 0.001,
                longitude: center.longitude,
                timestamp: new Date()
            };
            const withinRadius = (0, location_crypto_1.isWithinGeofence)(testPoint, center.latitude, center.longitude, 200);
            expect(withinRadius).toBe(true);
            const outsideRadius = (0, location_crypto_1.isWithinGeofence)(testPoint, center.latitude, center.longitude, 50);
            expect(outsideRadius).toBe(false);
        });
    });
    describe('Data Sanitization', () => {
        test('should sanitize location data', () => {
            const sensitiveData = {
                ...testCoordinates,
                deviceId: 'sensitive-device-123',
                ipAddress: '192.168.1.1'
            };
            const sanitized = (0, location_crypto_1.sanitizeLocationData)(sensitiveData);
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
            const invalidCoords = {
                latitude: 91,
                longitude: -74.0060,
                timestamp: new Date()
            };
            expect(() => {
                (0, location_crypto_1.encryptLocationData)(invalidCoords, location_1.LocationPrecision.EXACT, testPassword);
            }).not.toThrow();
        });
        test('should handle empty password', () => {
            expect(() => {
                (0, location_crypto_1.encryptLocationData)(testCoordinates, location_1.LocationPrecision.EXACT, '');
            }).toThrow();
        });
    });
});
