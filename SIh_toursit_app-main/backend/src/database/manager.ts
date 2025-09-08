// Database manager interface for blockchain authentication
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

export abstract class DatabaseManager {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract cleanTestData(): Promise<void>;

  // User methods
  abstract createUser(userData: Partial<CreateUserData>): Promise<User>;
  abstract getUserById(id: number): Promise<User | null>;
  abstract getUserByEmail(email: string): Promise<User | null>;
  abstract getUserByBlockchainAddress(address: string): Promise<User | null>;
  abstract updateUserVerificationStatus(id: number, status: VerificationStatus): Promise<User>;

  // UserProfile methods
  abstract createUserProfile(profileData: Partial<CreateUserProfileData>): Promise<UserProfile>;
  abstract getUserProfile(userId: number): Promise<UserProfile | null>;
  abstract getUserProfileWithUser(userId: number): Promise<UserProfile | null>;
  abstract updateUserProfile(userId: number, profileData: Partial<CreateUserProfileData>): Promise<UserProfile>;

  // DigitalID methods
  abstract createDigitalID(digitalIdData: Partial<CreateDigitalIDData>): Promise<DigitalID>;
  abstract getDigitalID(id: number): Promise<DigitalID | null>;
  abstract getDigitalIDByBlockchainHash(hash: string): Promise<DigitalID | null>;
  abstract getActiveDigitalIDsForUser(userId: number): Promise<DigitalID[]>;
  abstract revokeDigitalID(id: number): Promise<DigitalID>;
  abstract expireDigitalID(id: number): Promise<DigitalID>;
}
