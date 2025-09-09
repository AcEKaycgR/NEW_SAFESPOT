"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const prisma_manager_1 = require("./prisma-manager");
const types_1 = require("./types");
(0, globals_1.describe)('Database Models', () => {
    let dbManager;
    (0, globals_1.beforeEach)(async () => {
        dbManager = new prisma_manager_1.PrismaDatabaseManager();
        await dbManager.connect();
        await dbManager.cleanTestData();
    });
    (0, globals_1.afterEach)(async () => {
        await dbManager.cleanTestData();
        await dbManager.disconnect();
    });
    (0, globals_1.describe)('User Model', () => {
        (0, globals_1.it)('should create a user with blockchain fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.PENDING
            };
            const user = await dbManager.createUser(userData);
            (0, globals_1.expect)(user).toBeDefined();
            (0, globals_1.expect)(user.email).toBe(userData.email);
            (0, globals_1.expect)(user.name).toBe(userData.name);
            (0, globals_1.expect)(user.blockchain_address).toBe(userData.blockchain_address);
            (0, globals_1.expect)(user.verification_status).toBe(types_1.VerificationStatus.PENDING);
            (0, globals_1.expect)(user.created_at).toBeDefined();
        });
        (0, globals_1.it)('should enforce unique blockchain addresses', async () => {
            const address = '0x1234567890123456789012345678901234567890';
            await dbManager.createUser({
                email: 'user1@example.com',
                name: 'User 1',
                blockchain_address: address,
                verification_status: types_1.VerificationStatus.PENDING
            });
            await (0, globals_1.expect)(dbManager.createUser({
                email: 'user2@example.com',
                name: 'User 2',
                blockchain_address: address,
                verification_status: types_1.VerificationStatus.PENDING
            })).rejects.toThrow();
        });
        (0, globals_1.it)('should update verification status', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.PENDING
            });
            const updatedUser = await dbManager.updateUserVerificationStatus(user.id, types_1.VerificationStatus.VERIFIED);
            (0, globals_1.expect)(updatedUser.verification_status).toBe(types_1.VerificationStatus.VERIFIED);
        });
    });
    (0, globals_1.describe)('UserProfile Model', () => {
        (0, globals_1.it)('should create a user profile linked to a user', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.PENDING
            });
            const profileData = {
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
            (0, globals_1.expect)(profile).toBeDefined();
            (0, globals_1.expect)(profile.user_id).toBe(user.id);
            (0, globals_1.expect)(profile.kyc_data).toEqual(profileData.kyc_data);
            (0, globals_1.expect)(profile.emergency_contacts).toEqual(profileData.emergency_contacts);
            (0, globals_1.expect)(profile.created_at).toBeDefined();
        });
        (0, globals_1.it)('should retrieve user profile with user data', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.PENDING
            });
            await dbManager.createUserProfile({
                user_id: user.id,
                kyc_data: { document_type: 'passport' },
                emergency_contacts: []
            });
            const profileWithUser = await dbManager.getUserProfileWithUser(user.id);
            (0, globals_1.expect)(profileWithUser).toBeDefined();
            (0, globals_1.expect)(profileWithUser.user_id).toBe(user.id);
            (0, globals_1.expect)(profileWithUser.user).toBeDefined();
            (0, globals_1.expect)(profileWithUser.user.email).toBe(user.email);
        });
    });
    (0, globals_1.describe)('DigitalID Model', () => {
        (0, globals_1.it)('should create a digital ID for a user', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.VERIFIED
            });
            const digitalIdData = {
                user_id: user.id,
                blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                qr_code_data: JSON.stringify({
                    user_id: user.id,
                    blockchain_address: user.blockchain_address,
                    verification_hash: 'test-hash'
                }),
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: types_1.DigitalIDStatus.ACTIVE
            };
            const digitalId = await dbManager.createDigitalID(digitalIdData);
            (0, globals_1.expect)(digitalId).toBeDefined();
            (0, globals_1.expect)(digitalId.user_id).toBe(user.id);
            (0, globals_1.expect)(digitalId.blockchain_hash).toBe(digitalIdData.blockchain_hash);
            (0, globals_1.expect)(digitalId.status).toBe(types_1.DigitalIDStatus.ACTIVE);
            (0, globals_1.expect)(digitalId.valid_from).toBeDefined();
            (0, globals_1.expect)(digitalId.valid_until).toBeDefined();
        });
        (0, globals_1.it)('should find active digital IDs for a user', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.VERIFIED
            });
            await dbManager.createDigitalID({
                user_id: user.id,
                blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                qr_code_data: '{"test": "data"}',
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: types_1.DigitalIDStatus.ACTIVE
            });
            await dbManager.createDigitalID({
                user_id: user.id,
                blockchain_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
                qr_code_data: '{"test": "expired"}',
                valid_from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                valid_until: new Date(Date.now() - 1),
                status: types_1.DigitalIDStatus.EXPIRED
            });
            const activeIds = await dbManager.getActiveDigitalIDsForUser(user.id);
            (0, globals_1.expect)(activeIds).toHaveLength(1);
            (0, globals_1.expect)(activeIds[0].status).toBe(types_1.DigitalIDStatus.ACTIVE);
        });
        (0, globals_1.it)('should revoke a digital ID', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.VERIFIED
            });
            const digitalId = await dbManager.createDigitalID({
                user_id: user.id,
                blockchain_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                qr_code_data: '{"test": "data"}',
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: types_1.DigitalIDStatus.ACTIVE
            });
            const revokedId = await dbManager.revokeDigitalID(digitalId.id);
            (0, globals_1.expect)(revokedId.status).toBe(types_1.DigitalIDStatus.REVOKED);
        });
    });
    (0, globals_1.describe)('Database Integration', () => {
        (0, globals_1.it)('should find user by blockchain address', async () => {
            const address = '0x1234567890123456789012345678901234567890';
            await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: address,
                verification_status: types_1.VerificationStatus.VERIFIED
            });
            const foundUser = await dbManager.getUserByBlockchainAddress(address);
            (0, globals_1.expect)(foundUser).toBeDefined();
            (0, globals_1.expect)(foundUser.blockchain_address).toBe(address);
        });
        (0, globals_1.it)('should get digital ID by blockchain hash', async () => {
            const user = await dbManager.createUser({
                email: 'test@example.com',
                name: 'Test User',
                blockchain_address: '0x1234567890123456789012345678901234567890',
                verification_status: types_1.VerificationStatus.VERIFIED
            });
            const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            await dbManager.createDigitalID({
                user_id: user.id,
                blockchain_hash: hash,
                qr_code_data: '{"test": "data"}',
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: types_1.DigitalIDStatus.ACTIVE
            });
            const foundId = await dbManager.getDigitalIDByBlockchainHash(hash);
            (0, globals_1.expect)(foundId).toBeDefined();
            (0, globals_1.expect)(foundId.blockchain_hash).toBe(hash);
        });
    });
});
