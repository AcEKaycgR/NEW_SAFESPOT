"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const blockchain_location_service_1 = require("../services/blockchain-location.service");
const ethers_1 = require("ethers");
globals_1.jest.mock('ethers', () => ({
    ethers: {
        JsonRpcProvider: globals_1.jest.fn(),
        Contract: globals_1.jest.fn(),
        Wallet: globals_1.jest.fn(),
        keccak256: globals_1.jest.fn(),
        toUtf8Bytes: globals_1.jest.fn(),
        getAddress: globals_1.jest.fn()
    }
}));
(0, globals_1.describe)('BlockchainLocationService', () => {
    let blockchainService;
    let mockProvider;
    let mockContract;
    let mockSigner;
    const sampleLocationData = {
        userId: 'user-123',
        serviceId: 'POLICE_001',
        operatorId: 'OP-001',
        incidentId: 'INC-001',
        locationData: {
            lat: 40.7128,
            lng: -74.0060,
            precision: 'EXACT'
        },
        timestamp: new Date('2023-12-01T10:00:00Z'),
        accessGranted: true
    };
    const sampleBatchData = {
        userId: 'user-123',
        serviceId: 'POLICE_001',
        operatorId: 'OP-001',
        accessLogs: [
            {
                incidentId: 'INC-001',
                locationData: {
                    lat: 40.7128,
                    lng: -74.0060,
                    precision: 'EXACT'
                },
                timestamp: new Date('2023-12-01T10:00:00Z'),
                accessGranted: true
            },
            {
                incidentId: 'INC-002',
                locationData: {
                    lat: 40.7130,
                    lng: -74.0062,
                    precision: 'APPROXIMATE'
                },
                timestamp: new Date('2023-12-01T10:05:00Z'),
                accessGranted: true
            }
        ]
    };
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockProvider = {
            getBlockNumber: globals_1.jest.fn(() => Promise.resolve(12345)),
            getNetwork: globals_1.jest.fn(() => Promise.resolve({ chainId: BigInt(31337) }))
        };
        mockContract = {
            storeLocationAccessHash: globals_1.jest.fn(() => Promise.resolve({
                wait: globals_1.jest.fn(() => Promise.resolve({
                    hash: '0xabc123',
                    blockNumber: 12346
                }))
            })),
            batchStoreLocationAccessHash: globals_1.jest.fn(() => Promise.resolve({
                wait: globals_1.jest.fn(() => Promise.resolve({
                    hash: '0xdef456',
                    blockNumber: 12347
                }))
            })),
            verifyLocationAccess: globals_1.jest.fn(() => Promise.resolve(true)),
            getLocationAccessLogs: globals_1.jest.fn(() => Promise.resolve([
                {
                    locationHash: '0x123',
                    emergencyService: '0xservice',
                    incidentId: 'INC-001',
                    timestamp: BigInt(1701424800)
                }
            ])),
            isAuthorizedEmergencyService: globals_1.jest.fn(() => Promise.resolve(true))
        };
        mockSigner = {
            address: '0xsigner'
        };
        ethers_1.ethers.JsonRpcProvider.mockReturnValue(mockProvider);
        ethers_1.ethers.Contract.mockReturnValue(mockContract);
        ethers_1.ethers.Wallet.mockReturnValue(mockSigner);
        ethers_1.ethers.keccak256.mockReturnValue('0xhash123');
        ethers_1.ethers.toUtf8Bytes.mockReturnValue(new Uint8Array());
        ethers_1.ethers.getAddress.mockReturnValue('0xuser123');
        blockchainService = new blockchain_location_service_1.BlockchainLocationService();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)('Service Initialization', () => {
        (0, globals_1.it)('should initialize with default configuration', () => {
            (0, globals_1.expect)(blockchainService).toBeInstanceOf(blockchain_location_service_1.BlockchainLocationService);
            (0, globals_1.expect)(ethers_1.ethers.JsonRpcProvider).toHaveBeenCalledWith('http://127.0.0.1:8545');
        });
        (0, globals_1.it)('should use custom RPC URL from environment', () => {
            const originalEnv = process.env.BLOCKCHAIN_RPC_URL;
            process.env.BLOCKCHAIN_RPC_URL = 'http://custom-rpc:8545';
            new blockchain_location_service_1.BlockchainLocationService();
            (0, globals_1.expect)(ethers_1.ethers.JsonRpcProvider).toHaveBeenCalledWith('http://custom-rpc:8545');
            if (originalEnv) {
                process.env.BLOCKCHAIN_RPC_URL = originalEnv;
            }
            else {
                delete process.env.BLOCKCHAIN_RPC_URL;
            }
        });
    });
    (0, globals_1.describe)('Connection Status', () => {
        (0, globals_1.it)('should return connection status successfully', async () => {
            const status = await blockchainService.getConnectionStatus();
            (0, globals_1.expect)(status.connected).toBe(true);
            (0, globals_1.expect)(status.blockNumber).toBe(12345);
            (0, globals_1.expect)(status.chainId).toBe(31337);
            (0, globals_1.expect)(mockProvider.getBlockNumber).toHaveBeenCalled();
            (0, globals_1.expect)(mockProvider.getNetwork).toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle connection errors gracefully', async () => {
            mockProvider.getBlockNumber.mockRejectedValue(new Error('Network error'));
            const status = await blockchainService.getConnectionStatus();
            (0, globals_1.expect)(status.connected).toBe(false);
            (0, globals_1.expect)(status.error).toBe('Network error');
        });
    });
    (0, globals_1.describe)('Location Access Hash Storage', () => {
        (0, globals_1.it)('should store location access hash successfully', async () => {
            const result = await blockchainService.storeLocationAccessHash(sampleLocationData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.transactionHash).toBe('0xabc123');
            (0, globals_1.expect)(result.blockNumber).toBe(12346);
            (0, globals_1.expect)(mockContract.storeLocationAccessHash).toHaveBeenCalledWith('0xuser123', '0xhash123', 'INC-001');
        });
        (0, globals_1.it)('should validate input data and reject invalid data', async () => {
            const invalidData = {
                ...sampleLocationData,
                locationData: {
                    ...sampleLocationData.locationData,
                    lat: 91
                }
            };
            const result = await blockchainService.storeLocationAccessHash(invalidData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Number must be less than or equal to 90');
        });
        (0, globals_1.it)('should handle blockchain transaction errors', async () => {
            mockContract.storeLocationAccessHash.mockRejectedValue(new Error('Transaction failed'));
            const result = await blockchainService.storeLocationAccessHash(sampleLocationData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBe('Transaction failed');
        });
        (0, globals_1.it)('should generate consistent location hashes for same data', async () => {
            await blockchainService.storeLocationAccessHash(sampleLocationData);
            await blockchainService.storeLocationAccessHash(sampleLocationData);
            (0, globals_1.expect)(ethers_1.ethers.keccak256).toHaveBeenCalledTimes(4);
            (0, globals_1.expect)(ethers_1.ethers.toUtf8Bytes).toHaveBeenCalledTimes(4);
        });
    });
    (0, globals_1.describe)('Batch Location Access Hash Storage', () => {
        (0, globals_1.it)('should store multiple location access hashes in batch', async () => {
            const result = await blockchainService.batchStoreLocationAccessHashes(sampleBatchData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.transactionHash).toBe('0xdef456');
            (0, globals_1.expect)(result.blockNumber).toBe(12347);
            (0, globals_1.expect)(mockContract.batchStoreLocationAccessHash).toHaveBeenCalledWith('0xuser123', ['0xhash123', '0xhash123'], ['INC-001', 'INC-002']);
        });
        (0, globals_1.it)('should validate batch size limits', async () => {
            const largeBatch = {
                ...sampleBatchData,
                accessLogs: Array(51).fill(sampleBatchData.accessLogs[0])
            };
            const result = await blockchainService.batchStoreLocationAccessHashes(largeBatch);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Array must contain at most 50 element(s)');
        });
        (0, globals_1.it)('should handle empty batch arrays', async () => {
            const emptyBatch = {
                ...sampleBatchData,
                accessLogs: []
            };
            const result = await blockchainService.batchStoreLocationAccessHashes(emptyBatch);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Array must contain at least 1 element(s)');
        });
    });
    (0, globals_1.describe)('Location Access Verification', () => {
        (0, globals_1.it)('should verify location access successfully', async () => {
            const result = await blockchainService.verifyLocationAccess('user-123', sampleLocationData.locationData, sampleLocationData.timestamp, '0xemergencyservice');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.verified).toBe(true);
            (0, globals_1.expect)(mockContract.verifyLocationAccess).toHaveBeenCalledWith('0xuser123', '0xhash123', '0xemergencyservice');
        });
        (0, globals_1.it)('should return false for unverified access', async () => {
            mockContract.verifyLocationAccess.mockResolvedValue(false);
            const result = await blockchainService.verifyLocationAccess('user-123', sampleLocationData.locationData, sampleLocationData.timestamp, '0xemergencyservice');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.verified).toBe(false);
        });
        (0, globals_1.it)('should handle verification errors', async () => {
            mockContract.verifyLocationAccess.mockRejectedValue(new Error('Verification failed'));
            const result = await blockchainService.verifyLocationAccess('user-123', sampleLocationData.locationData, sampleLocationData.timestamp, '0xemergencyservice');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.verified).toBe(false);
            (0, globals_1.expect)(result.error).toBe('Verification failed');
        });
    });
    (0, globals_1.describe)('Audit Trail Retrieval', () => {
        (0, globals_1.it)('should retrieve location access audit trail', async () => {
            const result = await blockchainService.getLocationAccessAuditTrail('user-123', 0, 10);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.logs).toHaveLength(1);
            (0, globals_1.expect)(result.logs[0]).toEqual({
                locationHash: '0x123',
                emergencyService: '0xservice',
                incidentId: 'INC-001',
                timestamp: new Date('2023-12-01T10:00:00Z')
            });
            (0, globals_1.expect)(mockContract.getLocationAccessLogs).toHaveBeenCalledWith('0xuser123', 0, 10);
        });
        (0, globals_1.it)('should use default pagination parameters', async () => {
            await blockchainService.getLocationAccessAuditTrail('user-123');
            (0, globals_1.expect)(mockContract.getLocationAccessLogs).toHaveBeenCalledWith('0xuser123', 0, 50);
        });
        (0, globals_1.it)('should handle audit trail retrieval errors', async () => {
            mockContract.getLocationAccessLogs.mockRejectedValue(new Error('Retrieval failed'));
            const result = await blockchainService.getLocationAccessAuditTrail('user-123');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.logs).toEqual([]);
            (0, globals_1.expect)(result.error).toBe('Retrieval failed');
        });
    });
    (0, globals_1.describe)('Emergency Service Authorization', () => {
        (0, globals_1.it)('should check if service is authorized', async () => {
            const result = await blockchainService.isAuthorizedEmergencyService('0xservice');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.authorized).toBe(true);
            (0, globals_1.expect)(mockContract.isAuthorizedEmergencyService).toHaveBeenCalledWith('0xservice');
        });
        (0, globals_1.it)('should return false for unauthorized services', async () => {
            mockContract.isAuthorizedEmergencyService.mockResolvedValue(false);
            const result = await blockchainService.isAuthorizedEmergencyService('0xunauthorized');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.authorized).toBe(false);
        });
        (0, globals_1.it)('should handle authorization check errors', async () => {
            mockContract.isAuthorizedEmergencyService.mockRejectedValue(new Error('Check failed'));
            const result = await blockchainService.isAuthorizedEmergencyService('0xservice');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.authorized).toBe(false);
            (0, globals_1.expect)(result.error).toBe('Check failed');
        });
    });
    (0, globals_1.describe)('Error Handling and Fallback', () => {
        (0, globals_1.it)('should handle service unavailability gracefully', async () => {
            ethers_1.ethers.JsonRpcProvider.mockImplementation(() => {
                throw new Error('Connection failed');
            });
            const serviceWithoutBlockchain = new blockchain_location_service_1.BlockchainLocationService();
            const result = await serviceWithoutBlockchain.storeLocationAccessHash(sampleLocationData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Blockchain service not available');
        });
        (0, globals_1.it)('should provide meaningful error messages for validation failures', async () => {
            const invalidData = {
                ...sampleLocationData,
                userId: '',
                locationData: {
                    lat: 'invalid',
                    lng: -74.0060,
                    precision: 'INVALID'
                }
            };
            const result = await blockchainService.storeLocationAccessHash(invalidData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('String must contain at least 1 character(s)');
        });
    });
    (0, globals_1.describe)('Gas Optimization', () => {
        (0, globals_1.it)('should prefer batch operations for multiple accesses', async () => {
            const batchResult = await blockchainService.batchStoreLocationAccessHashes(sampleBatchData);
            (0, globals_1.expect)(batchResult.success).toBe(true);
            (0, globals_1.expect)(mockContract.batchStoreLocationAccessHash).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockContract.storeLocationAccessHash).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should enforce reasonable batch size limits', async () => {
            const maxBatchData = {
                ...sampleBatchData,
                accessLogs: Array(50).fill(sampleBatchData.accessLogs[0])
            };
            const result = await blockchainService.batchStoreLocationAccessHashes(maxBatchData);
            (0, globals_1.expect)(result.success).toBe(true);
        });
    });
    (0, globals_1.describe)('Integration with Existing Emergency Access', () => {
        (0, globals_1.it)('should be compatible with emergency access service data format', () => {
            const emergencyAccessData = {
                userId: 'user-456',
                serviceId: 'FIRE_002',
                operatorId: 'OP-003',
                incidentId: 'FIRE-001',
                locationData: {
                    lat: 40.7580,
                    lng: -73.9855,
                    precision: 'GENERAL'
                },
                timestamp: new Date(),
                accessGranted: true
            };
            (0, globals_1.expect)(() => blockchainService.storeLocationAccessHash(emergencyAccessData)).not.toThrow();
        });
    });
});
