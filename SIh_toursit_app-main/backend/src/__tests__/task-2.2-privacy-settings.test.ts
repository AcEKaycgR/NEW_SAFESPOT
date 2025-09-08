import { Response } from 'express';
import { PrivacyController } from '../controllers/privacy.controller';
import { locationQueries } from '../database/location-queries';
import { TestDatabaseSetup } from '../test-utils/database-setup';
import { AuthenticatedRequest } from '../controllers/location.controller';
import { LocationPrecision } from '../types/location';

// Mock the location queries
jest.mock('../database/location-queries');
const mockLocationQueries = locationQueries as jest.Mocked<typeof locationQueries>;

describe('Task 2.2: Privacy Settings Management', () => {
  let testDb: TestDatabaseSetup;
  let controller: PrivacyController;
  let testUserId: number;

  beforeAll(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
    
    // Create test user
    const user = await testDb.createTestUser({
      email: 'privacy.test@example.com',
      name: 'Privacy Test User'
    });
    testUserId = user.id;
  });

  beforeEach(async () => {
    controller = new PrivacyController();
    await testDb.cleanup();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  describe('GET /api/location/privacy-settings - Get Privacy Settings', () => {
    it('should get user privacy settings with defaults if none exist', async () => {
      const mockReq = {
        user: { 
          id: testUserId, 
          email: 'test@example.com', 
          name: 'Test User' 
        }
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.getPrivacySettings.mockResolvedValue(null);

      await controller.getPrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          default_precision: 'STREET',
          allow_emergency_access: true,
          history_retention_days: 30,
          notify_on_access: true,
          auto_expire_minutes: 240,
          trusted_authorities: []
        }
      });
    });

    it('should get existing user privacy settings', async () => {
      const mockPrivacySettings = {
        id: 1,
        user_id: testUserId,
        default_precision: 'CITY' as any,
        allow_emergency_access: false,
        history_retention_days: 7,
        notify_on_access: true,
        auto_expire_minutes: 120,
        trusted_authorities: '[1, 2, 3]',
        updated_at: new Date()
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' }
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.getPrivacySettings.mockResolvedValue(mockPrivacySettings);

      await controller.getPrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          default_precision: 'CITY',
          allow_emergency_access: false,
          history_retention_days: 7,
          notify_on_access: true,
          auto_expire_minutes: 120,
          trusted_authorities: [1, 2, 3]
        }
      });
    });

    it('should require authentication', async () => {
      const mockReq = {
        user: undefined
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.getPrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' }
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.getPrivacySettings.mockRejectedValue(new Error('Database error'));

      await controller.getPrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('PUT /api/location/privacy-settings - Update Privacy Settings', () => {
    it('should update privacy settings with valid data', async () => {
      const updateData = {
        defaultPrecision: LocationPrecision.NEIGHBORHOOD,
        allowEmergencyServices: true,
        historyRetentionDays: 14,
        allowFamilyAccess: false,
        autoExpireMinutes: 360,
        trustedAuthorities: ['1', '5', '9']
      };

      const expectedDbData = {
        default_precision: LocationPrecision.NEIGHBORHOOD,
        allow_emergency_access: true,
        history_retention_days: 14,
        notify_on_access: false,
        auto_expire_minutes: 360,
        trusted_authorities: ['1', '5', '9']
      };

      const mockUpdatedSettings = {
        id: 1,
        user_id: testUserId,
        default_precision: LocationPrecision.NEIGHBORHOOD as any,
        allow_emergency_access: true,
        history_retention_days: 14,
        notify_on_access: false,
        auto_expire_minutes: 360,
        trusted_authorities: JSON.stringify(['1', '5', '9']),
        updated_at: new Date()
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: updateData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.updatePrivacySettings.mockResolvedValue(mockUpdatedSettings);

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockLocationQueries.updatePrivacySettings).toHaveBeenCalledWith(testUserId, expectedDbData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          default_precision: LocationPrecision.NEIGHBORHOOD,
          allow_emergency_access: true,
          history_retention_days: 14,
          notify_on_access: false,
          auto_expire_minutes: 360,
          trusted_authorities: ['1', '5', '9']
        }
      });
    });

    it('should require authentication', async () => {
      const mockReq = {
        user: undefined,
        body: {}
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should validate precision values', async () => {
      const invalidData = {
        defaultPrecision: 'INVALID_PRECISION'
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: invalidData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid enum value')
      });
    });

    it('should validate history retention days range', async () => {
      const invalidData = {
        historyRetentionDays: -5
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: invalidData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Number must be greater than or equal to 1')
      });
    });

    it('should validate auto expire minutes range', async () => {
      const invalidData = {
        autoExpireMinutes: 0
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: invalidData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Number must be greater than or equal to 5')
      });
    });

    it('should validate trusted authorities array', async () => {
      const invalidData = {
        trustedAuthorities: 'not-an-array'
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: invalidData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Expected array')
      });
    });

    it('should handle partial updates', async () => {
      const partialData = {
        allowFamilyAccess: false
      };

      const expectedDbData = {
        notify_on_access: false
      };

      const mockUpdatedSettings = {
        id: 1,
        user_id: testUserId,
        default_precision: 'STREET' as any,
        allow_emergency_access: true,
        history_retention_days: 30,
        notify_on_access: false,
        auto_expire_minutes: 240,
        trusted_authorities: '[]',
        updated_at: new Date()
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: partialData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.updatePrivacySettings.mockResolvedValue(mockUpdatedSettings);

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockLocationQueries.updatePrivacySettings).toHaveBeenCalledWith(testUserId, expectedDbData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors gracefully', async () => {
      const updateData = {
        defaultPrecision: LocationPrecision.CITY
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: updateData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.updatePrivacySettings.mockRejectedValue(new Error('Database error'));

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('Privacy Setting Validation Logic', () => {
    it('should apply default settings when creating new privacy settings', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: {}
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const defaultSettings = {
        id: 1,
        user_id: testUserId,
        default_precision: 'STREET' as any,
        allow_emergency_access: true,
        history_retention_days: 30,
        notify_on_access: true,
        auto_expire_minutes: 240,
        trusted_authorities: '[]',
        updated_at: new Date()
      };

      mockLocationQueries.updatePrivacySettings.mockResolvedValue(defaultSettings);

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          default_precision: 'STREET',
          allow_emergency_access: true,
          history_retention_days: 30,
          notify_on_access: true,
          auto_expire_minutes: 240,
          trusted_authorities: []
        })
      });
    });

    it('should preserve existing settings when updating only specific fields', async () => {
      const existingSettings = {
        id: 1,
        user_id: testUserId,
        default_precision: 'CITY' as any,
        allow_emergency_access: false,
        history_retention_days: 7,
        notify_on_access: true,
        auto_expire_minutes: 120,
        trusted_authorities: '[1, 2]',
        updated_at: new Date()
      };

      const updateData = {
        allowEmergencyServices: true
      };

      const mockReq = {
        user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
        body: updateData
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const updatedSettings = {
        ...existingSettings,
        allow_emergency_access: true,
        default_precision: 'CITY' as any,
        updated_at: new Date()
      };

      mockLocationQueries.updatePrivacySettings.mockResolvedValue(updatedSettings);

      await controller.updatePrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          default_precision: 'CITY',
          allow_emergency_access: true,
          history_retention_days: 7,
          notify_on_access: true,
          auto_expire_minutes: 120,
          trusted_authorities: [1, 2]
        })
      });
    });
  });

  describe('Default Setting Application', () => {
    it('should return default settings for new users', async () => {
      const mockReq = {
        user: { id: 999, email: 'test@example.com', name: 'Test User' } // New user ID
      } as unknown as AuthenticatedRequest;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      mockLocationQueries.getPrivacySettings.mockResolvedValue(null);

      await controller.getPrivacySettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          default_precision: 'STREET',
          allow_emergency_access: true,
          history_retention_days: 30,
          notify_on_access: true,
          auto_expire_minutes: 240,
          trusted_authorities: []
        }
      });
    });
  });
});
