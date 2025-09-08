// Prisma-based database manager implementation
import { PrismaClient, $Enums } from '../generated/prisma';
import { DatabaseManager } from './manager';
import { 
  User, 
  UserProfile, 
  DigitalID, 
  VerificationStatus, 
  DigitalIDStatus,
  CreateUserData,
  CreateUserProfileData,
  CreateDigitalIDData
} from './types';

export class PrismaDatabaseManager extends DatabaseManager {
  private prisma: PrismaClient;

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  // Public getter for test utilities
  get client(): PrismaClient {
    return this.prisma;
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async cleanTestData(): Promise<void> {
    try {
      // Clean up test data in correct dependency order to respect foreign key constraints
      // Start with the most dependent tables first (leaf nodes in dependency graph)
      
      // 1. Location access logs (depends on location_sharing_settings)
      await this.prisma.locationAccessLog.deleteMany({});
      
      // 2. Emergency location requests (depends on user)
      await this.prisma.emergencyLocationRequest.deleteMany({});
      
      // 3. Location history entries (depends on user)
      await this.prisma.locationHistoryEntry.deleteMany({});
      
      // 4. Geofence breaches (depends on user and geofence_area)
      await this.prisma.geofenceBreach.deleteMany({});
      
      // 5. Geofence areas (depends on user)
      await this.prisma.geofenceArea.deleteMany({});
      
      // 6. Location privacy settings (depends on user)
      await this.prisma.locationPrivacySettings.deleteMany({});
      
      // 7. Location sharing settings (depends on user)
      await this.prisma.locationSharingSettings.deleteMany({});
      
      // 7. Digital IDs (depends on user)
      await this.prisma.digitalID.deleteMany({});
      
      // 8. User profiles (depends on user)
      await this.prisma.userProfile.deleteMany({});
      
      // 9. Users (root table - delete last)
      await this.prisma.user.deleteMany({});
      
    } catch (error) {
      console.error('Error during cleanTestData:', error);
      // If normal cleanup fails, try with raw SQL to disable foreign key checks temporarily
      await this.forceCleanTestData();
    }
  }

  private async forceCleanTestData(): Promise<void> {
    try {
      // For SQLite, we can't disable foreign key checks mid-transaction
      // So we'll use a transaction to delete everything in the correct order
      await this.prisma.$transaction(async (tx) => {
        // Delete in dependency order within transaction
        await tx.locationAccessLog.deleteMany({});
        await tx.emergencyLocationRequest.deleteMany({});
        await tx.locationHistoryEntry.deleteMany({});
        await tx.geofenceBreach.deleteMany({});
        await tx.geofenceArea.deleteMany({});
        await tx.locationPrivacySettings.deleteMany({});
        await tx.locationSharingSettings.deleteMany({});
        await tx.digitalID.deleteMany({});
        await tx.userProfile.deleteMany({});
        await tx.user.deleteMany({});
      });
    } catch (error) {
      console.error('Force cleanup also failed:', error);
      // Last resort: try to delete each table individually and ignore errors
      await this.safeDeleteAll();
    }
  }

  private async safeDeleteAll(): Promise<void> {
    const tables = [
      'locationAccessLog',
      'emergencyLocationRequest', 
      'locationHistoryEntry',
      'geofenceBreach',
      'geofenceArea',
      'locationPrivacySettings',
      'locationSharingSettings',
      'digitalID',
      'userProfile',
      'user'
    ];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Ignore individual table deletion errors
        console.warn(`Failed to delete from ${table}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // User methods
  async createUser(userData: Partial<CreateUserData>): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: userData.email!,
        name: userData.name!,
        blockchain_address: userData.blockchain_address,
        verification_status: this.mapVerificationStatusToPrisma(userData.verification_status || VerificationStatus.PENDING)
      }
    });

    return this.mapPrismaUserToUser(user);
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async getUserByBlockchainAddress(address: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { blockchain_address: address }
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async updateUserVerificationStatus(id: number, status: VerificationStatus): Promise<User> {
    // First check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { verification_status: this.mapVerificationStatusToPrisma(status) }
    });

    return this.mapPrismaUserToUser(user);
  }

  // UserProfile methods
  async createUserProfile(profileData: Partial<CreateUserProfileData>): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.create({
      data: {
        user_id: profileData.user_id!,
        kyc_data: JSON.stringify(profileData.kyc_data || {}),
        emergency_contacts: JSON.stringify(profileData.emergency_contacts || [])
      }
    });

    return this.mapPrismaUserProfileToUserProfile(profile);
  }

  async getUserProfile(userId: number): Promise<UserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { user_id: userId }
    });

    return profile ? this.mapPrismaUserProfileToUserProfile(profile) : null;
  }

  async getUserProfileWithUser(userId: number): Promise<UserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
      include: { user: true }
    });

    if (!profile) return null;

    const mappedProfile = this.mapPrismaUserProfileToUserProfile(profile);
    mappedProfile.user = this.mapPrismaUserToUser(profile.user);
    
    return mappedProfile;
  }

  async updateUserProfile(userId: number, profileData: Partial<CreateUserProfileData>): Promise<UserProfile> {
    const updateData: any = {};
    
    if (profileData.kyc_data) {
      updateData.kyc_data = JSON.stringify(profileData.kyc_data);
    }
    
    if (profileData.emergency_contacts) {
      updateData.emergency_contacts = JSON.stringify(profileData.emergency_contacts);
    }

    const profile = await this.prisma.userProfile.update({
      where: { user_id: userId },
      data: updateData
    });

    return this.mapPrismaUserProfileToUserProfile(profile);
  }

  // DigitalID methods
  async createDigitalID(digitalIdData: Partial<CreateDigitalIDData>): Promise<DigitalID> {
    const digitalId = await this.prisma.digitalID.create({
      data: {
        user_id: digitalIdData.user_id!,
        blockchain_hash: digitalIdData.blockchain_hash!,
        qr_code_data: digitalIdData.qr_code_data!,
        valid_from: digitalIdData.valid_from!,
        valid_until: digitalIdData.valid_until!,
        status: this.mapDigitalIDStatusToPrisma(digitalIdData.status || DigitalIDStatus.ACTIVE)
      }
    });

    return this.mapPrismaDigitalIDToDigitalID(digitalId);
  }

  async getDigitalID(id: number): Promise<DigitalID | null> {
    const digitalId = await this.prisma.digitalID.findUnique({
      where: { id }
    });

    return digitalId ? this.mapPrismaDigitalIDToDigitalID(digitalId) : null;
  }

  async getDigitalIDByBlockchainHash(hash: string): Promise<DigitalID | null> {
    const digitalId = await this.prisma.digitalID.findUnique({
      where: { blockchain_hash: hash }
    });

    return digitalId ? this.mapPrismaDigitalIDToDigitalID(digitalId) : null;
  }

  async getActiveDigitalIDsForUser(userId: number): Promise<DigitalID[]> {
    const digitalIds = await this.prisma.digitalID.findMany({
      where: {
        user_id: userId,
        status: $Enums.DigitalIDStatus.ACTIVE,
        valid_until: {
          gte: new Date()
        }
      }
    });

    return digitalIds.map(id => this.mapPrismaDigitalIDToDigitalID(id));
  }

  async revokeDigitalID(id: number): Promise<DigitalID> {
    const digitalId = await this.prisma.digitalID.update({
      where: { id },
      data: { status: $Enums.DigitalIDStatus.REVOKED }
    });

    return this.mapPrismaDigitalIDToDigitalID(digitalId);
  }

  async expireDigitalID(id: number): Promise<DigitalID> {
    const digitalId = await this.prisma.digitalID.update({
      where: { id },
      data: { status: $Enums.DigitalIDStatus.EXPIRED }
    });

    return this.mapPrismaDigitalIDToDigitalID(digitalId);
  }

  // Helper methods to map Prisma types to our domain types
  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      blockchain_address: prismaUser.blockchain_address,
      verification_status: this.mapPrismaVerificationStatusToEnum(prismaUser.verification_status),
      created_at: prismaUser.created_at,
      updated_at: prismaUser.updated_at
    };
  }

  private mapPrismaUserProfileToUserProfile(prismaProfile: any): UserProfile {
    return {
      id: prismaProfile.id,
      user_id: prismaProfile.user_id,
      kyc_data: JSON.parse(prismaProfile.kyc_data || '{}'),
      emergency_contacts: JSON.parse(prismaProfile.emergency_contacts || '[]'),
      created_at: prismaProfile.created_at,
      updated_at: prismaProfile.updated_at
    };
  }

  private mapPrismaDigitalIDToDigitalID(prismaDigitalId: any): DigitalID {
    return {
      id: prismaDigitalId.id,
      user_id: prismaDigitalId.user_id,
      blockchain_hash: prismaDigitalId.blockchain_hash,
      qr_code_data: prismaDigitalId.qr_code_data,
      valid_from: prismaDigitalId.valid_from,
      valid_until: prismaDigitalId.valid_until,
      status: this.mapPrismaDigitalIDStatusToEnum(prismaDigitalId.status),
      created_at: prismaDigitalId.created_at
    };
  }

  // Enum mapping helpers
  private mapVerificationStatusToPrisma(status: VerificationStatus): $Enums.VerificationStatus {
    switch (status) {
      case VerificationStatus.PENDING:
        return $Enums.VerificationStatus.PENDING;
      case VerificationStatus.VERIFIED:
        return $Enums.VerificationStatus.VERIFIED;
      case VerificationStatus.EXPIRED:
        return $Enums.VerificationStatus.EXPIRED;
      case VerificationStatus.REVOKED:
        return $Enums.VerificationStatus.REVOKED;
      default:
        return $Enums.VerificationStatus.PENDING;
    }
  }

  private mapPrismaVerificationStatusToEnum(status: $Enums.VerificationStatus): VerificationStatus {
    switch (status) {
      case $Enums.VerificationStatus.PENDING:
        return VerificationStatus.PENDING;
      case $Enums.VerificationStatus.VERIFIED:
        return VerificationStatus.VERIFIED;
      case $Enums.VerificationStatus.EXPIRED:
        return VerificationStatus.EXPIRED;
      case $Enums.VerificationStatus.REVOKED:
        return VerificationStatus.REVOKED;
      default:
        return VerificationStatus.PENDING;
    }
  }

  private mapDigitalIDStatusToPrisma(status: DigitalIDStatus): $Enums.DigitalIDStatus {
    switch (status) {
      case DigitalIDStatus.ACTIVE:
        return $Enums.DigitalIDStatus.ACTIVE;
      case DigitalIDStatus.EXPIRED:
        return $Enums.DigitalIDStatus.EXPIRED;
      case DigitalIDStatus.REVOKED:
        return $Enums.DigitalIDStatus.REVOKED;
      default:
        return $Enums.DigitalIDStatus.ACTIVE;
    }
  }

  private mapPrismaDigitalIDStatusToEnum(status: $Enums.DigitalIDStatus): DigitalIDStatus {
    switch (status) {
      case $Enums.DigitalIDStatus.ACTIVE:
        return DigitalIDStatus.ACTIVE;
      case $Enums.DigitalIDStatus.EXPIRED:
        return DigitalIDStatus.EXPIRED;
      case $Enums.DigitalIDStatus.REVOKED:
        return DigitalIDStatus.REVOKED;
      default:
        return DigitalIDStatus.ACTIVE;
    }
  }
}
