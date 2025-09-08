// Main models file - integrates database models with blockchain functionality
import { PrismaDatabaseManager } from './prisma-manager';
import { VerificationStatus, DigitalIDStatus, User, UserProfile, DigitalID } from './types';

export class UserModel {
  private db: PrismaDatabaseManager;

  constructor(dbManager?: PrismaDatabaseManager) {
    this.db = dbManager || new PrismaDatabaseManager();
  }

  async initialize(): Promise<void> {
    await this.db.connect();
  }

  async close(): Promise<void> {
    await this.db.disconnect();
  }

  /**
   * Create a new user with blockchain address
   */
  async createUser(userData: {
    email: string;
    name: string;
    blockchain_address?: string;
  }): Promise<User> {
    return await this.db.createUser({
      ...userData,
      verification_status: VerificationStatus.PENDING
    });
  }

  /**
   * Register user on blockchain and update verification status
   */
  async registerUserWithBlockchain(userId: number, blockchainAddress: string): Promise<User> {
    // First update the user with the blockchain address
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user with blockchain address
    await this.db.updateUserVerificationStatus(userId, VerificationStatus.VERIFIED);
    
    // You would also register on actual blockchain here
    // This is handled by the blockchain API endpoints
    
    return await this.db.getUserById(userId) as User;
  }

  /**
   * Get user by blockchain address
   */
  async getUserByBlockchainAddress(address: string): Promise<User | null> {
    return await this.db.getUserByBlockchainAddress(address);
  }

  /**
   * Verify user's blockchain identity
   */
  async verifyUser(userId: number): Promise<User> {
    return await this.db.updateUserVerificationStatus(userId, VerificationStatus.VERIFIED);
  }

  /**
   * Revoke user's verification
   */
  async revokeUserVerification(userId: number): Promise<User> {
    return await this.db.updateUserVerificationStatus(userId, VerificationStatus.REVOKED);
  }
}

export class UserProfileModel {
  private db: PrismaDatabaseManager;

  constructor(dbManager?: PrismaDatabaseManager) {
    this.db = dbManager || new PrismaDatabaseManager();
  }

  async initialize(): Promise<void> {
    await this.db.connect();
  }

  async close(): Promise<void> {
    await this.db.disconnect();
  }

  /**
   * Create user profile with KYC data
   */
  async createProfile(userId: number, profileData: {
    kyc_data: any;
    emergency_contacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
  }): Promise<UserProfile> {
    return await this.db.createUserProfile({
      user_id: userId,
      ...profileData
    });
  }

  /**
   * Get complete user profile with user data
   */
  async getCompleteProfile(userId: number): Promise<UserProfile | null> {
    return await this.db.getUserProfileWithUser(userId);
  }

  /**
   * Update KYC data
   */
  async updateKYCData(userId: number, kycData: any): Promise<UserProfile> {
    const existingProfile = await this.db.getUserProfile(userId);
    if (!existingProfile) {
      throw new Error('User profile not found');
    }

    return await this.db.updateUserProfile(userId, {
      user_id: userId,
      kyc_data: kycData,
      emergency_contacts: existingProfile.emergency_contacts
    });
  }

  /**
   * Update emergency contacts
   */
  async updateEmergencyContacts(userId: number, contacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>): Promise<UserProfile> {
    const existingProfile = await this.db.getUserProfile(userId);
    if (!existingProfile) {
      throw new Error('User profile not found');
    }

    return await this.db.updateUserProfile(userId, {
      user_id: userId,
      kyc_data: existingProfile.kyc_data,
      emergency_contacts: contacts
    });
  }
}

export class DigitalIDModel {
  private db: PrismaDatabaseManager;

  constructor(dbManager?: PrismaDatabaseManager) {
    this.db = dbManager || new PrismaDatabaseManager();
  }

  async initialize(): Promise<void> {
    await this.db.connect();
  }

  async close(): Promise<void> {
    await this.db.disconnect();
  }

  /**
   * Generate a new digital ID for a verified user
   */
  async generateDigitalID(userId: number, blockchainHash: string, qrCodeData: any): Promise<DigitalID> {
    // Check if user is verified
    const user = await this.db.getUserById(userId);
    if (!user || user.verification_status !== VerificationStatus.VERIFIED) {
      throw new Error('User must be verified to generate digital ID');
    }

    // Set validity period (1 year from now)
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    return await this.db.createDigitalID({
      user_id: userId,
      blockchain_hash: blockchainHash,
      qr_code_data: JSON.stringify(qrCodeData),
      valid_from: validFrom,
      valid_until: validUntil,
      status: DigitalIDStatus.ACTIVE
    });
  }

  /**
   * Get active digital IDs for a user
   */
  async getActiveIDsForUser(userId: number): Promise<DigitalID[]> {
    return await this.db.getActiveDigitalIDsForUser(userId);
  }

  /**
   * Verify a digital ID by blockchain hash
   */
  async verifyDigitalID(blockchainHash: string): Promise<{
    isValid: boolean;
    digitalId?: DigitalID;
    user?: User;
    reason?: string;
  }> {
    const digitalId = await this.db.getDigitalIDByBlockchainHash(blockchainHash);
    
    if (!digitalId) {
      return {
        isValid: false,
        reason: 'Digital ID not found'
      };
    }

    // Check if ID is active
    if (digitalId.status !== DigitalIDStatus.ACTIVE) {
      return {
        isValid: false,
        digitalId,
        reason: `Digital ID is ${digitalId.status.toLowerCase()}`
      };
    }

    // Check if ID is still valid (not expired)
    const now = new Date();
    if (now > digitalId.valid_until) {
      // Mark as expired
      await this.db.expireDigitalID(digitalId.id);
      return {
        isValid: false,
        digitalId,
        reason: 'Digital ID has expired'
      };
    }

    // Get user data
    const user = await this.db.getUserById(digitalId.user_id);
    if (!user || user.verification_status !== VerificationStatus.VERIFIED) {
      return {
        isValid: false,
        digitalId,
        user: user || undefined,
        reason: 'User verification status invalid'
      };
    }

    return {
      isValid: true,
      digitalId,
      user
    };
  }

  /**
   * Revoke a digital ID
   */
  async revokeDigitalID(digitalIdId: number): Promise<DigitalID> {
    return await this.db.revokeDigitalID(digitalIdId);
  }

  /**
   * Get digital ID with user data for display
   */
  async getDigitalIDForDisplay(blockchainHash: string): Promise<{
    digitalId: DigitalID;
    user: User;
    userProfile?: UserProfile;
  } | null> {
    const digitalId = await this.db.getDigitalIDByBlockchainHash(blockchainHash);
    if (!digitalId) return null;

    const user = await this.db.getUserById(digitalId.user_id);
    if (!user) return null;

    const userProfile = await this.db.getUserProfile(digitalId.user_id);

    return {
      digitalId,
      user,
      userProfile: userProfile || undefined
    };
  }
}

// Export a factory function to create all models with shared database connection
export function createModels(): {
  userModel: UserModel;
  userProfileModel: UserProfileModel;
  digitalIDModel: DigitalIDModel;
  dbManager: PrismaDatabaseManager;
} {
  const dbManager = new PrismaDatabaseManager();
  
  return {
    userModel: new UserModel(dbManager),
    userProfileModel: new UserProfileModel(dbManager),
    digitalIDModel: new DigitalIDModel(dbManager),
    dbManager
  };
}

// Re-export types and database manager
export * from './types';
export { PrismaDatabaseManager } from './prisma-manager';
export { DatabaseMigrations } from './migrations';
