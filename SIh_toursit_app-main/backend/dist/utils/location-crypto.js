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
exports.deriveKey = deriveKey;
exports.encryptLocationData = encryptLocationData;
exports.decryptLocationData = decryptLocationData;
exports.obfuscateLocation = obfuscateLocation;
exports.generateLocationHash = generateLocationHash;
exports.verifyLocationHash = verifyLocationHash;
exports.calculateDistance = calculateDistance;
exports.isWithinGeofence = isWithinGeofence;
exports.sanitizeLocationData = sanitizeLocationData;
const crypto = __importStar(require("crypto"));
const location_1 = require("../types/location");
const ALGORITHM = 'aes-256-ctr';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}
function encryptLocationData(coordinates, precision, password) {
    try {
        if (!password || password.trim().length === 0) {
            throw new Error('Password is required for encryption');
        }
        const obfuscatedCoords = obfuscateLocation(coordinates, precision);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = deriveKey(password, salt);
        const locationData = JSON.stringify({
            latitude: obfuscatedCoords.latitude,
            longitude: obfuscatedCoords.longitude,
            accuracy: obfuscatedCoords.accuracy,
            originalTimestamp: coordinates.timestamp,
            precision: precision
        });
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(locationData, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedWithTag = encrypted;
        return {
            encryptedCoordinates: encryptedWithTag,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            precision: precision,
            timestamp: new Date()
        };
    }
    catch (error) {
        throw new Error(`Location encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function decryptLocationData(encryptedData, password) {
    try {
        const salt = Buffer.from(encryptedData.salt, 'hex');
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const key = deriveKey(password, salt);
        const encrypted = encryptedData.encryptedCoordinates;
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
    }
    catch (error) {
        throw new Error(`Location decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function obfuscateLocation(coordinates, precision) {
    let lat = coordinates.latitude;
    let lng = coordinates.longitude;
    switch (precision) {
        case location_1.LocationPrecision.EXACT:
            break;
        case location_1.LocationPrecision.STREET:
            lat = Math.round(lat * 1000) / 1000;
            lng = Math.round(lng * 1000) / 1000;
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;
            break;
        case location_1.LocationPrecision.NEIGHBORHOOD:
            lat = Math.round(lat * 100) / 100;
            lng = Math.round(lng * 100) / 100;
            lat += (Math.random() - 0.5) * 0.01;
            lng += (Math.random() - 0.5) * 0.01;
            break;
        case location_1.LocationPrecision.CITY:
            lat = Math.round(lat * 10) / 10;
            lng = Math.round(lng * 10) / 10;
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
function getPrecisionAccuracy(precision) {
    switch (precision) {
        case location_1.LocationPrecision.EXACT:
            return 5;
        case location_1.LocationPrecision.STREET:
            return 100;
        case location_1.LocationPrecision.NEIGHBORHOOD:
            return 1000;
        case location_1.LocationPrecision.CITY:
            return 10000;
        default:
            return 1000;
    }
}
function generateLocationHash(coordinates, userId, timestamp = new Date()) {
    const data = `${coordinates.latitude},${coordinates.longitude},${userId},${timestamp.toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}
function verifyLocationHash(hash, coordinates, userId, timestamp) {
    const expectedHash = generateLocationHash(coordinates, userId, timestamp);
    return hash === expectedHash;
}
function calculateDistance(coord1, coord2) {
    const R = 6371e3;
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function isWithinGeofence(coordinates, centerLat, centerLng, radiusMeters) {
    const center = {
        latitude: centerLat,
        longitude: centerLng,
        timestamp: new Date()
    };
    const distance = calculateDistance(coordinates, center);
    return distance <= radiusMeters;
}
function sanitizeLocationData(coordinates) {
    return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy,
        timestamp: coordinates.timestamp
    };
}
