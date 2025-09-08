import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaDatabaseManager } from './prisma-manager';
import { UserProfile, DigitalID, User, VerificationStatus, DigitalIDStatus } from './types';

describe('Database Models', () => {
  let dbManager: PrismaDatabaseManager;

  beforeEach(async () => {
    dbManager = new PrismaDatabaseManager();
    await dbManager.connect();
    // Clean up test data
    await dbManager.cleanTestData();
  });

  afterEach(async () => {
    await dbManager.cleanTestData();
    await dbManager.disconnect();
  });

  describe('User Model', () => {
    it('should create a user with blockchain fields', async () => {
      const userData: Partial<User> = {
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.PENDING
      };

      const user = await dbManager.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.blockchain_address).toBe(userData.blockchain_address);
      expect(user.verification_status).toBe(VerificationStatus.PENDING);
      expect(user.created_at).toBeDefined();
    });

    it('should enforce unique blockchain addresses', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      
      await dbManager.createUser({
        email: 'user1@example.com',
        name: 'User 1',
        blockchain_address: address,
        verification_status: VerificationStatus.PENDING
      });

      await expect(
        dbManager.createUser({
          email: 'user2@example.com',
          name: 'User 2',
          blockchain_address: address,
          verification_status: VerificationStatus.PENDING
        })
      ).rejects.toThrow();
    });

    it('should update verification status', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.PENDING
      });

      const updatedUser = await dbManager.updateUserVerificationStatus(
        user.id,
        VerificationStatus.VERIFIED
      );

      expect(updatedUser.verification_status).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe('UserProfile Model', () => {
    it('should create a user profile linked to a user', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.PENDING
      });

      const profileData: Partial<UserProfile> = {
        user_id: user.id,
        kyc_data: {
          document_type: 'passport',
          document_number: 'P123456789',
          issued_country: 'US',
          expiry_date: '2030-12-31'
        },
        emergency_contacts: [
          {
            name: 'Emergency Contact',
            phone: '+1234567890',
            relationship: 'family'
          }
        ]
      };

      const profile = await dbManager.createUserProfile(profileData);

      expect(profile).toBeDefined();
      expect(profile.user_id).toBe(user.id);
      expect(profile.kyc_data).toEqual(profileData.kyc_data);
      expect(profile.emergency_contacts).toEqual(profileData.emergency_contacts);
      expect(profile.created_at).toBeDefined();
    });

    it('should retrieve user profile with user data', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.PENDING
      });

      await dbManager.createUserProfile({
        user_id: user.id,
        kyc_data: { document_type: 'passport' },
        emergency_contacts: []
      });

      const profileWithUser = await dbManager.getUserProfileWithUser(user.id);

      expect(profileWithUser).toBeDefined();
      expect(profileWithUser!.user_id).toBe(user.id);
      expect(profileWithUser!.user).toBeDefined();
      expect(profileWithUser!.user!.email).toBe(user.email);
    });
  });

  describe('DigitalID Model', () => {
    it('should create a digital ID for a user', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.VERIFIED
      });

      const digitalIdData: Partial<DigitalID> = {
        user_id: user.id,
        blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        qr_code_data: JSON.stringify({
          user_id: user.id,
          blockchain_address: user.blockchain_address,
          verification_hash: 'test-hash'
        }),
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: DigitalIDStatus.ACTIVE
      };

      const digitalId = await dbManager.createDigitalID(digitalIdData);

      expect(digitalId).toBeDefined();
      expect(digitalId.user_id).toBe(user.id);
      expect(digitalId.blockchain_hash).toBe(digitalIdData.blockchain_hash);
      expect(digitalId.status).toBe(DigitalIDStatus.ACTIVE);
      expect(digitalId.valid_from).toBeDefined();
      expect(digitalId.valid_until).toBeDefined();
    });

    it('should find active digital IDs for a user', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.VERIFIED
      });

      // Create active digital ID
      await dbManager.createDigitalID({
        user_id: user.id,
        blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        qr_code_data: '{"test": "data"}',
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: DigitalIDStatus.ACTIVE
      });

      // Create expired digital ID
      await dbManager.createDigitalID({
        user_id: user.id,
        blockchain_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        qr_code_data: '{"test": "expired"}',
        valid_from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        valid_until: new Date(Date.now() - 1),
        status: DigitalIDStatus.EXPIRED
      });

      const activeIds = await dbManager.getActiveDigitalIDsForUser(user.id);

      expect(activeIds).toHaveLength(1);
      expect(activeIds[0].status).toBe(DigitalIDStatus.ACTIVE);
    });

    it('should revoke a digital ID', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.VERIFIED
      });

      const digitalId = await dbManager.createDigitalID({
        user_id: user.id,
        blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        qr_code_data: '{"test": "data"}',
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: DigitalIDStatus.ACTIVE
      });

      const revokedId = await dbManager.revokeDigitalID(digitalId.id);

      expect(revokedId.status).toBe(DigitalIDStatus.REVOKED);
    });
  });

  describe('Database Integration', () => {
    it('should find user by blockchain address', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      
      await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: address,
        verification_status: VerificationStatus.VERIFIED
      });

      const foundUser = await dbManager.getUserByBlockchainAddress(address);

      expect(foundUser).toBeDefined();
      expect(foundUser!.blockchain_address).toBe(address);
    });

    it('should get digital ID by blockchain hash', async () => {
      const user = await dbManager.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890',
        verification_status: VerificationStatus.VERIFIED
      });

      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      
      await dbManager.createDigitalID({
        user_id: user.id,
        blockchain_hash: hash,
        qr_code_data: '{"test": "data"}',
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: DigitalIDStatus.ACTIVE
      });

      const foundId = await dbManager.getDigitalIDByBlockchainHash(hash);

      expect(foundId).toBeDefined();
      expect(foundId!.blockchain_hash).toBe(hash);
    });
  });
});
