"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const index_1 = require("./index");
const database_setup_1 = require("../test-utils/database-setup");
(0, globals_1.describe)('Database Models Integration', () => {
    let testDb;
    (0, globals_1.beforeEach)(async () => {
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
        await testDb.resetForTest();
    });
    (0, globals_1.afterEach)(async () => {
        await testDb.teardown();
    });
    (0, globals_1.describe)('User Model Integration', () => {
        (0, globals_1.it)('should create and register user with blockchain', async () => {
            const timestamp = Date.now();
            const user = await testDb.userModel.createUser({
                email: `test-${timestamp}@example.com`,
                name: 'Test User',
                blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
            });
            (0, globals_1.expect)(user.verification_status).toBe(index_1.VerificationStatus.PENDING);
            const verifiedUser = await testDb.userModel.registerUserWithBlockchain(user.id, user.blockchain_address);
            (0, globals_1.expect)(verifiedUser.verification_status).toBe(index_1.VerificationStatus.VERIFIED);
        });
        (0, globals_1.it)('should find user by blockchain address', async () => {
            const timestamp = Date.now();
            const address = `0x${(timestamp + 1000).toString(16).padStart(40, '0')}`;
            await testDb.userModel.createUser({
                email: `find-test-${timestamp}@example.com`,
                name: 'Test User',
                blockchain_address: address
            });
            const foundUser = await testDb.userModel.getUserByBlockchainAddress(address);
            (0, globals_1.expect)(foundUser).toBeDefined();
            (0, globals_1.expect)(foundUser.blockchain_address).toBe(address);
        });
    });
    (0, globals_1.describe)('UserProfile Model Integration', () => {
        (0, globals_1.it)('should create complete user profile', async () => {
            const user = await testDb.userModel.createUser({
                email: 'test@example.com',
                name: 'Test User'
            });
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
            (0, globals_1.expect)(profile.user_id).toBe(user.id);
            (0, globals_1.expect)(profile.kyc_data.document_type).toBe('passport');
            (0, globals_1.expect)(profile.emergency_contacts).toHaveLength(1);
            const completeProfile = await testDb.userProfileModel.getCompleteProfile(user.id);
            (0, globals_1.expect)(completeProfile).toBeDefined();
            (0, globals_1.expect)(completeProfile.user_id).toBe(user.id);
            (0, globals_1.expect)(completeProfile.user).toBeDefined();
            (0, globals_1.expect)(completeProfile.user.email).toBe(user.email);
        });
        (0, globals_1.it)('should update KYC data', async () => {
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
            (0, globals_1.expect)(updatedProfile.kyc_data.document_type).toBe('driver_license');
            (0, globals_1.expect)(updatedProfile.kyc_data.document_number).toBe('DL123456');
        });
    });
    (0, globals_1.describe)('DigitalID Model Integration', () => {
        (0, globals_1.it)('should generate digital ID for verified user', async () => {
            const user = await testDb.userModel.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890'
            });
            await testDb.userModel.verifyUser(user.id);
            const digitalId = await testDb.digitalIDModel.generateDigitalID(user.id, '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', {
                user_id: user.id,
                blockchain_address: user.blockchain_address,
                timestamp: Date.now()
            });
            (0, globals_1.expect)(digitalId.user_id).toBe(user.id);
            (0, globals_1.expect)(digitalId.status).toBe(index_1.DigitalIDStatus.ACTIVE);
            (0, globals_1.expect)(digitalId.valid_until > new Date()).toBe(true);
        });
        (0, globals_1.it)('should not generate digital ID for unverified user', async () => {
            const user = await testDb.userModel.createUser({
                email: 'test@example.com',
                name: 'Test User'
            });
            await (0, globals_1.expect)(testDb.digitalIDModel.generateDigitalID(user.id, '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', { test: 'data' })).rejects.toThrow('User must be verified to generate digital ID');
        });
        (0, globals_1.it)('should verify valid digital ID', async () => {
            const user = await testDb.userModel.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890'
            });
            await testDb.userModel.verifyUser(user.id);
            const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });
            const verification = await testDb.digitalIDModel.verifyDigitalID(hash);
            (0, globals_1.expect)(verification.isValid).toBe(true);
            (0, globals_1.expect)(verification.digitalId).toBeDefined();
            (0, globals_1.expect)(verification.user).toBeDefined();
            (0, globals_1.expect)(verification.user.id).toBe(user.id);
        });
        (0, globals_1.it)('should detect invalid digital ID', async () => {
            const verification = await testDb.digitalIDModel.verifyDigitalID('0xinvalidhash');
            (0, globals_1.expect)(verification.isValid).toBe(false);
            (0, globals_1.expect)(verification.reason).toBe('Digital ID not found');
        });
        (0, globals_1.it)('should detect revoked digital ID', async () => {
            const user = await testDb.createVerifiedUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890'
            });
            const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            const digitalId = await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });
            await testDb.digitalIDModel.revokeDigitalID(digitalId.id);
            const verification = await testDb.digitalIDModel.verifyDigitalID(hash);
            (0, globals_1.expect)(verification.isValid).toBe(false);
            (0, globals_1.expect)(verification.reason).toBe('Digital ID is revoked');
        });
        (0, globals_1.it)('should get digital ID for display with complete data', async () => {
            const user = await testDb.createVerifiedUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890'
            });
            const profile = await testDb.userProfileModel.createProfile(user.id, {
                kyc_data: { document_type: 'passport' },
                emergency_contacts: []
            });
            (0, globals_1.expect)(profile).toBeDefined();
            const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            await testDb.digitalIDModel.generateDigitalID(user.id, hash, { test: 'data' });
            const displayData = await testDb.digitalIDModel.getDigitalIDForDisplay(hash);
            (0, globals_1.expect)(displayData).toBeDefined();
            (0, globals_1.expect)(displayData.digitalId).toBeDefined();
            (0, globals_1.expect)(displayData.user).toBeDefined();
            (0, globals_1.expect)(displayData.userProfile).toBeDefined();
            (0, globals_1.expect)(displayData.user.email).toBe(user.email);
        });
    });
    (0, globals_1.describe)('Complete Blockchain Authentication Flow', () => {
        (0, globals_1.it)('should complete full user registration and verification flow', async () => {
            const user = await testDb.createVerifiedUser({
                email: 'tourist@example.com',
                name: 'Tourist User',
                blockchain_address: '0x1234567890123456789012345678901234567890'
            });
            (0, globals_1.expect)(user.verification_status).toBe(index_1.VerificationStatus.VERIFIED);
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
            const verifiedUser = await testDb.dbManager.getUserById(user.id);
            (0, globals_1.expect)(verifiedUser).toBeDefined();
            (0, globals_1.expect)(verifiedUser.verification_status).toBe(index_1.VerificationStatus.VERIFIED);
            const digitalId = await testDb.digitalIDModel.generateDigitalID(user.id, '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', {
                user_id: user.id,
                blockchain_address: user.blockchain_address,
                timestamp: Date.now(),
                profile_hash: 'profile_hash_123'
            });
            (0, globals_1.expect)(digitalId.status).toBe(index_1.DigitalIDStatus.ACTIVE);
            const verification = await testDb.digitalIDModel.verifyDigitalID(digitalId.blockchain_hash);
            (0, globals_1.expect)(verification.isValid).toBe(true);
            (0, globals_1.expect)(verification.user.id).toBe(user.id);
            const displayData = await testDb.digitalIDModel.getDigitalIDForDisplay(digitalId.blockchain_hash);
            (0, globals_1.expect)(displayData.user.email).toBe('tourist@example.com');
            (0, globals_1.expect)(displayData.userProfile.kyc_data.document_type).toBe('passport');
            (0, globals_1.expect)(displayData.userProfile.emergency_contacts).toHaveLength(1);
            console.log('✅ Complete blockchain authentication flow test passed');
        });
    });
});
