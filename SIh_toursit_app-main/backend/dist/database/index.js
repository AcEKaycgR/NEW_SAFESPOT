"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseMigrations = exports.PrismaDatabaseManager = exports.DigitalIDModel = exports.UserProfileModel = exports.UserModel = void 0;
exports.createModels = createModels;
const prisma_manager_1 = require("./prisma-manager");
const types_1 = require("./types");
class UserModel {
    constructor(dbManager) {
        this.db = dbManager || new prisma_manager_1.PrismaDatabaseManager();
    }
    async initialize() {
        await this.db.connect();
    }
    async close() {
        await this.db.disconnect();
    }
    async createUser(userData) {
        return await this.db.createUser({
            ...userData,
            verification_status: types_1.VerificationStatus.PENDING
        });
    }
    async registerUserWithBlockchain(userId, blockchainAddress) {
        const user = await this.db.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        await this.db.updateUserVerificationStatus(userId, types_1.VerificationStatus.VERIFIED);
        return await this.db.getUserById(userId);
    }
    async getUserByBlockchainAddress(address) {
        return await this.db.getUserByBlockchainAddress(address);
    }
    async verifyUser(userId) {
        return await this.db.updateUserVerificationStatus(userId, types_1.VerificationStatus.VERIFIED);
    }
    async revokeUserVerification(userId) {
        return await this.db.updateUserVerificationStatus(userId, types_1.VerificationStatus.REVOKED);
    }
}
exports.UserModel = UserModel;
class UserProfileModel {
    constructor(dbManager) {
        this.db = dbManager || new prisma_manager_1.PrismaDatabaseManager();
    }
    async initialize() {
        await this.db.connect();
    }
    async close() {
        await this.db.disconnect();
    }
    async createProfile(userId, profileData) {
        return await this.db.createUserProfile({
            user_id: userId,
            ...profileData
        });
    }
    async getCompleteProfile(userId) {
        return await this.db.getUserProfileWithUser(userId);
    }
    async updateKYCData(userId, kycData) {
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
    async updateEmergencyContacts(userId, contacts) {
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
exports.UserProfileModel = UserProfileModel;
class DigitalIDModel {
    constructor(dbManager) {
        this.db = dbManager || new prisma_manager_1.PrismaDatabaseManager();
    }
    async initialize() {
        await this.db.connect();
    }
    async close() {
        await this.db.disconnect();
    }
    async generateDigitalID(userId, blockchainHash, qrCodeData) {
        const user = await this.db.getUserById(userId);
        if (!user || user.verification_status !== types_1.VerificationStatus.VERIFIED) {
            throw new Error('User must be verified to generate digital ID');
        }
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        return await this.db.createDigitalID({
            user_id: userId,
            blockchain_hash: blockchainHash,
            qr_code_data: JSON.stringify(qrCodeData),
            valid_from: validFrom,
            valid_until: validUntil,
            status: types_1.DigitalIDStatus.ACTIVE
        });
    }
    async getActiveIDsForUser(userId) {
        return await this.db.getActiveDigitalIDsForUser(userId);
    }
    async verifyDigitalID(blockchainHash) {
        const digitalId = await this.db.getDigitalIDByBlockchainHash(blockchainHash);
        if (!digitalId) {
            return {
                isValid: false,
                reason: 'Digital ID not found'
            };
        }
        if (digitalId.status !== types_1.DigitalIDStatus.ACTIVE) {
            return {
                isValid: false,
                digitalId,
                reason: `Digital ID is ${digitalId.status.toLowerCase()}`
            };
        }
        const now = new Date();
        if (now > digitalId.valid_until) {
            await this.db.expireDigitalID(digitalId.id);
            return {
                isValid: false,
                digitalId,
                reason: 'Digital ID has expired'
            };
        }
        const user = await this.db.getUserById(digitalId.user_id);
        if (!user || user.verification_status !== types_1.VerificationStatus.VERIFIED) {
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
    async revokeDigitalID(digitalIdId) {
        return await this.db.revokeDigitalID(digitalIdId);
    }
    async getDigitalIDForDisplay(blockchainHash) {
        const digitalId = await this.db.getDigitalIDByBlockchainHash(blockchainHash);
        if (!digitalId)
            return null;
        const user = await this.db.getUserById(digitalId.user_id);
        if (!user)
            return null;
        const userProfile = await this.db.getUserProfile(digitalId.user_id);
        return {
            digitalId,
            user,
            userProfile: userProfile || undefined
        };
    }
}
exports.DigitalIDModel = DigitalIDModel;
function createModels() {
    const dbManager = new prisma_manager_1.PrismaDatabaseManager();
    return {
        userModel: new UserModel(dbManager),
        userProfileModel: new UserProfileModel(dbManager),
        digitalIDModel: new DigitalIDModel(dbManager),
        dbManager
    };
}
__exportStar(require("./types"), exports);
var prisma_manager_2 = require("./prisma-manager");
Object.defineProperty(exports, "PrismaDatabaseManager", { enumerable: true, get: function () { return prisma_manager_2.PrismaDatabaseManager; } });
var migrations_1 = require("./migrations");
Object.defineProperty(exports, "DatabaseMigrations", { enumerable: true, get: function () { return migrations_1.DatabaseMigrations; } });
