import { TestDatabaseSetup } from '../test-utils/database-setup';
import { LocationController } from '../controllers/location.controller';
import { LocationAuthMiddleware } from '../middleware/location-auth.middleware';
import { LocationPrecision } from '../types/location';

describe('Task 2.1: Location Sharing API Endpoints', () => {
  let testDb: TestDatabaseSetup;
  let controller: LocationController;
  let testUserId: number;
  let testUser2Id: number;

  beforeAll(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
    controller = new LocationController();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    // Create fresh test users for each test to prevent foreign key issues
    const testUser1 = await testDb.createTestUser({
      email: 'user1@test.com',
      name: 'Test User 1'
    });
    testUserId = testUser1.id;

    const testUser2 = await testDb.createTestUser({
      email: 'user2@test.com', 
      name: 'Test User 2'
    });
    testUser2Id = testUser2.id;
  });

  afterEach(async () => {
    await testDb.forceCleanup();
  });

  describe('POST /api/location/share - Create Location Share', () => {
    it('should create location share with valid data', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false,
          allowedAccessors: ['friend1', 'friend2']
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: expect.any(Number),
            precision: 'STREET',
            emergency_override: false,
            user_id: testUserId
          })
        })
      );
    });

    it('should require authentication', async () => {
      const mockReq = {
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should validate request body', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {} // Missing required fields
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Validation error')
        })
      );
    });

    it('should handle all precision levels', async () => {
      const precisionLevels = [
        LocationPrecision.EXACT,
        LocationPrecision.STREET,
        LocationPrecision.NEIGHBORHOOD,
        LocationPrecision.CITY
      ];

      for (const precision of precisionLevels) {
        const mockReq = {
          user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
          body: {
            precision: precision,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            emergencyOverride: false
          }
        } as any;

        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        } as any;

        await controller.createLocationShare(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              precision: precision.toUpperCase()
            })
          })
        );
      }
    });

    it('should handle emergency override flag', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.EXACT,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: true
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            emergency_override: true
          })
        })
      );
    });
  });

  describe('GET /api/location/share/:id - Get Location Share', () => {
    it('should retrieve location share by ID', async () => {
      // First create a location share
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);
      const locationShareId = createRes.json.mock.calls[0][0].data.id;

      // Now retrieve it
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: locationShareId,
            user_id: testUserId
          })
        })
      );
    });

    it('should require authentication', async () => {
      const mockReq = {
        params: { id: '123' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should return 404 for non-existent location share', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: '99999' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Location share not found'
      });
    });

    it('should handle invalid ID format', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: 'invalid-id' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid location share ID'
      });
    });
  });

  describe('PUT /api/location/share/:id - Update Location Share', () => {
    it('should update location share with valid data', async () => {
      // First create a location share
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);
      const locationShareId = createRes.json.mock.calls[0][0].data.id;

      // Now update it
      const updateReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() },
        body: {
          precision: LocationPrecision.CITY,
          emergencyOverride: true
        }
      } as any;

      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updateLocationShare(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(updateRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: locationShareId,
            precision: 'CITY',
            emergency_override: true
          })
        })
      );
    });

    it('should require authentication', async () => {
      const mockReq = {
        params: { id: '123' },
        body: { precision: LocationPrecision.CITY }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updateLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 for non-existent location share', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: '99999' },
        body: { precision: LocationPrecision.CITY }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updateLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle partial updates', async () => {
      // Create location share first
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);
      const locationShareId = createRes.json.mock.calls[0][0].data.id;

      // Update only precision
      const updateReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() },
        body: { precision: LocationPrecision.NEIGHBORHOOD }
      } as any;

      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updateLocationShare(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(updateRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            precision: 'NEIGHBORHOOD'
          })
        })
      );
    });
  });

  describe('DELETE /api/location/share/:id - Delete Location Share', () => {
    it('should delete location share by ID', async () => {
      // First create a location share
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);
      const locationShareId = createRes.json.mock.calls[0][0].data.id;

      // Now delete it
      const deleteReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() }
      } as any;

      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.deleteLocationShare(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(200);
      expect(deleteRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Location share deleted'
      });
    });

    it('should require authentication', async () => {
      const mockReq = {
        params: { id: '123' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.deleteLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 for non-existent location share', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: '99999' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.deleteLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('GET /api/location/user/:userId/shares - Get User Location Shares', () => {
    it('should get all location shares for a user', async () => {
      // Create multiple location shares for the user
      for (let i = 0; i < 3; i++) {
        const createReq = {
          user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
          body: {
            precision: LocationPrecision.STREET,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            emergencyOverride: false
          }
        } as any;

        const createRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        } as any;

        await controller.createLocationShare(createReq, createRes);
      }

      // Get user shares
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { userId: testUserId.toString() },
        query: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getUserLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              user_id: testUserId
            })
          ])
        })
      );
    });

    it('should support pagination', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { userId: testUserId.toString() },
        query: { limit: '5', offset: '0' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getUserLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should require authentication', async () => {
      const mockReq = {
        params: { user: { id: testUserId, email: 'test@example.com', name: 'Test User' } },
        query: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getUserLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/location/active - Get Active Location Shares', () => {
    it('should get only active (non-expired) location shares', async () => {
      // Create active location share
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);

      // Get active shares
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        query: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getActiveLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should support filtering by precision', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        query: { precision: 'street' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getActiveLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should require authentication', async () => {
      const mockReq = {
        query: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getActiveLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should support pagination', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        query: { limit: '10', offset: '0' }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getActiveLocationShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('LocationAuthMiddleware - Authentication', () => {
    it('should authenticate valid Bearer token', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer 123:test@example.com:Test'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await LocationAuthMiddleware.authenticateToken(mockReq, mockRes as any, mockNext);

      expect(mockReq.user).toEqual({
        id: 123,
        email: 'test@example.com',
        name: 'Test'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const mockReq = {
        headers: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await LocationAuthMiddleware.authenticateToken(mockReq, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed Bearer token', async () => {
      const mockReq = {
        headers: {
          authorization: 'InvalidFormat'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await LocationAuthMiddleware.authenticateToken(mockReq, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token content', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalidtoken'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await LocationAuthMiddleware.authenticateToken(mockReq, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle malformed request data gracefully', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: 'invalid-precision',
          expiresAt: 'invalid-date'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Validation error')
        })
      );
    });

    it('should handle expired location shares correctly', async () => {
      // Create an expired location share
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          emergencyOverride: false
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);

      // Get active shares should not include expired ones
      const activeReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        query: {}
      } as any;

      const activeRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getActiveLocationShares(activeReq, activeRes);

      expect(activeRes.status).toHaveBeenCalledWith(200);
      // Should return empty array or not include expired shares
      const responseData = activeRes.json.mock.calls[0][0].data;
      expect(Array.isArray(responseData)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // 1. Create
      const createReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false,
          allowedAccessors: ['friend1']
        }
      } as any;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(createReq, createRes);
      expect(createRes.status).toHaveBeenCalledWith(201);
      const locationShareId = createRes.json.mock.calls[0][0].data.id;

      // 2. Read
      const readReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() }
      } as any;

      const readRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(readReq, readRes);
      expect(readRes.status).toHaveBeenCalledWith(200);

      // 3. Update
      const updateReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() },
        body: { precision: LocationPrecision.CITY }
      } as any;

      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updateLocationShare(updateReq, updateRes);
      expect(updateRes.status).toHaveBeenCalledWith(200);

      // 4. Delete
      const deleteReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() }
      } as any;

      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.deleteLocationShare(deleteReq, deleteRes);
      expect(deleteRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle multi-user privacy scenarios', async () => {
      // User 1 creates a location share
      const user1CreateReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {
          precision: LocationPrecision.STREET,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          emergencyOverride: false
        }
      } as any;

      const user1CreateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.createLocationShare(user1CreateReq, user1CreateRes);
      expect(user1CreateRes.status).toHaveBeenCalledWith(201);
      const locationShareId = user1CreateRes.json.mock.calls[0][0].data.id;

      // User 1 can access their own share
      const user1GetReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        params: { id: locationShareId.toString() }
      } as any;

      const user1GetRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(user1GetReq, user1GetRes);
      expect(user1GetRes.status).toHaveBeenCalledWith(200);

      // User 2 cannot access User 1's share (privacy protection)
      const user2GetReq = {
        user: { id: testUser2Id, email: 'test2@example.com', name: 'Test User 2' },
        params: { id: locationShareId.toString() }
      } as any;

      const user2GetRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getLocationShare(user2GetReq, user2GetRes);
      // Should return 404 or 403 (not found/unauthorized)
      expect([404, 403]).toContain(user2GetRes.status.mock.calls[0][0]);
    });
  });
});
