import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserModel, UserProfileModel, DigitalIDModel, createModels, VerificationStatus, DigitalIDStatus } from './index';
import { TestDatabaseSetup } from '../test-utils/database-setup';

describe('Database Models Integration', () => {
  let testDb: TestDatabaseSetup;

  beforeEach(async () => {
    testDb = new TestDatabaseSetup();
    await testDb.setup();
    await testDb.resetForTest();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe('User Model Integration', () => {
    it('should create and register user with blockchain', async () => {
      const timestamp = Date.now();
      
      // Create user with unique address
      const user = await testDb.userModel.createUser({
        email: `test-${timestamp}@example.com`,
        name: 'Test User',
        blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
      });

      expect(user.verification_status).toBe(VerificationStatus.PENDING);

      // Register with blockchain
      const verifiedUser = await testDb.userModel.registerUserWithBlockchain(
        user.id,
        user.blockchain_address!
      );

      expect(verifiedUser.verification_status).toBe(VerificationStatus.VERIFIED);
    });

    it('should find user by blockchain address', async () => {
      const timestamp = Date.now();
      const address = `0x${(timestamp + 1000).toString(16).padStart(40, '0')}`;
      
      await testDb.userModel.createUser({
        email: `find-test-${timestamp}@example.com`,
        name: 'Test User',
        blockchain_address: address
      });

      const foundUser = await testDb.userModel.getUserByBlockchainAddress(address);

      expect(foundUser).toBeDefined();
      expect(foundUser!.blockchain_address).toBe(address);
    });
  });

  describe('UserProfile Model Integration', () => {
    it('should create complete user profile', async () => {
      // Create user first
      const user = await testDb.userModel.createUser({
        email: 'test@example.com',
        name: 'Test User'
      });

      // Create profile
      const profile = await testDb.userProfileModel.createProfile(user.id, {
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
        ]
      });

      expect(profile.user_id).toBe(user.id);
      expect(profile.kyc_data.document_type).toBe('passport');
      expect(profile.emergency_contacts).toHaveLength(1);

      // Get complete profile
      const completeProfile = await testDb.userProfileModel.getCompleteProfile(user.id);

      expect(completeProfile).toBeDefined();
      expect(completeProfile!.user_id).toBe(user.id);
      expect(completeProfile!.user).toBeDefined();
      expect(completeProfile!.user!.email).toBe(user.email);
    });

    it('should update KYC data', async () => {
      const user = await testDb.userModel.createUser({
        email: 'test@example.com',
        name: 'Test User'
      });

      await testDb.userProfileModel.createProfile(user.id, {
        kyc_data: { document_type: 'passport' },
        emergency_contacts: []
      });

      const updatedProfile = await testDb.userProfileModel.updateKYCData(user.id, {
        document_type: 'driver_license',
        document_number: 'DL123456'
      });

      expect(updatedProfile.kyc_data.document_type).toBe('driver_license');
      expect(updatedProfile.kyc_data.document_number).toBe('DL123456');
    });
  });

  describe('DigitalID Model Integration', () => {
    it('should generate digital ID for verified user', async () => {
      // Create and verify user
      const user = await testDb.userModel.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890'
      });

      await testDb.userModel.verifyUser(user.id);

      // Generate digital ID
      const digitalId = await testDb.digitalIDModel.generateDigitalID(
        user.id,
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        {
          user_id: user.id,
          blockchain_address: user.blockchain_address,
          timestamp: Date.now()
        }
      );

      expect(digitalId.user_id).toBe(user.id);
      expect(digitalId.status).toBe(DigitalIDStatus.ACTIVE);
      expect(digitalId.valid_until > new Date()).toBe(true);
    });

    it('should not generate digital ID for unverified user', async () => {
      const user = await testDb.userModel.createUser({
        email: 'test@example.com',
        name: 'Test User'
      });

      await expect(
        testDb.digitalIDModel.generateDigitalID(
          user.id,
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          { test: 'data' }
        )
      ).rejects.toThrow('User must be verified to generate digital ID');
    });

    it('should verify valid digital ID', async () => {
      // Create and verify user
      const user = await testDb.userModel.createUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890'
      });

      await testDb.userModel.verifyUser(user.id);

      // Generate digital ID
      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });

      // Verify digital ID
      const verification = await testDb.digitalIDModel.verifyDigitalID(hash);

      expect(verification.isValid).toBe(true);
      expect(verification.digitalId).toBeDefined();
      expect(verification.user).toBeDefined();
      expect(verification.user!.id).toBe(user.id);
    });

    it('should detect invalid digital ID', async () => {
      const verification = await testDb.digitalIDModel.verifyDigitalID('0xinvalidhash');

      expect(verification.isValid).toBe(false);
      expect(verification.reason).toBe('Digital ID not found');
    });

    it('should detect revoked digital ID', async () => {
      // Create verified user using the helper method
      const user = await testDb.createVerifiedUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890'
      });

      // Generate digital ID
      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const digitalId = await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });

      // Revoke digital ID
      await testDb.digitalIDModel.revokeDigitalID(digitalId.id);

      // Verify digital ID
      const verification = await testDb.digitalIDModel.verifyDigitalID(hash);

      expect(verification.isValid).toBe(false);
      expect(verification.reason).toBe('Digital ID is revoked');
    });

    it('should get digital ID for display with complete data', async () => {
      // Create verified user using helper method
      const user = await testDb.createVerifiedUser({
        email: 'test@example.com',
        name: 'Test User',
        blockchain_address: '0x1234567890123456789012345678901234567890'
      });

      // Create user profile
      const profile = await testDb.userProfileModel.createProfile(user.id, {
        kyc_data: { document_type: 'passport' },
        emergency_contacts: []
      });

      expect(profile).toBeDefined();

      // Generate digital ID
      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });

      // Get for display
      const displayData = await testDb.digitalIDModel.getDigitalIDForDisplay(hash);

      expect(displayData).toBeDefined();
      expect(displayData!.digitalId).toBeDefined();
      expect(displayData!.user).toBeDefined();
      expect(displayData!.userProfile).toBeDefined();
      expect(displayData!.user.email).toBe(user.email);
    });
  });

  describe('Complete Blockchain Authentication Flow', () => {
    it('should complete full user registration and verification flow', async () => {
      // 1. Create verified user with profile data
      const user = await testDb.createVerifiedUser({
        email: 'tourist@example.com',
        name: 'Tourist User',
        blockchain_address: '0x1234567890123456789012345678901234567890'
      });

      expect(user.verification_status).toBe(VerificationStatus.VERIFIED);

      // 2. Create user profile with KYC
      const profile = await testDb.userProfileModel.createProfile(user.id, {
        kyc_data: {
          document_type: 'passport',
          document_number: 'P123456789',
          issued_country: 'US',
          expiry_date: '2030-12-31'
        },
        emergency_contacts: [
          {
            name: 'John Doe',
            phone: '+1234567890',
            relationship: 'family'
          }
        ]
      });

      // Double-check user is still verified before generating digital ID
      const verifiedUser = await testDb.dbManager.getUserById(user.id);
      expect(verifiedUser).toBeDefined();
      expect(verifiedUser!.verification_status).toBe(VerificationStatus.VERIFIED);

      // 3. Generate digital ID (user is already verified)
      const digitalId = await testDb.digitalIDModel.generateDigitalID(
        user.id,
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        {
          user_id: user.id,
          blockchain_address: user.blockchain_address,
          timestamp: Date.now(),
          profile_hash: 'profile_hash_123'
        }
      );

      expect(digitalId.status).toBe(DigitalIDStatus.ACTIVE);

      // 5. Verify the digital ID works
      const verification = await testDb.digitalIDModel.verifyDigitalID(digitalId.blockchain_hash);
      expect(verification.isValid).toBe(true);
      expect(verification.user!.id).toBe(user.id);

      // 6. Get complete display data
      const displayData = await testDb.digitalIDModel.getDigitalIDForDisplay(digitalId.blockchain_hash);
      expect(displayData!.user.email).toBe('tourist@example.com');
      expect(displayData!.userProfile!.kyc_data.document_type).toBe('passport');
      expect(displayData!.userProfile!.emergency_contacts).toHaveLength(1);

      console.log('✅ Complete blockchain authentication flow test passed');
    });
  });
});
