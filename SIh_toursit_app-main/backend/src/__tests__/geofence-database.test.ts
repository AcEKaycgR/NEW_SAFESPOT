import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '../generated/prisma';
import { GeofenceDatabase } from '../database/geofence-queries';
import { CreateGeofenceRequest } from '../types/geofence';

const prisma = new PrismaClient();
const geofenceDb = new GeofenceDatabase();

describe('Geofence Database Operations', () => {
  let testUserId: number;
  let testGeofenceId: number;

  beforeEach(async () => {
    // Create a test user with unique email using timestamp
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        email: `test-${timestamp}@example.com`,
        name: 'Test User',
        blockchain_address: `0x123test${timestamp}`
      }
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up test data in correct order
    if (testUserId) {
      await prisma.geofenceBreach.deleteMany({
        where: { user_id: testUserId }
      });
      await prisma.geofenceArea.deleteMany({
        where: { created_by: testUserId }
      });
      await prisma.user.delete({
        where: { id: testUserId }
      });
    }
  });

  describe('createGeofence', () => {
    it('should create a new geofence with valid data', async () => {
      const geofenceData: CreateGeofenceRequest = {
        name: 'Test Safety Zone',
        description: 'A test geofence for unit testing',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 },
          { lat: 40.7123, lng: -74.0062 }
        ],
        risk_level: 'MEDIUM',
        type: 'SAFE_ZONE'
      };

      const result = await geofenceDb.createGeofence(geofenceData, testUserId);
      testGeofenceId = result.id;

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Safety Zone');
      expect(result.polygon_coords).toHaveLength(4);
      expect(result.risk_level).toBe('MEDIUM');
      expect(result.type).toBe('SAFE_ZONE');
      expect(result.created_by).toBe(testUserId);
      expect(result.is_active).toBe(true);
    });

    it('should handle geofence creation with minimal data', async () => {
      const geofenceData: CreateGeofenceRequest = {
        name: 'Minimal Geofence',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'LOW',
        type: 'ALERT_ZONE'
      };

      const result = await geofenceDb.createGeofence(geofenceData, testUserId);
      testGeofenceId = result.id;

      expect(result).toBeDefined();
      expect(result.name).toBe('Minimal Geofence');
      expect(result.description).toBe(null);
      expect(result.polygon_coords).toHaveLength(3);
    });
  });

  describe('getActiveGeofences', () => {
    beforeEach(async () => {
      // Create test geofences
      const geofence1 = await geofenceDb.createGeofence({
        name: 'Active Zone 1',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'HIGH',
        type: 'RESTRICTED'
      }, testUserId);

      const geofence2 = await geofenceDb.createGeofence({
        name: 'Active Zone 2',
        polygon_coords: [
          { lat: 40.7140, lng: -74.0070 },
          { lat: 40.7142, lng: -74.0068 },
          { lat: 40.7138, lng: -74.0065 }
        ],
        risk_level: 'MEDIUM',
        type: 'ALERT_ZONE'
      }, testUserId);

      // Soft delete one geofence
      await geofenceDb.deleteGeofence(geofence2.id);
    });

    it('should return only active geofences', async () => {
      const activeGeofences = await geofenceDb.getActiveGeofences();
      
      const testGeofences = activeGeofences.filter(g => g.created_by === testUserId);
      expect(testGeofences).toHaveLength(1);
      expect(testGeofences[0].name).toBe('Active Zone 1');
      expect(testGeofences[0].is_active).toBe(true);
    });
  });

  describe('logBreach', () => {
    beforeEach(async () => {
      const geofence = await geofenceDb.createGeofence({
        name: 'Breach Test Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'HIGH',
        type: 'RESTRICTED'
      }, testUserId);
      testGeofenceId = geofence.id;
    });

    it('should log a geofence breach', async () => {
      const location = { latitude: 40.7129, longitude: -74.0059 };
      const riskScore = 85;

      const breach = await geofenceDb.logBreach(testUserId, testGeofenceId, location, riskScore);

      expect(breach).toBeDefined();
      expect(breach.user_id).toBe(testUserId);
      expect(breach.geofence_id).toBe(testGeofenceId);
      expect(breach.latitude).toBe(location.latitude);
      expect(breach.longitude).toBe(location.longitude);
      expect(breach.risk_score).toBe(riskScore);
      expect(breach.alert_sent).toBe(false);
    });
  });

  describe('getGeofenceStats', () => {
    beforeEach(async () => {
      // Create test geofences and breaches
      const geofence = await geofenceDb.createGeofence({
        name: 'Stats Test Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'MEDIUM',
        type: 'ALERT_ZONE'
      }, testUserId);

      await geofenceDb.logBreach(testUserId, geofence.id, 
        { latitude: 40.7129, longitude: -74.0059 }, 60);
    });

    it('should return correct statistics', async () => {
      const stats = await geofenceDb.getGeofenceStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalGeofences).toBe('number');
      expect(typeof stats.activeGeofences).toBe('number');
      expect(typeof stats.totalBreaches).toBe('number');
      expect(typeof stats.recentBreaches).toBe('number');
      expect(stats.activeGeofences).toBeLessThanOrEqual(stats.totalGeofences);
    });
  });

  describe('updateGeofence', () => {
    beforeEach(async () => {
      const geofence = await geofenceDb.createGeofence({
        name: 'Update Test Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'LOW',
        type: 'SAFE_ZONE'
      }, testUserId);
      testGeofenceId = geofence.id;
    });

    it('should update geofence properties', async () => {
      const updatedGeofence = await geofenceDb.updateGeofence(testGeofenceId, {
        name: 'Updated Zone Name',
        risk_level: 'HIGH'
      });

      expect(updatedGeofence).toBeDefined();
      expect(updatedGeofence!.name).toBe('Updated Zone Name');
      expect(updatedGeofence!.risk_level).toBe('HIGH');
      expect(updatedGeofence!.type).toBe('SAFE_ZONE'); // Should remain unchanged
    });
  });
});
