import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { GeofenceController } from '../controllers/geofence.controller';
import { CreateGeofenceRequest } from '../types/geofence';
import { TestDatabaseSetup } from '../test-utils/database-setup';

describe('Task 2: Simple Geofence API', () => {
  let testDb: TestDatabaseSetup;
  let controller: GeofenceController;
  let testUserId: number;
  let testGeofenceId: number;

  beforeAll(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
    controller = new GeofenceController();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.cleanup();
    
    // Create a test user
    const testUser = await testDb.createTestUser({
      email: `test-geofence-${Date.now()}@example.com`,
      name: 'Test Geofence User'
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('2.1: Create POST /api/geofences endpoint for zone creation', () => {
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
        type: 'ALERT_ZONE'
      };

      const mockReq = {
        body: geofenceData,
        user: { id: testUserId }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createGeofence(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          name: geofenceData.name,
          description: geofenceData.description,
          risk_level: geofenceData.risk_level,
          type: geofenceData.type,
          is_active: true,
          polygon_coords: geofenceData.polygon_coords
        })
      });
    });

    it('should reject geofence with insufficient coordinates', async () => {
      const invalidGeofenceData = {
        name: 'Invalid Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 }
        ], // Only 2 coordinates, need at least 3
        risk_level: 'LOW',
        type: 'SAFE_ZONE'
      };

      const mockReq = {
        body: invalidGeofenceData,
        user: { id: testUserId }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createGeofence(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.any(Array)
      });
    });

    it('should reject geofence with invalid risk level', async () => {
      const invalidGeofenceData = {
        name: 'Invalid Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'INVALID_LEVEL',
        type: 'SAFE_ZONE'
      };

      const mockReq = {
        body: invalidGeofenceData,
        user: { id: testUserId }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createGeofence(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.any(Array)
      });
    });
  });

  describe('2.2: Add GET /api/geofences to list all zones', () => {
    beforeEach(async () => {
      // Create test geofences
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Test Zone for GET',
          description: 'Test geofence for API retrieval',
          polygon_coords: JSON.stringify([
            { lat: 40.7128, lng: -74.0060 },
            { lat: 40.7130, lng: -74.0058 },
            { lat: 40.7125, lng: -74.0055 },
            { lat: 40.7123, lng: -74.0062 }
          ]),
          risk_level: 'HIGH',
          type: 'RESTRICTED',
          created_by: testUserId
        }
      });
      testGeofenceId = testGeofence.id;
    });

    it('should retrieve all active geofences', async () => {
      const mockReq = {
        query: {}
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.getGeofences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          geofences: expect.arrayContaining([
            expect.objectContaining({
              id: testGeofenceId,
              name: 'Test Zone for GET',
              risk_level: 'HIGH',
              type: 'RESTRICTED'
            })
          ]),
          total: expect.any(Number)
        }
      });
    });

    it('should filter geofences by risk level', async () => {
      const mockReq = {
        query: { risk_level: 'HIGH' }
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.getGeofences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          geofences: expect.any(Array),
          total: expect.any(Number)
        }
      });

      const response = mockRes.json.mock.calls[0][0];
      response.data.geofences.forEach((geofence: any) => {
        expect(geofence.risk_level).toBe('HIGH');
      });
    });

    it('should filter geofences by type', async () => {
      const mockReq = {
        query: { type: 'RESTRICTED' }
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.getGeofences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          geofences: expect.any(Array),
          total: expect.any(Number)
        }
      });

      const response = mockRes.json.mock.calls[0][0];
      response.data.geofences.forEach((geofence: any) => {
        expect(geofence.type).toBe('RESTRICTED');
      });
    });
  });

  describe('2.3: Implement POST /api/check-location for breach detection', () => {
    beforeEach(async () => {
      // Create a test geofence that covers Manhattan area
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Manhattan Test Zone',
          description: 'Test geofence covering part of Manhattan',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7200, lng: -74.0200 },
            { lat: 40.7200, lng: -73.9800 },
            { lat: 40.7000, lng: -73.9800 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });
      testGeofenceId = testGeofence.id;
    });

    it('should detect location inside geofence', async () => {
      const locationData = {
        latitude: 40.7128, // Inside the Manhattan test zone
        longitude: -74.0060,
        user_id: testUserId
      };

      const mockReq = {
        body: locationData
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          breaches: expect.arrayContaining([
            expect.objectContaining({
              geofence_id: testGeofenceId,
              geofence_name: 'Manhattan Test Zone',
              risk_level: 'MEDIUM',
              risk_score: expect.any(Number),
              recommendations: expect.any(Array)
            })
          ])
        }
      });

      const response = mockRes.json.mock.calls[0][0];
      const breach = response.data.breaches[0];
      expect(breach.risk_score).toBeGreaterThanOrEqual(40);
      expect(breach.risk_score).toBeLessThan(80);
    });

    it('should not detect breach for location outside geofence', async () => {
      const locationData = {
        latitude: 41.0000, // Outside the Manhattan test zone
        longitude: -75.0000,
        user_id: testUserId
      };

      const mockReq = {
        body: locationData
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          breaches: []
        }
      });
    });

    it('should validate location coordinates', async () => {
      const invalidLocationData = {
        latitude: 200, // Invalid latitude
        longitude: -74.0060,
        user_id: testUserId
      };

      const mockReq = {
        body: invalidLocationData
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.any(Array)
      });
    });

    it('should log breach in database', async () => {
      const locationData = {
        latitude: 40.7128, // Inside the Manhattan test zone
        longitude: -74.0060,
        user_id: testUserId
      };

      const mockReq = {
        body: locationData
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          breaches: expect.any(Array)
        }
      });

      // Verify breach was logged in database
      const breachCount = await testDb.dbManager.client.geofenceBreach.count({
        where: {
          user_id: testUserId,
          geofence_id: testGeofenceId
        }
      });
      expect(breachCount).toBeGreaterThan(0);
    });
  });

  describe('2.4: Write basic API tests for core functionality', () => {
    beforeEach(async () => {
      // Create test data for statistics
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Stats Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7200, lng: -74.0200 },
            { lat: 40.7200, lng: -73.9800 },
            { lat: 40.7000, lng: -73.9800 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: testUserId
        }
      });
      testGeofenceId = testGeofence.id;

      // Create a test breach
      await testDb.dbManager.client.geofenceBreach.create({
        data: {
          user_id: testUserId,
          geofence_id: testGeofenceId,
          latitude: 40.7128,
          longitude: -74.0060,
          risk_score: 25
        }
      });
    });

    it('should return geofence statistics', async () => {
      const mockReq = {} as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalGeofences: expect.any(Number),
          activeGeofences: expect.any(Number),
          totalBreaches: expect.any(Number),
          recentBreaches: expect.any(Number)
        }
      });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.totalGeofences).toBeGreaterThan(0);
      expect(response.data.activeGeofences).toBeGreaterThan(0);
      expect(response.data.totalBreaches).toBeGreaterThan(0);
    });

    it('should update geofence with valid data', async () => {
      const updateData = {
        name: 'Updated Zone',
        description: 'Updated description',
        risk_level: 'HIGH'
      };

      const mockReq = {
        params: { id: testGeofenceId.toString() },
        body: updateData
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.updateGeofence(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          name: 'Updated Zone',
          description: 'Updated description',
          risk_level: 'HIGH'
        })
      });
    });

    it('should soft delete geofence', async () => {
      const mockReq = {
        params: { id: testGeofenceId.toString() }
      } as any;

      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.deleteGeofence(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Geofence deleted successfully'
      });

      // Verify geofence is marked as inactive
      const deletedGeofence = await testDb.dbManager.client.geofenceArea.findUnique({
        where: { id: testGeofenceId }
      });
      expect(deletedGeofence?.is_active).toBe(false);
    });
  });
});
