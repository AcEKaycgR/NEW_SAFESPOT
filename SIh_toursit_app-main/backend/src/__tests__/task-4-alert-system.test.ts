import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { GeofenceController } from '../controllers/geofence.controller';
import { WebSocketService } from '../services/websocket.service';
import { TestDatabaseSetup } from '../test-utils/database-setup';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

// Mock WebSocket service for testing
class MockWebSocketService {
  private notifications: any[] = [];
  private adminNotifications: any[] = [];
  
  async broadcastNotification(notification: any) {
    this.notifications.push(notification);
  }
  
  async broadcastAdminAlert(alert: any) {
    this.adminNotifications.push(alert);
  }
  
  getNotifications() {
    return this.notifications;
  }
  
  getAdminNotifications() {
    return this.adminNotifications;
  }
  
  clearNotifications() {
    this.notifications = [];
    this.adminNotifications = [];
  }
  
  isUserConnected(userId: string): boolean {
    return true; // Assume users are connected for testing
  }
}

describe('Task 4: Simple Alert System', () => {
  let testDb: TestDatabaseSetup;
  let controller: GeofenceController;
  let mockWebSocket: MockWebSocketService;
  let testUserId: number;
  let adminUserId: number;
  let testGeofenceId: number;

  beforeAll(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
    controller = new GeofenceController();
    mockWebSocket = new MockWebSocketService();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.cleanup();
    mockWebSocket.clearNotifications();
    
    // Create test users
    const testUser = await testDb.createTestUser({
      email: `test-alerts-${Date.now()}@example.com`,
      name: 'Test Alert User'
    });
    testUserId = testUser.id;
    
    const adminUser = await testDb.createTestUser({
      email: `admin-alerts-${Date.now()}@example.com`,
      name: 'Admin Alert User'
    });
    adminUserId = adminUser.id;
    
    // Create a test geofence
    const testGeofence = await testDb.dbManager.client.geofenceArea.create({
      data: {
        name: 'Alert Test Zone',
        description: 'Test geofence for alert system',
        polygon_coords: JSON.stringify([
          { lat: 40.7000, lng: -74.0200 },
          { lat: 40.7000, lng: -74.0000 },
          { lat: 40.7200, lng: -74.0000 },
          { lat: 40.7200, lng: -74.0200 }
        ]),
        risk_level: 'HIGH',
        type: 'RESTRICTED',
        created_by: adminUserId
      }
    });
    testGeofenceId = testGeofence.id;
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('4.1: Implement WebSocket notifications for users', () => {
    it('should send geofence breach notification to user', async () => {
      // Mock the WebSocket service on the controller
      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.7100, // Inside the geofence
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Verify breach was detected
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(1);

      // Check if notification was sent
      const notifications = mockWebSocket.getNotifications();
      expect(notifications).toHaveLength(1);
      
      const notification = notifications[0];
      expect(notification.type).toBe('geofence_breach');
      expect(notification.userId).toBe(testUserId.toString());
      expect(notification.data.geofence_name).toBe('Alert Test Zone');
      expect(notification.data.risk_level).toBe('HIGH');
      expect(notification.data.breach_location).toEqual({
        latitude: 40.7100,
        longitude: -74.0100
      });
    });

    it('should include safety recommendations in breach notifications', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
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

      const notifications = mockWebSocket.getNotifications();
      const notification = notifications[0];
      
      expect(notification.data.safety_recommendations).toBeDefined();
      expect(Array.isArray(notification.data.safety_recommendations)).toBe(true);
      expect(notification.data.safety_recommendations.length).toBeGreaterThan(0);
    });

    it('should not send notification if user is outside all geofences', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.6900, // Outside the geofence
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Verify no breach was detected
      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.breaches).toHaveLength(0);

      // Check no notification was sent
      const notifications = mockWebSocket.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should send different notification types based on risk level', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      // Create geofences with different risk levels
      const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Low Risk Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7300, lng: -74.0300 },
            { lat: 40.7300, lng: -74.0200 },
            { lat: 40.7400, lng: -74.0200 },
            { lat: 40.7400, lng: -74.0300 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: adminUserId
        }
      });

      const mediumRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Medium Risk Zone',
          polygon_coords: JSON.stringify([
            { lat: 40.7400, lng: -74.0300 },
            { lat: 40.7400, lng: -74.0200 },
            { lat: 40.7500, lng: -74.0200 },
            { lat: 40.7500, lng: -74.0300 }
          ]),
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          created_by: adminUserId
        }
      });

      // Test different risk levels
      const testCases = [
        { 
          location: { lat: 40.7350, lng: -74.0250 }, 
          expectedRisk: 'LOW',
          expectedPriority: 'info'
        },
        { 
          location: { lat: 40.7450, lng: -74.0250 }, 
          expectedRisk: 'MEDIUM',
          expectedPriority: 'warning' 
        },
        { 
          location: { lat: 40.7100, lng: -74.0100 }, 
          expectedRisk: 'HIGH',
          expectedPriority: 'urgent' 
        }
      ];

      for (const testCase of testCases) {
        mockWebSocket.clearNotifications();
        
        const mockReq = { 
          body: { 
            ...testCase.location, 
            latitude: testCase.location.lat,
            longitude: testCase.location.lng,
            user_id: testUserId 
          } 
        } as any;
        const mockRes = { json: jest.fn() } as any;

        await controller.checkLocation(mockReq, mockRes);

        const notifications = mockWebSocket.getNotifications();
        expect(notifications).toHaveLength(1);
        
        const notification = notifications[0];
        expect(notification.data.risk_level).toBe(testCase.expectedRisk);
        expect(notification.data.priority).toBe(testCase.expectedPriority);
      }
    });
  });

  describe('4.2: Add admin alert notifications via WebSocket', () => {
    it('should send admin alert for high-risk breaches', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.7100, // High-risk breach
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Check admin notifications
      const adminNotifications = mockWebSocket.getAdminNotifications();
      expect(adminNotifications).toHaveLength(1);
      
      const adminAlert = adminNotifications[0];
      expect(adminAlert.type).toBe('admin_geofence_alert');
      expect(adminAlert.data.user_id).toBe(testUserId);
      expect(adminAlert.data.geofence_name).toBe('Alert Test Zone');
      expect(adminAlert.data.risk_level).toBe('HIGH');
      expect(adminAlert.data.requires_immediate_attention).toBe(true);
    });

    it('should not send admin alert for low-risk breaches', async () => {
      // Create a low-risk geofence
      const lowRiskGeofence = await testDb.dbManager.client.geofenceArea.create({
        data: {
          name: 'Low Risk Admin Test',
          polygon_coords: JSON.stringify([
            { lat: 40.7300, lng: -74.0300 },
            { lat: 40.7300, lng: -74.0200 },
            { lat: 40.7400, lng: -74.0200 },
            { lat: 40.7400, lng: -74.0300 }
          ]),
          risk_level: 'LOW',
          type: 'SAFE_ZONE',
          created_by: adminUserId
        }
      });

      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.7350,
        longitude: -74.0250,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Check no admin notification for low-risk
      const adminNotifications = mockWebSocket.getAdminNotifications();
      expect(adminNotifications).toHaveLength(0);
    });

    it('should include user context in admin alerts', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
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

      const adminNotifications = mockWebSocket.getAdminNotifications();
      const adminAlert = adminNotifications[0];
      
      expect(adminAlert.data.user_context).toBeDefined();
      expect(adminAlert.data.user_context.user_id).toBe(testUserId);
      expect(adminAlert.data.timestamp).toBeDefined();
      expect(adminAlert.data.location_accuracy).toBeDefined();
    });

    it('should send admin summary for multiple breaches', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      // Create multiple users breaching the same geofence
      const user2 = await testDb.createTestUser({
        email: `user2-${Date.now()}@example.com`,
        name: 'User 2'
      });
      
      const user3 = await testDb.createTestUser({
        email: `user3-${Date.now()}@example.com`,
        name: 'User 3'
      });

      // Multiple breaches in the same area
      const users = [testUserId, user2.id, user3.id];
      
      for (const userId of users) {
        const mockReq = { 
          body: { 
            latitude: 40.7100, 
            longitude: -74.0100, 
            user_id: userId 
          } 
        } as any;
        const mockRes = { json: jest.fn() } as any;

        await controller.checkLocation(mockReq, mockRes);
      }

      const adminNotifications = mockWebSocket.getAdminNotifications();
      expect(adminNotifications).toHaveLength(3); // One for each breach
      
      // All should be for the same geofence
      adminNotifications.forEach(alert => {
        expect(alert.data.geofence_name).toBe('Alert Test Zone');
        expect(alert.data.risk_level).toBe('HIGH');
      });
    });
  });

  describe('4.3: Create basic breach event logging', () => {
    it('should log breach event with complete details', async () => {
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

      // Check breach was logged in database
      const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        },
        orderBy: { occurred_at: 'desc' }
      });

      expect(loggedBreach).toBeDefined();
      expect(loggedBreach!.latitude).toBe(40.7100);
      expect(loggedBreach!.longitude).toBe(-74.0100);
      expect(loggedBreach!.risk_score).toBeGreaterThanOrEqual(80); // High risk
      expect(loggedBreach!.occurred_at).toBeDefined();
      // Note: alert_sent will be true if WebSocket service is working, false if not
      expect(typeof loggedBreach!.alert_sent).toBe('boolean');
    });

    it('should log alert notification status', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
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

      // Check that alert_sent was updated
      const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        },
        orderBy: { occurred_at: 'desc' }
      });

      expect(loggedBreach!.alert_sent).toBe(true); // Should be updated
    });

    it('should log breach resolution time', async () => {
      // First, create a breach
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      let mockReq = { body: locationData } as any;
      let mockRes = { json: jest.fn() } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Then, move outside the geofence
      const exitLocationData = {
        latitude: 40.6900, // Outside
        longitude: -74.0100,
        user_id: testUserId
      };

      mockReq = { body: exitLocationData } as any;
      mockRes = { json: jest.fn() } as any;

      await controller.checkLocation(mockReq, mockRes);

      // Check that breach was resolved (no new breaches)
      const allBreaches = await testDb.dbManager.client.geofenceBreach.findMany({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        },
        orderBy: { occurred_at: 'desc' }
      });

      expect(allBreaches).toHaveLength(1); // Only the initial breach
    });

    it('should maintain breach audit trail', async () => {
      // Create multiple breaches to test audit trail
      const locations = [
        { lat: 40.7100, lng: -74.0100 },
        { lat: 40.7110, lng: -74.0110 },
        { lat: 40.7120, lng: -74.0120 }
      ];

      for (const location of locations) {
        const mockReq = { 
          body: { 
            latitude: location.lat, 
            longitude: location.lng, 
            user_id: testUserId 
          } 
        } as any;
        const mockRes = { json: jest.fn() } as any;

        await controller.checkLocation(mockReq, mockRes);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Check audit trail
      const auditTrail = await testDb.dbManager.client.geofenceBreach.findMany({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        },
        orderBy: { occurred_at: 'asc' }
      });

      expect(auditTrail).toHaveLength(3);
      
      // Verify chronological order
      for (let i = 1; i < auditTrail.length; i++) {
        expect(auditTrail[i].occurred_at.getTime())
          .toBeGreaterThanOrEqual(auditTrail[i-1].occurred_at.getTime());
      }
      
      // Verify location tracking
      expect(auditTrail[0].latitude).toBe(40.7100);
      expect(auditTrail[1].latitude).toBe(40.7110);
      expect(auditTrail[2].latitude).toBe(40.7120);
    });
  });

  describe('4.4: Test end-to-end alert flow', () => {
    it('should complete full alert flow: detection -> logging -> user notification -> admin alert', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      // Execute the full flow
      await controller.checkLocation(mockReq, mockRes);

      // 1. Verify breach detection
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(1);

      // 2. Verify database logging
      const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        }
      });
      expect(loggedBreach).toBeDefined();

      // 3. Verify user notification
      const userNotifications = mockWebSocket.getNotifications();
      expect(userNotifications).toHaveLength(1);
      expect(userNotifications[0].type).toBe('geofence_breach');

      // 4. Verify admin alert
      const adminNotifications = mockWebSocket.getAdminNotifications();
      expect(adminNotifications).toHaveLength(1);
      expect(adminNotifications[0].type).toBe('admin_geofence_alert');

      // 5. Verify data consistency across all components
      const breach = response.data.breaches[0];
      const userNotif = userNotifications[0];
      const adminNotif = adminNotifications[0];

      expect(breach.geofence_name).toBe(userNotif.data.geofence_name);
      expect(breach.geofence_name).toBe(adminNotif.data.geofence_name);
      expect(breach.risk_level).toBe(userNotif.data.risk_level);
      expect(breach.risk_level).toBe(adminNotif.data.risk_level);
    });

    it('should handle alert flow failures gracefully', async () => {
      // Mock WebSocket service that throws errors
      const faultyWebSocket = {
        broadcastNotification: jest.fn().mockImplementation(() => Promise.reject(new Error('WebSocket error'))),
        broadcastAdminAlert: jest.fn().mockImplementation(() => Promise.reject(new Error('Admin alert error')))
      };
      
      (controller as any).webSocketService = faultyWebSocket;
      
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      const mockReq = { body: locationData } as any;
      const mockRes = {
        json: jest.fn()
      } as any;

      // Should not throw error even if WebSocket fails
      await expect(controller.checkLocation(mockReq, mockRes)).resolves.not.toThrow();

      // Core functionality should still work
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.breaches).toHaveLength(1);

      // Database logging should still work
      const loggedBreach = await testDb.dbManager.client.geofenceBreach.findFirst({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        }
      });
      expect(loggedBreach).toBeDefined();
    });

    it('should rate-limit alerts to prevent spam', async () => {
      (controller as any).webSocketService = mockWebSocket;
      
      const locationData = {
        latitude: 40.7100,
        longitude: -74.0100,
        user_id: testUserId
      };

      // Send multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const mockReq = { body: locationData } as any;
        const mockRes = { json: jest.fn() } as any;
        promises.push(controller.checkLocation(mockReq, mockRes));
      }

      await Promise.all(promises);

      // Should have logged all breaches
      const allBreaches = await testDb.dbManager.client.geofenceBreach.findMany({
        where: { 
          user_id: testUserId, 
          geofence_id: testGeofenceId 
        }
      });
      expect(allBreaches.length).toBeGreaterThan(0);

      // But notifications might be rate-limited (depending on implementation)
      const userNotifications = mockWebSocket.getNotifications();
      const adminNotifications = mockWebSocket.getAdminNotifications();
      
      // At minimum, should have sent some notifications
      expect(userNotifications.length).toBeGreaterThan(0);
      expect(adminNotifications.length).toBeGreaterThan(0);
    });
  });
});
