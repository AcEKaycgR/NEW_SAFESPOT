"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDatabaseManager = void 0;
const prisma_1 = require("../generated/prisma");
const manager_1 = require("./manager");
const types_1 = require("./types");
class PrismaDatabaseManager extends manager_1.DatabaseManager {
    constructor() {
        super();
        this.prisma = new prisma_1.PrismaClient();
    }
    get client() {
        return this.prisma;
    }
    async connect() {
        await this.prisma.$connect();
    }
    async disconnect() {
        await this.prisma.$disconnect();
    }
    async cleanTestData() {
        try {
            await this.prisma.locationAccessLog.deleteMany({});
            await this.prisma.emergencyLocationRequest.deleteMany({});
            await this.prisma.locationHistoryEntry.deleteMany({});
            await this.prisma.geofenceBreach.deleteMany({});
            await this.prisma.geofenceArea.deleteMany({});
            await this.prisma.locationPrivacySettings.deleteMany({});
            await this.prisma.locationSharingSettings.deleteMany({});
            await this.prisma.digitalID.deleteMany({});
            await this.prisma.userProfile.deleteMany({});
            await this.prisma.user.deleteMany({});
        }
        catch (error) {
            console.error('Error during cleanTestData:', error);
            await this.forceCleanTestData();
        }
    }
    async forceCleanTestData() {
        try {
            await this.prisma.$transaction(async (tx) => {
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
        }
        catch (error) {
            console.error('Force cleanup also failed:', error);
            await this.safeDeleteAll();
        }
    }
    async safeDeleteAll() {
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
                await this.prisma[table].deleteMany({});
            }
            catch (error) {
                console.warn(`Failed to delete from ${table}:`, error instanceof Error ? error.message : String(error));
            }
        }
    }
    async createUser(userData) {
        const user = await this.prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                blockchain_address: userData.blockchain_address,
                verification_status: this.mapVerificationStatusToPrisma(userData.verification_status || types_1.VerificationStatus.PENDING)
            }
        });
        return this.mapPrismaUserToUser(user);
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });
        return user ? this.mapPrismaUserToUser(user) : null;
    }
    async getUserByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email }
        });
        return user ? this.mapPrismaUserToUser(user) : null;
    }
    async getUserByBlockchainAddress(address) {
        const user = await this.prisma.user.findUnique({
            where: { blockchain_address: address }
        });
        return user ? this.mapPrismaUserToUser(user) : null;
    }
    async updateUserVerificationStatus(id, status) {
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
    async createUserProfile(profileData) {
        const profile = await this.prisma.userProfile.create({
            data: {
                user_id: profileData.user_id,
                kyc_data: JSON.stringify(profileData.kyc_data || {}),
                emergency_contacts: JSON.stringify(profileData.emergency_contacts || [])
            }
        });
        return this.mapPrismaUserProfileToUserProfile(profile);
    }
    async getUserProfile(userId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { user_id: userId }
        });
        return profile ? this.mapPrismaUserProfileToUserProfile(profile) : null;
    }
    async getUserProfileWithUser(userId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { user_id: userId },
            include: { user: true }
        });
        if (!profile)
            return null;
        const mappedProfile = this.mapPrismaUserProfileToUserProfile(profile);
        mappedProfile.user = this.mapPrismaUserToUser(profile.user);
        return mappedProfile;
    }
    async updateUserProfile(userId, profileData) {
        const updateData = {};
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
    async createDigitalID(digitalIdData) {
        const digitalId = await this.prisma.digitalID.create({
            data: {
                user_id: digitalIdData.user_id,
                blockchain_hash: digitalIdData.blockchain_hash,
                qr_code_data: digitalIdData.qr_code_data,
                valid_from: digitalIdData.valid_from,
                valid_until: digitalIdData.valid_until,
                status: this.mapDigitalIDStatusToPrisma(digitalIdData.status || types_1.DigitalIDStatus.ACTIVE)
            }
        });
        return this.mapPrismaDigitalIDToDigitalID(digitalId);
    }
    async getDigitalID(id) {
        const digitalId = await this.prisma.digitalID.findUnique({
            where: { id }
        });
        return digitalId ? this.mapPrismaDigitalIDToDigitalID(digitalId) : null;
    }
    async getDigitalIDByBlockchainHash(hash) {
        const digitalId = await this.prisma.digitalID.findUnique({
            where: { blockchain_hash: hash }
        });
        return digitalId ? this.mapPrismaDigitalIDToDigitalID(digitalId) : null;
    }
    async getActiveDigitalIDsForUser(userId) {
        const digitalIds = await this.prisma.digitalID.findMany({
            where: {
                user_id: userId,
                status: prisma_1.$Enums.DigitalIDStatus.ACTIVE,
                valid_until: {
                    gte: new Date()
                }
            }
        });
        return digitalIds.map(id => this.mapPrismaDigitalIDToDigitalID(id));
    }
    async revokeDigitalID(id) {
        const digitalId = await this.prisma.digitalID.update({
            where: { id },
            data: { status: prisma_1.$Enums.DigitalIDStatus.REVOKED }
        });
        return this.mapPrismaDigitalIDToDigitalID(digitalId);
    }
    async expireDigitalID(id) {
        const digitalId = await this.prisma.digitalID.update({
            where: { id },
            data: { status: prisma_1.$Enums.DigitalIDStatus.EXPIRED }
        });
        return this.mapPrismaDigitalIDToDigitalID(digitalId);
    }
    mapPrismaUserToUser(prismaUser) {
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
    mapPrismaUserProfileToUserProfile(prismaProfile) {
        return {
            id: prismaProfile.id,
            user_id: prismaProfile.user_id,
            kyc_data: JSON.parse(prismaProfile.kyc_data || '{}'),
            emergency_contacts: JSON.parse(prismaProfile.emergency_contacts || '[]'),
            created_at: prismaProfile.created_at,
            updated_at: prismaProfile.updated_at
        };
    }
    mapPrismaDigitalIDToDigitalID(prismaDigitalId) {
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
    mapVerificationStatusToPrisma(status) {
        switch (status) {
            case types_1.VerificationStatus.PENDING:
                return prisma_1.$Enums.VerificationStatus.PENDING;
            case types_1.VerificationStatus.VERIFIED:
                return prisma_1.$Enums.VerificationStatus.VERIFIED;
            case types_1.VerificationStatus.EXPIRED:
                return prisma_1.$Enums.VerificationStatus.EXPIRED;
            case types_1.VerificationStatus.REVOKED:
                return prisma_1.$Enums.VerificationStatus.REVOKED;
            default:
                return prisma_1.$Enums.VerificationStatus.PENDING;
        }
    }
    mapPrismaVerificationStatusToEnum(status) {
        switch (status) {
            case prisma_1.$Enums.VerificationStatus.PENDING:
                return types_1.VerificationStatus.PENDING;
            case prisma_1.$Enums.VerificationStatus.VERIFIED:
                return types_1.VerificationStatus.VERIFIED;
            case prisma_1.$Enums.VerificationStatus.EXPIRED:
                return types_1.VerificationStatus.EXPIRED;
            case prisma_1.$Enums.VerificationStatus.REVOKED:
                return types_1.VerificationStatus.REVOKED;
            default:
                return types_1.VerificationStatus.PENDING;
        }
    }
    mapDigitalIDStatusToPrisma(status) {
        switch (status) {
            case types_1.DigitalIDStatus.ACTIVE:
                return prisma_1.$Enums.DigitalIDStatus.ACTIVE;
            case types_1.DigitalIDStatus.EXPIRED:
                return prisma_1.$Enums.DigitalIDStatus.EXPIRED;
            case types_1.DigitalIDStatus.REVOKED:
                return prisma_1.$Enums.DigitalIDStatus.REVOKED;
            default:
                return prisma_1.$Enums.DigitalIDStatus.ACTIVE;
        }
    }
    mapPrismaDigitalIDStatusToEnum(status) {
        switch (status) {
            case prisma_1.$Enums.DigitalIDStatus.ACTIVE:
                return types_1.DigitalIDStatus.ACTIVE;
            case prisma_1.$Enums.DigitalIDStatus.EXPIRED:
                return types_1.DigitalIDStatus.EXPIRED;
            case prisma_1.$Enums.DigitalIDStatus.REVOKED:
                return types_1.DigitalIDStatus.REVOKED;
            default:
                return types_1.DigitalIDStatus.ACTIVE;
        }
    }
}
exports.PrismaDatabaseManager = PrismaDatabaseManager;
