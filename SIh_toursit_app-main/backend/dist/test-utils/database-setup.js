"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDb = exports.TestDatabaseSetup = void 0;
const prisma_manager_1 = require("../database/prisma-manager");
const index_1 = require("../database/index");
const types_1 = require("../database/types");
class TestDatabaseSetup {
    constructor() {
        this.testUsers = [];
        this.dbManager = new prisma_manager_1.PrismaDatabaseManager();
        this.userModel = new index_1.UserModel(this.dbManager);
        this.userProfileModel = new index_1.UserProfileModel(this.dbManager);
        this.digitalIDModel = new index_1.DigitalIDModel(this.dbManager);
    }
    async setup() {
        try {
            await this.dbManager.connect();
            await this.forceCleanup();
            console.log('Test database connected');
        }
        catch (error) {
            console.error('Failed to connect to test database:', error);
            throw error;
        }
    }
    async createTestUser(userData) {
        try {
            const user = await this.userModel.createUser(userData);
            this.testUsers.push(user.id);
            return user;
        }
        catch (error) {
            console.error('Failed to create test user:', error);
            throw error;
        }
    }
    async cleanup() {
        try {
            await this.dbManager.cleanTestData();
            this.testUsers = [];
            console.log('Test database cleaned up');
        }
        catch (error) {
            console.error('Failed to clean up test database:', error);
            await this.forceCleanup();
        }
    }
    async forceCleanup() {
        try {
            await this.dbManager.cleanTestData();
            this.testUsers = [];
        }
        catch (error) {
            console.warn('Primary cleanup failed, attempting fallback methods');
            try {
                for (const userId of this.testUsers) {
                    await this.cleanupUserAndDependencies(userId);
                }
                this.testUsers = [];
            }
            catch (cleanupError) {
                console.warn('Manual user cleanup failed, using raw cleanup');
                await this.rawCleanup();
            }
        }
    }
    async cleanupUserAndDependencies(userId) {
        try {
            const prisma = this.dbManager.client;
            await prisma.locationAccessLog.deleteMany({});
            await prisma.locationSharingSettings.deleteMany({
                where: { user_id: userId }
            });
            await prisma.digitalID.deleteMany({
                where: { user_id: userId }
            });
            await prisma.userProfile.deleteMany({
                where: { user_id: userId }
            });
            await prisma.user.delete({
                where: { id: userId }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rawCleanup() {
        try {
            const prisma = this.dbManager.client;
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
                }
                catch (error) {
                    console.warn(`Raw cleanup failed for table ${table}:`, error instanceof Error ? error.message : String(error));
                }
            }
            this.testUsers = [];
        }
        catch (error) {
            console.error('Raw cleanup failed:', error);
        }
    }
    async teardown() {
        try {
            await this.forceCleanup();
            await this.dbManager.disconnect();
            console.log('Test database disconnected');
        }
        catch (error) {
            console.error('Failed to teardown test database:', error);
        }
    }
    async resetForTest() {
        await this.cleanup();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    async createVerifiedUser(overrides = {}) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const uniqueId = `${timestamp}-${random}`;
        const userData = {
            email: overrides.email || `test-${uniqueId}@example.com`,
            name: overrides.name || `Test User ${uniqueId}`,
            blockchain_address: overrides.blockchain_address || `0x${uniqueId.replace('-', '')}${'0'.repeat(32)}`.substring(0, 42),
            verification_status: types_1.VerificationStatus.VERIFIED
        };
        return await this.dbManager.createUser(userData);
    }
    async createTestUserProfile(userId, profileData = {}) {
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
    async createTestDigitalID(userId, overrides = {}) {
        const timestamp = Date.now();
        const blockchainHash = overrides.blockchainHash || `0x${(timestamp + 1000).toString(16).padStart(64, '0')}`;
        const qrCodeData = overrides.qrCodeData || {
            user_id: userId,
            timestamp
        };
        return await this.digitalIDModel.generateDigitalID(userId, blockchainHash, qrCodeData);
    }
}
exports.TestDatabaseSetup = TestDatabaseSetup;
exports.testDb = new TestDatabaseSetup();
