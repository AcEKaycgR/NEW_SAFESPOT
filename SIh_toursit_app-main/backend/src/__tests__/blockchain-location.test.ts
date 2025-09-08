import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { BlockchainLocationService } from '../services/blockchain-location.service';
import { ethers } from 'ethers';

// Mock ethers module
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    Contract: jest.fn(),
    Wallet: jest.fn(),
    keccak256: jest.fn(),
    toUtf8Bytes: jest.fn(),
    getAddress: jest.fn()
  }
}));

describe('BlockchainLocationService', () => {
  let blockchainService: BlockchainLocationService;
  let mockProvider: any;
  let mockContract: any;
  let mockSigner: any;

  const sampleLocationData = {
    userId: 'user-123',
    serviceId: 'POLICE_001',
    operatorId: 'OP-001',
    incidentId: 'INC-001',
    locationData: {
      lat: 40.7128,
      lng: -74.0060,
      precision: 'EXACT' as const
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
          precision: 'EXACT' as const
        },
        timestamp: new Date('2023-12-01T10:00:00Z'),
        accessGranted: true
      },
      {
        incidentId: 'INC-002',
        locationData: {
          lat: 40.7130,
          lng: -74.0062,
          precision: 'APPROXIMATE' as const
        },
        timestamp: new Date('2023-12-01T10:05:00Z'),
        accessGranted: true
      }
    ]
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock provider
    mockProvider = {
      getBlockNumber: jest.fn(() => Promise.resolve(12345)),
      getNetwork: jest.fn(() => Promise.resolve({ chainId: BigInt(31337) }))
    };

    // Setup mock contract
    mockContract = {
      storeLocationAccessHash: jest.fn(() => Promise.resolve({
        wait: jest.fn(() => Promise.resolve({
          hash: '0xabc123',
          blockNumber: 12346
        }))
      })),
      batchStoreLocationAccessHash: jest.fn(() => Promise.resolve({
        wait: jest.fn(() => Promise.resolve({
          hash: '0xdef456',
          blockNumber: 12347
        }))
      })),
      verifyLocationAccess: jest.fn(() => Promise.resolve(true)),
      getLocationAccessLogs: jest.fn(() => Promise.resolve([
        {
          locationHash: '0x123',
          emergencyService: '0xservice',
          incidentId: 'INC-001',
          timestamp: BigInt(1701424800) // 2023-12-01T10:00:00Z
        }
      ])),
      isAuthorizedEmergencyService: jest.fn(() => Promise.resolve(true))
    };

    // Setup mock signer
    mockSigner = {
      address: '0xsigner'
    };

    // Setup ethers mocks
    (ethers.JsonRpcProvider as any).mockReturnValue(mockProvider);
    (ethers.Contract as any).mockReturnValue(mockContract);
    (ethers.Wallet as any).mockReturnValue(mockSigner);
    (ethers.keccak256 as any).mockReturnValue('0xhash123');
    (ethers.toUtf8Bytes as any).mockReturnValue(new Uint8Array());
    (ethers.getAddress as any).mockReturnValue('0xuser123');

    // Create service instance
    blockchainService = new BlockchainLocationService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(blockchainService).toBeInstanceOf(BlockchainLocationService);
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('http://127.0.0.1:8545');
    });

    it('should use custom RPC URL from environment', () => {
      const originalEnv = process.env.BLOCKCHAIN_RPC_URL;
      process.env.BLOCKCHAIN_RPC_URL = 'http://custom-rpc:8545';
      
      new BlockchainLocationService();
      
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('http://custom-rpc:8545');
      
      // Restore original environment
      if (originalEnv) {
        process.env.BLOCKCHAIN_RPC_URL = originalEnv;
      } else {
        delete process.env.BLOCKCHAIN_RPC_URL;
      }
    });
  });

  describe('Connection Status', () => {
    it('should return connection status successfully', async () => {
      const status = await blockchainService.getConnectionStatus();
      
      expect(status.connected).toBe(true);
      expect(status.blockNumber).toBe(12345);
      expect(status.chainId).toBe(31337);
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      expect(mockProvider.getNetwork).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      mockProvider.getBlockNumber.mockRejectedValue(new Error('Network error'));
      
      const status = await blockchainService.getConnectionStatus();
      
      expect(status.connected).toBe(false);
      expect(status.error).toBe('Network error');
    });
  });

  describe('Location Access Hash Storage', () => {
    it('should store location access hash successfully', async () => {
      const result = await blockchainService.storeLocationAccessHash(sampleLocationData);
      
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xabc123');
      expect(result.blockNumber).toBe(12346);
      expect(mockContract.storeLocationAccessHash).toHaveBeenCalledWith(
        '0xuser123', // userAddress
        '0xhash123', // locationHash
        'INC-001' // incidentId
      );
    });

    it('should validate input data and reject invalid data', async () => {
      const invalidData = {
        ...sampleLocationData,
        locationData: {
          ...sampleLocationData.locationData,
          lat: 91 // Invalid latitude
        }
      };
      
      const result = await blockchainService.storeLocationAccessHash(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Number must be less than or equal to 90');
    });

    it('should handle blockchain transaction errors', async () => {
      mockContract.storeLocationAccessHash.mockRejectedValue(new Error('Transaction failed'));
      
      const result = await blockchainService.storeLocationAccessHash(sampleLocationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });

    it('should generate consistent location hashes for same data', async () => {
      await blockchainService.storeLocationAccessHash(sampleLocationData);
      await blockchainService.storeLocationAccessHash(sampleLocationData);
      
      // Should call keccak256 twice per call: once for location hash, once for user address mapping
      expect(ethers.keccak256).toHaveBeenCalledTimes(4);
      expect(ethers.toUtf8Bytes).toHaveBeenCalledTimes(4);
    });
  });

  describe('Batch Location Access Hash Storage', () => {
    it('should store multiple location access hashes in batch', async () => {
      const result = await blockchainService.batchStoreLocationAccessHashes(sampleBatchData);
      
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xdef456');
      expect(result.blockNumber).toBe(12347);
      expect(mockContract.batchStoreLocationAccessHash).toHaveBeenCalledWith(
        '0xuser123', // userAddress
        ['0xhash123', '0xhash123'], // locationHashes
        ['INC-001', 'INC-002'] // incidentIds
      );
    });

    it('should validate batch size limits', async () => {
      const largeBatch = {
        ...sampleBatchData,
        accessLogs: Array(51).fill(sampleBatchData.accessLogs[0]) // Exceed 50 item limit
      };
      
      const result = await blockchainService.batchStoreLocationAccessHashes(largeBatch);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Array must contain at most 50 element(s)');
    });

    it('should handle empty batch arrays', async () => {
      const emptyBatch = {
        ...sampleBatchData,
        accessLogs: []
      };
      
      const result = await blockchainService.batchStoreLocationAccessHashes(emptyBatch);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Array must contain at least 1 element(s)');
    });
  });

  describe('Location Access Verification', () => {
    it('should verify location access successfully', async () => {
      const result = await blockchainService.verifyLocationAccess(
        'user-123',
        sampleLocationData.locationData,
        sampleLocationData.timestamp,
        '0xemergencyservice'
      );
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(mockContract.verifyLocationAccess).toHaveBeenCalledWith(
        '0xuser123',
        '0xhash123',
        '0xemergencyservice'
      );
    });

    it('should return false for unverified access', async () => {
      mockContract.verifyLocationAccess.mockResolvedValue(false);
      
      const result = await blockchainService.verifyLocationAccess(
        'user-123',
        sampleLocationData.locationData,
        sampleLocationData.timestamp,
        '0xemergencyservice'
      );
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(false);
    });

    it('should handle verification errors', async () => {
      mockContract.verifyLocationAccess.mockRejectedValue(new Error('Verification failed'));
      
      const result = await blockchainService.verifyLocationAccess(
        'user-123',
        sampleLocationData.locationData,
        sampleLocationData.timestamp,
        '0xemergencyservice'
      );
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Verification failed');
    });
  });

  describe('Audit Trail Retrieval', () => {
    it('should retrieve location access audit trail', async () => {
      const result = await blockchainService.getLocationAccessAuditTrail('user-123', 0, 10);
      
      expect(result.success).toBe(true);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]).toEqual({
        locationHash: '0x123',
        emergencyService: '0xservice',
        incidentId: 'INC-001',
        timestamp: new Date('2023-12-01T10:00:00Z')
      });
      expect(mockContract.getLocationAccessLogs).toHaveBeenCalledWith('0xuser123', 0, 10);
    });

    it('should use default pagination parameters', async () => {
      await blockchainService.getLocationAccessAuditTrail('user-123');
      
      expect(mockContract.getLocationAccessLogs).toHaveBeenCalledWith('0xuser123', 0, 50);
    });

    it('should handle audit trail retrieval errors', async () => {
      mockContract.getLocationAccessLogs.mockRejectedValue(new Error('Retrieval failed'));
      
      const result = await blockchainService.getLocationAccessAuditTrail('user-123');
      
      expect(result.success).toBe(false);
      expect(result.logs).toEqual([]);
      expect(result.error).toBe('Retrieval failed');
    });
  });

  describe('Emergency Service Authorization', () => {
    it('should check if service is authorized', async () => {
      const result = await blockchainService.isAuthorizedEmergencyService('0xservice');
      
      expect(result.success).toBe(true);
      expect(result.authorized).toBe(true);
      expect(mockContract.isAuthorizedEmergencyService).toHaveBeenCalledWith('0xservice');
    });

    it('should return false for unauthorized services', async () => {
      mockContract.isAuthorizedEmergencyService.mockResolvedValue(false);
      
      const result = await blockchainService.isAuthorizedEmergencyService('0xunauthorized');
      
      expect(result.success).toBe(true);
      expect(result.authorized).toBe(false);
    });

    it('should handle authorization check errors', async () => {
      mockContract.isAuthorizedEmergencyService.mockRejectedValue(new Error('Check failed'));
      
      const result = await blockchainService.isAuthorizedEmergencyService('0xservice');
      
      expect(result.success).toBe(false);
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Check failed');
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should handle service unavailability gracefully', async () => {
      // Create a service without blockchain connection
      (ethers.JsonRpcProvider as any).mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      const serviceWithoutBlockchain = new BlockchainLocationService();
      const result = await serviceWithoutBlockchain.storeLocationAccessHash(sampleLocationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Blockchain service not available');
    });

    it('should provide meaningful error messages for validation failures', async () => {
      const invalidData = {
        ...sampleLocationData,
        userId: '', // Invalid: empty string
        locationData: {
          lat: 'invalid', // Invalid: string instead of number
          lng: -74.0060,
          precision: 'INVALID' // Invalid: not in enum
        }
      } as any;
      
      const result = await blockchainService.storeLocationAccessHash(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('String must contain at least 1 character(s)');
    });
  });

  describe('Gas Optimization', () => {
    it('should prefer batch operations for multiple accesses', async () => {
      // Test that batch operation is more gas efficient than multiple single operations
      const batchResult = await blockchainService.batchStoreLocationAccessHashes(sampleBatchData);
      
      expect(batchResult.success).toBe(true);
      expect(mockContract.batchStoreLocationAccessHash).toHaveBeenCalledTimes(1);
      expect(mockContract.storeLocationAccessHash).not.toHaveBeenCalled();
    });

    it('should enforce reasonable batch size limits', async () => {
      const maxBatchData = {
        ...sampleBatchData,
        accessLogs: Array(50).fill(sampleBatchData.accessLogs[0])
      };
      
      const result = await blockchainService.batchStoreLocationAccessHashes(maxBatchData);
      
      expect(result.success).toBe(true); // Should accept 50 items
    });
  });

  describe('Integration with Existing Emergency Access', () => {
    it('should be compatible with emergency access service data format', () => {
      // Test that the service can handle data from emergency access service
      const emergencyAccessData = {
        userId: 'user-456',
        serviceId: 'FIRE_002',
        operatorId: 'OP-003',
        incidentId: 'FIRE-001',
        locationData: {
          lat: 40.7580,
          lng: -73.9855,
          precision: 'GENERAL' as const
        },
        timestamp: new Date(),
        accessGranted: true
      };
      
      expect(() => blockchainService.storeLocationAccessHash(emergencyAccessData)).not.toThrow();
    });
  });
});
