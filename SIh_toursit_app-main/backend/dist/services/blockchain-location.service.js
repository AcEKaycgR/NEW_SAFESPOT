"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainLocationService = exports.BlockchainLocationService = void 0;
const ethers_1 = require("ethers");
const zod_1 = require("zod");
const LocationAccessSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    serviceId: zod_1.z.string().min(1),
    operatorId: zod_1.z.string().min(1),
    incidentId: zod_1.z.string().min(1),
    locationData: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        lng: zod_1.z.number().min(-180).max(180),
        precision: zod_1.z.enum(['EXACT', 'APPROXIMATE', 'GENERAL'])
    }),
    timestamp: zod_1.z.date(),
    accessGranted: zod_1.z.boolean()
});
const BatchLocationAccessSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    serviceId: zod_1.z.string().min(1),
    operatorId: zod_1.z.string().min(1),
    accessLogs: zod_1.z.array(zod_1.z.object({
        incidentId: zod_1.z.string().min(1),
        locationData: zod_1.z.object({
            lat: zod_1.z.number().min(-90).max(90),
            lng: zod_1.z.number().min(-180).max(180),
            precision: zod_1.z.enum(['EXACT', 'APPROXIMATE', 'GENERAL'])
        }),
        timestamp: zod_1.z.date(),
        accessGranted: zod_1.z.boolean()
    })).min(1).max(50)
});
class BlockchainLocationService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.signer = null;
        this.CONTRACT_ADDRESS = process.env.LOCATION_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        this.CONTRACT_ABI = [
            "function storeLocationAccessHash(address userAddress, bytes32 locationHash, string calldata incidentId) external",
            "function batchStoreLocationAccessHash(address userAddress, bytes32[] calldata locationHashes, string[] calldata incidentIds) external",
            "function verifyLocationAccess(address userAddress, bytes32 locationHash, address emergencyService) external view returns (bool)",
            "function getLocationAccessLogs(address userAddress, uint256 offset, uint256 limit) external view returns (tuple(bytes32 locationHash, address emergencyService, string incidentId, uint256 timestamp)[])",
            "function isAuthorizedEmergencyService(address serviceAddress) external view returns (bool)",
            "function getLocationHashCount(address userAddress) external view returns (uint256)",
            "event LocationAccessLogged(address indexed user, address indexed emergencyService, bytes32 indexed locationHash, string incidentId)"
        ];
        this.initializeProvider();
    }
    initializeProvider() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.contract = new ethers_1.ethers.Contract(this.CONTRACT_ADDRESS, this.CONTRACT_ABI, this.provider);
            console.log('Blockchain location service initialized');
        }
        catch (error) {
            console.warn('Failed to initialize blockchain location service:', error);
        }
    }
    async initializeSigner() {
        if (!this.provider) {
            throw new Error('Provider not initialized');
        }
        try {
            const privateKey = process.env.EMERGENCY_SERVICE_PRIVATE_KEY ||
                '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
            this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
            if (this.contract) {
                this.contract = new ethers_1.ethers.Contract(this.CONTRACT_ADDRESS, this.CONTRACT_ABI, this.signer);
            }
        }
        catch (error) {
            console.error('Failed to initialize signer:', error);
            throw error;
        }
    }
    generateLocationHash(locationData, timestamp) {
        const dataString = JSON.stringify({
            lat: locationData.lat,
            lng: locationData.lng,
            precision: locationData.precision,
            timestamp: timestamp.toISOString()
        });
        return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(dataString));
    }
    userIdToAddress(userId) {
        const hash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(userId));
        return ethers_1.ethers.getAddress('0x' + hash.slice(2, 42));
    }
    async storeLocationAccessHash(data) {
        try {
            const validatedData = LocationAccessSchema.parse(data);
            if (!this.contract) {
                throw new Error('Blockchain service not available');
            }
            await this.initializeSigner();
            const locationHash = this.generateLocationHash(validatedData.locationData, validatedData.timestamp);
            const userAddress = this.userIdToAddress(validatedData.userId);
            const tx = await this.contract.storeLocationAccessHash(userAddress, locationHash, validatedData.incidentId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        }
        catch (error) {
            console.error('Failed to store location access hash:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async batchStoreLocationAccessHashes(data) {
        try {
            const validatedData = BatchLocationAccessSchema.parse(data);
            if (!this.contract) {
                throw new Error('Blockchain service not available');
            }
            await this.initializeSigner();
            const locationHashes = validatedData.accessLogs.map(log => this.generateLocationHash(log.locationData, log.timestamp));
            const incidentIds = validatedData.accessLogs.map(log => log.incidentId);
            const userAddress = this.userIdToAddress(validatedData.userId);
            const tx = await this.contract.batchStoreLocationAccessHash(userAddress, locationHashes, incidentIds);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        }
        catch (error) {
            console.error('Failed to batch store location access hashes:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async verifyLocationAccess(userId, locationData, timestamp, emergencyServiceAddress) {
        try {
            if (!this.contract) {
                throw new Error('Blockchain service not available');
            }
            const locationHash = this.generateLocationHash(locationData, timestamp);
            const userAddress = this.userIdToAddress(userId);
            const isVerified = await this.contract.verifyLocationAccess(userAddress, locationHash, emergencyServiceAddress);
            return {
                success: true,
                verified: isVerified
            };
        }
        catch (error) {
            console.error('Failed to verify location access:', error);
            return {
                success: false,
                verified: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getLocationAccessAuditTrail(userId, offset = 0, limit = 50) {
        try {
            if (!this.contract) {
                throw new Error('Blockchain service not available');
            }
            const userAddress = this.userIdToAddress(userId);
            const rawLogs = await this.contract.getLocationAccessLogs(userAddress, offset, limit);
            const logs = rawLogs.map(log => ({
                locationHash: log.locationHash,
                emergencyService: log.emergencyService,
                incidentId: log.incidentId,
                timestamp: new Date(Number(log.timestamp) * 1000)
            }));
            return {
                success: true,
                logs
            };
        }
        catch (error) {
            console.error('Failed to get location access audit trail:', error);
            return {
                success: false,
                logs: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async isAuthorizedEmergencyService(serviceAddress) {
        try {
            if (!this.contract) {
                throw new Error('Blockchain service not available');
            }
            const isAuthorized = await this.contract.isAuthorizedEmergencyService(serviceAddress);
            return {
                success: true,
                authorized: isAuthorized
            };
        }
        catch (error) {
            console.error('Failed to check emergency service authorization:', error);
            return {
                success: false,
                authorized: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getConnectionStatus() {
        try {
            if (!this.provider) {
                return {
                    connected: false,
                    error: 'Provider not initialized'
                };
            }
            const blockNumber = await this.provider.getBlockNumber();
            const network = await this.provider.getNetwork();
            return {
                connected: true,
                blockNumber,
                chainId: Number(network.chainId)
            };
        }
        catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
exports.BlockchainLocationService = BlockchainLocationService;
exports.blockchainLocationService = new BlockchainLocationService();
