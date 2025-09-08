import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { geofenceRoutes } from '../routes/geofence.routes';
import { CreateGeofenceRequest } from '../types/geofence';
import { TestDatabaseSetup } from '../test-utils/database-setup';

const app = express();
app.use(express.json());

// Mock authentication middleware for tests
let currentTestUserId = 1; // Default value
app.use((req: any, res, next) => {
  req.user = { id: currentTestUserId };
  next();
});

app.use('/api', geofenceRoutes);

describe('Geofence API Endpoints', () => {
  let testDb: TestDatabaseSetup;
  let testUserId: number;
  let testGeofenceId: number;

  beforeAll(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.cleanup();
    
    // Create a test user for the API requests
    const testUser = await testDb.createTestUser({
      email: `test-geofence-${Date.now()}@example.com`,
      name: 'Test Geofence User'
    });
    testUserId = testUser.id;
    currentTestUserId = testUserId;
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('POST /api/geofences', () => {
    it('should create a new geofence with valid data', async () => {
      const geofenceData: CreateGeofenceRequest = {
        name: 'Test Safety Zone API',
        description: 'A test geofence created via API',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 },
          { lat: 40.7123, lng: -74.0062 }
        ],
        risk_level: 'MEDIUM',
        type: 'ALERT_ZONE'
      };

      const response = await request(app)
        .post('/api/geofences')
        .send(geofenceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: geofenceData.name,
        description: geofenceData.description,
        risk_level: geofenceData.risk_level,
        type: geofenceData.type,
        is_active: true
      });
      expect(response.body.data.polygon_coords).toEqual(geofenceData.polygon_coords);
      
      testGeofenceId = response.body.data.id;
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

      const response = await request(app)
        .post('/api/geofences')
        .send(invalidGeofenceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject geofence with invalid coordinates', async () => {
      const invalidGeofenceData = {
        name: 'Invalid Zone',
        polygon_coords: [
          { lat: 200, lng: -74.0060 }, // Invalid latitude
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'LOW',
        type: 'SAFE_ZONE'
      };

      const response = await request(app)
        .post('/api/geofences')
        .send(invalidGeofenceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject geofence with invalid risk level', async () => {
      const invalidGeofenceData = {
        name: 'Invalid Zone',
        polygon_coords: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7125, lng: -74.0055 }
        ],
        risk_level: 'INVALID_LEVEL', // Invalid risk level
        type: 'SAFE_ZONE'
      };

      const response = await request(app)
        .post('/api/geofences')
        .send(invalidGeofenceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/geofences', () => {
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
      const response = await request(app)
        .get('/api/geofences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.geofences).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThan(0);
      
      const testGeofence = response.body.data.geofences.find(
        (g: any) => g.id === testGeofenceId
      );
      expect(testGeofence).toBeDefined();
      expect(testGeofence.name).toBe('Test Zone for GET');
    });

    it('should filter geofences by risk level', async () => {
      const response = await request(app)
        .get('/api/geofences?risk_level=HIGH')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.geofences).toBeInstanceOf(Array);
      
      // All returned geofences should have HIGH risk level
      response.body.data.geofences.forEach((geofence: any) => {
        expect(geofence.risk_level).toBe('HIGH');
      });
    });

    it('should filter geofences by type', async () => {
      const response = await request(app)
        .get('/api/geofences?type=RESTRICTED')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.geofences).toBeInstanceOf(Array);
      
      // All returned geofences should be RESTRICTED type
      response.body.data.geofences.forEach((geofence: any) => {
        expect(geofence.type).toBe('RESTRICTED');
      });
    });
  });

  describe('POST /api/geofences/check-location', () => {
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

      const response = await request(app)
        .post('/api/geofences/check-location')
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breaches).toBeInstanceOf(Array);
      expect(response.body.data.breaches.length).toBeGreaterThan(0);
      
      const breach = response.body.data.breaches[0];
      expect(breach.geofence_id).toBe(testGeofenceId);
      expect(breach.geofence_name).toBe('Manhattan Test Zone');
      expect(breach.risk_level).toBe('MEDIUM');
      expect(breach.risk_score).toBeGreaterThanOrEqual(40);
      expect(breach.risk_score).toBeLessThan(80);
      expect(breach.recommendations).toBeInstanceOf(Array);
    });

    it('should not detect breach for location outside geofence', async () => {
      const locationData = {
        latitude: 41.0000, // Outside the Manhattan test zone
        longitude: -75.0000,
        user_id: testUserId
      };

      const response = await request(app)
        .post('/api/geofences/check-location')
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breaches).toBeInstanceOf(Array);
      expect(response.body.data.breaches.length).toBe(0);
    });

    it('should validate location coordinates', async () => {
      const invalidLocationData = {
        latitude: 200, // Invalid latitude
        longitude: -74.0060,
        user_id: testUserId
      };

      const response = await request(app)
        .post('/api/geofences/check-location')
        .send(invalidLocationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should require user_id', async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.0060
        // Missing user_id
      };

      const response = await request(app)
        .post('/api/geofences/check-location')
        .send(locationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should log breach in database', async () => {
      const locationData = {
        latitude: 40.7128, // Inside the Manhattan test zone
        longitude: -74.0060,
        user_id: testUserId
      };

      const response = await request(app)
        .post('/api/geofences/check-location')
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breaches.length).toBeGreaterThan(0);

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

  describe('GET /api/geofences/stats', () => {
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
      const response = await request(app)
        .get('/api/geofences/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalGeofences: expect.any(Number),
        activeGeofences: expect.any(Number),
        totalBreaches: expect.any(Number),
        recentBreaches: expect.any(Number)
      });
      
      expect(response.body.data.totalGeofences).toBeGreaterThan(0);
      expect(response.body.data.activeGeofences).toBeGreaterThan(0);
      expect(response.body.data.totalBreaches).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/geofences/:id', () => {
    beforeEach(async () => {
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Original Zone',
          description: 'Original description',
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
    });

    it('should update geofence with valid data', async () => {
      const updateData = {
        name: 'Updated Zone',
        description: 'Updated description',
        risk_level: 'HIGH'
      };

      const response = await request(app)
        .put(`/api/geofences/${testGeofenceId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Zone');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.risk_level).toBe('HIGH');
    });

    it('should return 404 for non-existent geofence', async () => {
      const updateData = {
        name: 'Updated Zone'
      };

      const response = await request(app)
        .put('/api/geofences/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Geofence not found');
    });
  });

  describe('DELETE /api/geofences/:id', () => {
    beforeEach(async () => {
      const testGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Zone to Delete',
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

    it('should soft delete geofence', async () => {
      const response = await request(app)
        .delete(`/api/geofences/${testGeofenceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofence deleted successfully');

      // Verify geofence is marked as inactive
      const deletedGeofence = await testDb.dbManager.client.geofenceArea.findUnique({
        where: { id: testGeofenceId }
      });
      expect(deletedGeofence?.is_active).toBe(false);
    });

    it('should return 404 for non-existent geofence', async () => {
      const response = await request(app)
        .delete('/api/geofences/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Geofence not found');
    });
  });
});
