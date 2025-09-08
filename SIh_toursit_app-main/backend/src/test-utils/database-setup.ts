// Database test utilities for proper test isolation and setup
import { PrismaDatabaseManager } from '../database/prisma-manager';
import { UserModel, UserProfileModel, DigitalIDModel } from '../database/index';
import { VerificationStatus } from '../database/types';

export class TestDatabaseSetup {
  public dbManager: PrismaDatabaseManager;
  public userModel: UserModel;
  public userProfileModel: UserProfileModel;
  public digitalIDModel: DigitalIDModel;
  private testUsers: number[] = []; // Track created users for cleanup

  constructor() {
    this.dbManager = new PrismaDatabaseManager();
    this.userModel = new UserModel(this.dbManager);
    this.userProfileModel = new UserProfileModel(this.dbManager);
    this.digitalIDModel = new DigitalIDModel(this.dbManager);
  }

  async setup(): Promise<void> {
    try {
      await this.dbManager.connect();
      // Ensure clean state at start
      await this.forceCleanup();
      console.log('Test database connected');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  }

  /**
   * Creates a test user and tracks it for cleanup
   */
  async createTestUser(userData: { email: string; name: string }): Promise<{ id: number; email: string; name: string }> {
    try {
      const user = await this.userModel.createUser(userData);
      this.testUsers.push(user.id);
      return user;
    } catch (error) {
      console.error('Failed to create test user:', error);
      throw error;
    }
  }

  /**
   * Enhanced cleanup that handles foreign key constraints properly
   */
  async cleanup(): Promise<void> {
    try {
      await this.dbManager.cleanTestData();
      this.testUsers = []; // Reset tracked users
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Failed to clean up test database:', error);
      // Try force cleanup as fallback
      await this.forceCleanup();
    }
  }

  /**
   * Force cleanup using multiple strategies to ensure clean state
   */
  async forceCleanup(): Promise<void> {
    try {
      // Strategy 1: Use the enhanced cleanup
      await this.dbManager.cleanTestData();
      this.testUsers = [];
    } catch (error) {
      console.warn('Primary cleanup failed, attempting fallback methods');
      
      try {
        // Strategy 2: Manual cleanup of tracked users and their dependencies
        for (const userId of this.testUsers) {
          await this.cleanupUserAndDependencies(userId);
        }
        this.testUsers = [];
      } catch (cleanupError) {
        console.warn('Manual user cleanup failed, using raw cleanup');
        
        // Strategy 3: Raw SQL cleanup (last resort)
        await this.rawCleanup();
      }
    }
  }

  private async cleanupUserAndDependencies(userId: number): Promise<void> {
    try {
      const prisma = this.dbManager.client;
      
      // For individual user cleanup, it's easier to just delete all location access logs
      // and let the cascade handle the rest, or delete in simple order
      
      // Delete location access logs first
      await prisma.locationAccessLog.deleteMany({});
      
      // Delete location sharing settings for this user
      await prisma.locationSharingSettings.deleteMany({
        where: { user_id: userId }
      });
      
      // Delete other user-related data
      await prisma.digitalID.deleteMany({
        where: { user_id: userId }
      });
      
      await prisma.userProfile.deleteMany({
        where: { user_id: userId }
      });
      
      // Finally delete the user
      await prisma.user.delete({
        where: { id: userId }
      });
      
    } catch (error) {
      // Individual user cleanup failed, will be handled by caller
      throw error;
    }
  }

  private async rawCleanup(): Promise<void> {
    try {
      const prisma = this.dbManager.client;
      
      // Use raw SQL for cleanup if available, otherwise use deleteMany with ignore errors
      const tables = [
        'location_access_logs',
        'emergency_location_requests',
        'location_history_entries', 
        'geofence_areas',
        'location_privacy_settings',
        'location_sharing_settings',
        'digital_ids',
        'user_profiles',
        'users'
      ];

      for (const table of tables) {
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
        } catch (error) {
          // Ignore errors for individual table cleanup
          console.warn(`Raw cleanup failed for table ${table}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      this.testUsers = [];
    } catch (error) {
      console.error('Raw cleanup failed:', error);
      // At this point, we've exhausted all cleanup options
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.forceCleanup();
      await this.dbManager.disconnect();
      console.log('Test database disconnected');
    } catch (error) {
      console.error('Failed to teardown test database:', error);
      // Don't throw here, as teardown should be best effort
    }
  }

  /**
   * Create a fresh database state for each test
   */
  async resetForTest(): Promise<void> {
    await this.cleanup();
    // Give a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Create a test user with verified status
   */
  async createVerifiedUser(overrides: { 
    email?: string; 
    name?: string; 
    blockchain_address?: string; 
  } = {}): Promise<any> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const uniqueId = `${timestamp}-${random}`;
    
    // Create user directly with verified status to avoid update issues
    const userData = {
      email: overrides.email || `test-${uniqueId}@example.com`,
      name: overrides.name || `Test User ${uniqueId}`,
      blockchain_address: overrides.blockchain_address || `0x${uniqueId.replace('-', '')}${'0'.repeat(32)}`.substring(0, 42),
      verification_status: VerificationStatus.VERIFIED
    };

    return await this.dbManager.createUser(userData);
  }

  /**
   * Create a test user profile
   */
  async createTestUserProfile(userId: number, profileData: any = {}): Promise<any> {
    const defaultProfileData = {
      kyc_data: {
        document_type: 'passport',
        document_number: 'P123456789'
      },
      emergency_contacts: [
        {
          name: 'Emergency Contact',
          phone: '+1234567890',
          relationship: 'family'
        }
      ],
      ...profileData
    };

    return await this.userProfileModel.createProfile(userId, defaultProfileData);
  }

  /**
   * Create a test digital ID
   */
  async createTestDigitalID(userId: number, overrides: {
    blockchainHash?: string;
    qrCodeData?: any;
  } = {}): Promise<any> {
    const timestamp = Date.now();
    
    const blockchainHash = overrides.blockchainHash || `0x${(timestamp + 1000).toString(16).padStart(64, '0')}`;
    const qrCodeData = overrides.qrCodeData || { 
      user_id: userId,
      timestamp 
    };

    return await this.digitalIDModel.generateDigitalID(userId, blockchainHash, qrCodeData);
  }
}

// Export a singleton instance for tests
export const testDb = new TestDatabaseSetup();
