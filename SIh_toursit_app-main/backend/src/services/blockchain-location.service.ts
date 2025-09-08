import { ethers } from 'ethers';
import { z } from 'zod';

// Validation schemas
const LocationAccessSchema = z.object({
  userId: z.string().min(1),
  serviceId: z.string().min(1),
  operatorId: z.string().min(1),
  incidentId: z.string().min(1),
  locationData: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    precision: z.enum(['EXACT', 'APPROXIMATE', 'GENERAL'])
  }),
  timestamp: z.date(),
  accessGranted: z.boolean()
});

const BatchLocationAccessSchema = z.object({
  userId: z.string().min(1),
  serviceId: z.string().min(1),
  operatorId: z.string().min(1),
  accessLogs: z.array(z.object({
    incidentId: z.string().min(1),
    locationData: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      precision: z.enum(['EXACT', 'APPROXIMATE', 'GENERAL'])
    }),
    timestamp: z.date(),
    accessGranted: z.boolean()
  })).min(1).max(50) // Limit batch size for gas optimization
});

type LocationAccessData = z.infer<typeof LocationAccessSchema>;
type BatchLocationAccessData = z.infer<typeof BatchLocationAccessSchema>;

interface LocationRegistryContract {
  storeLocationAccessHash(
    userAddress: string,
    locationHash: string,
    incidentId: string
  ): Promise<any>;
  
  batchStoreLocationAccessHash(
    userAddress: string,
    locationHashes: string[],
    incidentIds: string[]
  ): Promise<any>;
  
  verifyLocationAccess(
    userAddress: string,
    locationHash: string,
    emergencyService: string
  ): Promise<boolean>;
  
  getLocationAccessLogs(
    userAddress: string,
    offset: number,
    limit: number
  ): Promise<any[]>;
  
  isAuthorizedEmergencyService(serviceAddress: string): Promise<boolean>;
}

export class BlockchainLocationService {
  private provider: ethers.Provider | null = null;
  private contract: LocationRegistryContract | null = null;
  private signer: ethers.Signer | null = null;
  
  // Contract configuration - should be from environment in production
  private readonly CONTRACT_ADDRESS = process.env.LOCATION_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  private readonly CONTRACT_ABI = [
    "function storeLocationAccessHash(address userAddress, bytes32 locationHash, string calldata incidentId) external",
    "function batchStoreLocationAccessHash(address userAddress, bytes32[] calldata locationHashes, string[] calldata incidentIds) external",
    "function verifyLocationAccess(address userAddress, bytes32 locationHash, address emergencyService) external view returns (bool)",
    "function getLocationAccessLogs(address userAddress, uint256 offset, uint256 limit) external view returns (tuple(bytes32 locationHash, address emergencyService, string incidentId, uint256 timestamp)[])",
    "function isAuthorizedEmergencyService(address serviceAddress) external view returns (bool)",
    "function getLocationHashCount(address userAddress) external view returns (uint256)",
    "event LocationAccessLogged(address indexed user, address indexed emergencyService, bytes32 indexed locationHash, string incidentId)"
  ];

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    try {
      // In development, connect to local Hardhat node
      // In production, use appropriate RPC URL
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Initialize contract (read-only for now)
      this.contract = new ethers.Contract(
        this.CONTRACT_ADDRESS,
        this.CONTRACT_ABI,
        this.provider
      ) as unknown as LocationRegistryContract;

      console.log('Blockchain location service initialized');
    } catch (error) {
      console.warn('Failed to initialize blockchain location service:', error);
      // Continue without blockchain - service will work in fallback mode
    }
  }

  /**
   * Initialize signer for write operations
   * In production, this would use proper key management
   */
  private async initializeSigner(): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // In development, use a known test account
      // In production, use proper wallet/key management
      const privateKey = process.env.EMERGENCY_SERVICE_PRIVATE_KEY || 
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat account #0
      
      this.signer = new ethers.Wallet(privateKey, this.provider);
      
      if (this.contract) {
        this.contract = new ethers.Contract(
          this.CONTRACT_ADDRESS,
          this.CONTRACT_ABI,
          this.signer
        ) as unknown as LocationRegistryContract;
      }
    } catch (error) {
      console.error('Failed to initialize signer:', error);
      throw error;
    }
  }

  /**
   * Generate a hash for location data to store on blockchain
   */
  private generateLocationHash(locationData: LocationAccessData['locationData'], timestamp: Date): string {
    const dataString = JSON.stringify({
      lat: locationData.lat,
      lng: locationData.lng,
      precision: locationData.precision,
      timestamp: timestamp.toISOString()
    });
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
  }

  /**
   * Convert user ID to blockchain address
   * In production, this would map to actual user wallet addresses
   */
  private userIdToAddress(userId: string): string {
    // Simple deterministic mapping for development
    // In production, you'd have a proper user-to-address mapping
    const hash = ethers.keccak256(ethers.toUtf8Bytes(userId));
    return ethers.getAddress('0x' + hash.slice(2, 42));
  }

  /**
   * Store location access hash on blockchain
   */
  async storeLocationAccessHash(data: LocationAccessData): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      // Validate input data
      const validatedData = LocationAccessSchema.parse(data);
      
      if (!this.contract) {
        throw new Error('Blockchain service not available');
      }

      // Initialize signer for write operations
      await this.initializeSigner();

      // Generate location hash
      const locationHash = this.generateLocationHash(validatedData.locationData, validatedData.timestamp);
      
      // Convert user ID to address
      const userAddress = this.userIdToAddress(validatedData.userId);

      // Store on blockchain
      const tx = await this.contract.storeLocationAccessHash(
        userAddress,
        locationHash,
        validatedData.incidentId
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Failed to store location access hash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store multiple location access hashes in a single transaction (gas optimization)
   */
  async batchStoreLocationAccessHashes(data: BatchLocationAccessData): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      // Validate input data
      const validatedData = BatchLocationAccessSchema.parse(data);
      
      if (!this.contract) {
        throw new Error('Blockchain service not available');
      }

      // Initialize signer for write operations
      await this.initializeSigner();

      // Generate hashes for all location accesses
      const locationHashes = validatedData.accessLogs.map(log => 
        this.generateLocationHash(log.locationData, log.timestamp)
      );
      
      const incidentIds = validatedData.accessLogs.map(log => log.incidentId);
      
      // Convert user ID to address
      const userAddress = this.userIdToAddress(validatedData.userId);

      // Store batch on blockchain
      const tx = await this.contract.batchStoreLocationAccessHash(
        userAddress,
        locationHashes,
        incidentIds
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Failed to batch store location access hashes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify that a location access was properly logged on blockchain
   */
  async verifyLocationAccess(
    userId: string,
    locationData: LocationAccessData['locationData'],
    timestamp: Date,
    emergencyServiceAddress: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not available');
      }

      const locationHash = this.generateLocationHash(locationData, timestamp);
      const userAddress = this.userIdToAddress(userId);

      const isVerified = await this.contract.verifyLocationAccess(
        userAddress,
        locationHash,
        emergencyServiceAddress
      );

      return {
        success: true,
        verified: isVerified
      };

    } catch (error) {
      console.error('Failed to verify location access:', error);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get location access audit trail from blockchain
   */
  async getLocationAccessAuditTrail(
    userId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{
    success: boolean;
    logs: Array<{
      locationHash: string;
      emergencyService: string;
      incidentId: string;
      timestamp: Date;
    }>;
    error?: string;
  }> {
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
        timestamp: new Date(Number(log.timestamp) * 1000) // Convert from Unix timestamp
      }));

      return {
        success: true,
        logs
      };

    } catch (error) {
      console.error('Failed to get location access audit trail:', error);
      return {
        success: false,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if an address is an authorized emergency service
   */
  async isAuthorizedEmergencyService(serviceAddress: string): Promise<{
    success: boolean;
    authorized: boolean;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not available');
      }

      const isAuthorized = await this.contract.isAuthorizedEmergencyService(serviceAddress);

      return {
        success: true,
        authorized: isAuthorized
      };

    } catch (error) {
      console.error('Failed to check emergency service authorization:', error);
      return {
        success: false,
        authorized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get blockchain connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    blockNumber?: number;
    chainId?: number;
    error?: string;
  }> {
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

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const blockchainLocationService = new BlockchainLocationService();
