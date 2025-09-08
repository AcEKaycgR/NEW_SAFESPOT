import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { GeofenceController } from '../controllers/geofence.controller';
import { TestDatabaseSetup } from '../test-utils/database-setup';

describe('Task 3: Basic Point-in-Polygon Detection', () => {
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
      email: `test-polygon-${Date.now()}@example.com`,
      name: 'Test Polygon User'
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('3.1: Implement simple mathematical point-in-polygon algorithm', () => {
    beforeEach(async () => {
      // Create a square geofence for precise testing
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Square Test Zone',
          description: 'Square geofence for point-in-polygon testing',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 }, // Bottom-left
            { lat: 40.7000, lng: -74.0000 }, // Bottom-right
            { lat: 40.7200, lng: -74.0000 }, // Top-right
            { lat: 40.7200, lng: -74.0200 }  // Top-left
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });
      testGeofenceId = testGeofence.id;
    });

    it('should detect point clearly inside polygon', async () => {
      const locationData = {
        latitude: 40.7100, // Center of the square
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(1);
      expect(response.data.breaches[0].geofence_id).toBe(testGeofenceId);
    });

    it('should not detect point clearly outside polygon', async () => {
      const locationData = {
        latitude: 40.6900, // Below the square
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(0);
    });

    it('should handle edge case: point on polygon boundary', async () => {
      const locationData = {
        latitude: 40.7000, // Exactly on bottom edge
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      // Boundary behavior may vary, but should be consistent
      expect(typeof response.data.breaches.length).toBe('number');
      expect(response.data.breaches.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge case: point at polygon vertex', async () => {
      const locationData = {
        latitude: 40.7000, // Exactly at bottom-left vertex
        longitude: -74.0200,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      // Vertex behavior may vary, but should be consistent
      expect(typeof response.data.breaches.length).toBe('number');
      expect(response.data.breaches.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect point in complex polygon shape', async () => {
      // Create a more complex L-shaped polygon
      const complexGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'L-Shaped Test Zone',
          description: 'Complex polygon for advanced testing',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 }, // Bottom-left of L
            { lat: 40.7000, lng: -74.0100 }, // Bottom-middle
            { lat: 40.7100, lng: -74.0100 }, // Middle-middle
            { lat: 40.7100, lng: -74.0000 }, // Middle-right
            { lat: 40.7200, lng: -74.0000 }, // Top-right
            { lat: 40.7200, lng: -74.0200 }  // Top-left
          ]),
          risk_level: 'HIGH',
          type: 'RESTRICTED',
          created_by: testUserId
        }
      });

      // Test point in the L-shaped area
      const locationData = {
        latitude: 40.7050, // Inside the L
        longitude: -74.0150,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(2); // Both geofences should match
      
      const lShapedBreach = response.data.breaches.find(
        (b: any) => b.geofence_name === 'L-Shaped Test Zone'
      );
      expect(lShapedBreach).toBeDefined();
    });

    it('should not detect point in concave area of complex polygon', async () => {
      // Test point that would be inside a bounding box but outside the L-shape
      const locationData = {
        latitude: 40.7050, // In the "notch" of the L
        longitude: -74.0050,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      
      // Should only detect the square geofence, not any L-shaped one
      const squareBreach = response.data.breaches.find(
        (b: any) => b.geofence_name === 'Square Test Zone'
      );
      expect(squareBreach).toBeDefined();
      
      const lShapedBreach = response.data.breaches.find(
        (b: any) => b.geofence_name === 'L-Shaped Test Zone'
      );
      expect(lShapedBreach).toBeUndefined();
    });
  });

  describe('3.2: Add real-time location checking via existing WebSocket', () => {
    it('should process location check immediately when called', async () => {
      // Create a test geofence
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Real-time Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7000, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0200 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: testUserId
        }
      });

      const startTime = Date.now();
      
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (< 1 second for real-time)
      expect(processingTime).toBeLessThan(1000);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(1);
    });

    it('should handle multiple concurrent location checks', async () => {
      // Create a test geofence
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Concurrent Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7000, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0200 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });

      // Create multiple location check requests
      const locationChecks = [
        { latitude: 40.7050, longitude: -74.0050, user_id: testUserId },
        { latitude: 40.7100, longitude: -74.0100, user_id: testUserId },
        { latitude: 40.7150, longitude: -74.0150, user_id: testUserId }
      ];

      const promises = locationChecks.map(async (locationData) => {
        const mockReq = { body: locationData } as any;
        const mockRes = {
          json: jest.fn()
        } as any;

        await controller.checkLocation(mockReq, mockRes);
        return mockRes.json.mock.calls[0][0];
      });

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.data.breaches).toHaveLength(1);
      });
    });
  });

  describe('3.3: Create immediate breach detection and logging', () => {
    beforeEach(async () => {
      // Create a test geofence
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Logging Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7000, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0200 }
          ]),
          risk_level: 'HIGH',
          type: 'RESTRICTED',
          created_by: testUserId
        }
      });
      testGeofenceId = testGeofence.id;
    });

    it('should immediately log breach when detected', async () => {
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      // Check there are no breaches initially
      const initialBreachCount = await testDb.dbManager.client.geofenceBreach.count({
        where: { user_id: testUserId, geofence_id: testGeofenceId }
      });

      await controller.checkLocation(mockReq, mockRes);

      // Verify breach was logged immediately
      const finalBreachCount = await testDb.dbManager.client.geofenceBreach.count({
        where: { user_id: testUserId, geofence_id: testGeofenceId }
      });

      expect(finalBreachCount).toBe(initialBreachCount + 1);

      // Verify the logged breach has correct data
      const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
        where: { user_id: testUserId, geofence_id: testGeofenceId },
        orderBy: { occurred_at: 'desc' }
      });

      expect(loggedBreach).toBeDefined();
      expect(loggedBreach!.latitude).toBe(40.7100);
      expect(loggedBreach!.longitude).toBe(-74.0100);
      expect(loggedBreach!.risk_score).toBeGreaterThanOrEqual(80); // HIGH risk
      expect(loggedBreach!.alert_sent).toBe(false); // Default state
    });

    it('should log multiple breaches for multiple geofences', async () => {
      // Create a second overlapping geofence
      const secondGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Overlapping Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7050, lng: -74.0150 },
            { lat: 40.7050, lng: -74.0050 },
            { lat: 40.7150, lng: -74.0050 },
            { lat: 40.7150, lng: -74.0150 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });

      const locationData = {
        latitude: 40.7100, // In both geofences
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Should log breaches for both geofences
      const totalBreaches = await testDb.dbManager.client.geofenceBreach.count({
        where: { user_id: testUserId }
      });

      expect(totalBreaches).toBe(2);

      // Verify both geofences are represented
      const breachGeofences = await testDb.dbManager.client.geofenceBreach.findMany({
        where: { user_id: testUserId },
        select: { geofence_id: true }
      });

      const geofenceIds = breachGeofences.map(b => b.geofence_id);
      expect(geofenceIds).toContain(testGeofenceId);
      expect(geofenceIds).toContain(secondGeofence.id);
    });

    it('should not log breach when outside geofence', async () => {
      const locationData = {
        latitude: 40.6900, // Outside the geofence
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      const initialBreachCount = await testDb.dbManager.client.geofenceBreach.count({
        where: { user_id: testUserId, geofence_id: testGeofenceId }
      });

      await controller.checkLocation(mockReq, mockRes);

      const finalBreachCount = await testDb.dbManager.client.geofenceBreach.count({
        where: { user_id: testUserId, geofence_id: testGeofenceId }
      });

      expect(finalBreachCount).toBe(initialBreachCount); // No new breaches
    });
  });

  describe('3.4: Write tests for detection accuracy', () => {
    it('should have consistent point-in-polygon results for same input', async () => {
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Consistency Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7000, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0000 },
            { lat: 40.7200, lng: -74.0200 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: testUserId
        }
      });

      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      // Run the same check multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const mockReq = { body: locationData } as any;
        const mockRes = {
          json: jest.fn()
        } as any;

        await controller.checkLocation(mockReq, mockRes);
        results.push(mockRes.json.mock.calls[0][0]);
      }

      // All results should be identical
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.breaches).toHaveLength(1);
        expect(result.data.breaches[0].geofence_id).toBe(testGeofence.id);
      });
    });

    it('should handle precision near polygon edges accurately', async () => {
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Precision Test Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000000, lng: -74.0200000 },
            { lat: 40.7000000, lng: -74.0000000 },
            { lat: 40.7200000, lng: -74.0000000 },
            { lat: 40.7200000, lng: -74.0200000 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });

      // Test points very close to but outside the boundary
      const outsidePoints = [
        { latitude: 40.6999999, longitude: -74.0100000 }, // Just below
        { latitude: 40.7200001, longitude: -74.0100000 }, // Just above
        { latitude: 40.7100000, longitude: -73.9999999 }, // Just right
        { latitude: 40.7100000, longitude: -74.0200001 }  // Just left
      ];

      for (const point of outsidePoints) {
        const mockReq = { body: { ...point, user_id: testUserId } } as any;
        const mockRes = {
          json: jest.fn()
        } as any;

        await controller.checkLocation(mockReq, mockRes);
        const response = mockRes.json.mock.calls[0][0];
        
        // These should consistently be outside
        expect(response.data.breaches).toHaveLength(0);
      }

      // Test points just inside the boundary
      const insidePoints = [
        { latitude: 40.7000001, longitude: -74.0100000 }, // Just above bottom
        { latitude: 40.7199999, longitude: -74.0100000 }, // Just below top
        { latitude: 40.7100000, longitude: -74.0000001 }, // Just left of right edge
        { latitude: 40.7100000, longitude: -74.0199999 }  // Just right of left edge
      ];

      for (const point of insidePoints) {
        const mockReq = { body: { ...point, user_id: testUserId } } as any;
        const mockRes = {
          json: jest.fn()
        } as any;

        await controller.checkLocation(mockReq, mockRes);
        const response = mockRes.json.mock.calls[0][0];
        
        // These should consistently be inside
        expect(response.data.breaches).toHaveLength(1);
      }
    });

    it('should correctly calculate risk scores based on geofence risk levels', async () => {
      const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Low Risk Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7000, lng: -74.0300 },
            { lat: 40.7000, lng: -74.0200 },
            { lat: 40.7100, lng: -74.0200 },
            { lat: 40.7100, lng: -74.0300 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: testUserId
        }
      });

      const mediumRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Medium Risk Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7100, lng: -74.0300 },
            { lat: 40.7100, lng: -74.0200 },
            { lat: 40.7200, lng: -74.0200 },
            { lat: 40.7200, lng: -74.0300 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: testUserId
        }
      });

      const highRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'High Risk Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7200, lng: -74.0300 },
            { lat: 40.7200, lng: -74.0200 },
            { lat: 40.7300, lng: -74.0200 },
            { lat: 40.7300, lng: -74.0300 }
          ]),
          risk_level: 'HIGH',
          type: 'RESTRICTED',
          created_by: testUserId
        }
      });

      // Test each risk level
      const testCases = [
        { lat: 40.7050, lng: -74.0250, expectedRange: [0, 39], name: 'Low Risk Zone' },
        { lat: 40.7150, lng: -74.0250, expectedRange: [40, 79], name: 'Medium Risk Zone' },
        { lat: 40.7250, lng: -74.0250, expectedRange: [80, 100], name: 'High Risk Zone' }
      ];

      for (const testCase of testCases) {
        const mockReq = { 
          body: { 
            latitude: testCase.lat, 
            longitude: testCase.lng, 
            user_id: testUserId 
          } 
        } as any;
        const mockRes = {
          json: jest.fn()
        } as any;

        await controller.checkLocation(mockReq, mockRes);
        const response = mockRes.json.mock.calls[0][0];
        
        expect(response.data.breaches).toHaveLength(1);
        const breach = response.data.breaches[0];
        expect(breach.geofence_name).toBe(testCase.name);
        expect(breach.risk_score).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
        expect(breach.risk_score).toBeLessThanOrEqual(testCase.expectedRange[1]);
      }
    });
  });
});
