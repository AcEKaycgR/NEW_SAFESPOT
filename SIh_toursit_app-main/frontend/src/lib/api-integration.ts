// Frontend-backend integration utility functions
import { toast } from '@/hooks/use-toast';
import { baseUrl } from '@/lib/config';

// API base URL - should be from environment in production
const API_BASE_URL = baseUrl;

// Types for API responses
export interface UserData {
  id: number;
  email: string;
  name: string;
  blockchain_address?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface DigitalIdData {
  id: number;
  user_id: number;
  blockchain_hash: string;
  qr_code_data: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface BlockchainResponse {
  message: string;
  address?: string;
  transactionHash?: string;
  userData?: any;
  isRegistered?: boolean;
}

export interface VerificationResponse {
  isValid: boolean;
  user?: UserData;
  digitalId?: DigitalIdData;
  reason?: string;
}

// API client class for backend communication
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('/health');
  }

  // Blockchain API methods
  async connectWallet(address: string, signature: string): Promise<BlockchainResponse> {
    return this.makeRequest('/api/blockchain/connectWallet', {
      method: 'POST',
      body: JSON.stringify({ address, signature }),
    });
  }

  async registerUserOnBlockchain(address: string, userData: any): Promise<BlockchainResponse> {
    return this.makeRequest('/api/blockchain/registerUser', {
      method: 'POST',
      body: JSON.stringify({ address, userData }),
    });
  }

  async getUserFromBlockchain(address: string): Promise<BlockchainResponse> {
    return this.makeRequest(`/api/blockchain/getUser/${address}`);
  }

  // User API methods
  async createUser(userData: {
    email: string;
    name: string;
    blockchain_address?: string;
  }): Promise<UserData> {
    return this.makeRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserByAddress(address: string): Promise<UserData> {
    return this.makeRequest(`/api/users/${address}`);
  }

  // Digital ID API methods
  async generateDigitalId(data: {
    userId: number;
    blockchainHash: string;
    qrCodeData: any;
  }): Promise<DigitalIdData> {
    return this.makeRequest('/api/digital-ids', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyDigitalId(blockchainHash: string): Promise<VerificationResponse> {
    return this.makeRequest('/api/digital-ids/verify', {
      method: 'POST',
      body: JSON.stringify({ blockchainHash }),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Higher-level integration functions that combine multiple API calls
export class BlockchainIntegrationService {
  public api: ApiClient; // Make api public for access

  constructor(apiClientInstance: ApiClient = new ApiClient()) {
    this.api = apiClientInstance;
  }

  /**
   * Complete user registration flow:
   * 1. Connect wallet
   * 2. Create user in database
   * 3. Register on blockchain
   * 4. Generate digital ID after verification
   */
  async registerTourist(userData: {
    email: string;
    name: string;
    walletAddress: string;
    signature: string;
  }): Promise<{
    user: UserData;
    blockchainRegistration: BlockchainResponse;
    walletConnection: BlockchainResponse;
  }> {
    try {
      // Step 1: Connect wallet
      const walletConnection = await this.api.connectWallet(
        userData.walletAddress, 
        userData.signature
      );

      // Step 2: Create user in database
      const user = await this.api.createUser({
        email: userData.email,
        name: userData.name,
        blockchain_address: userData.walletAddress,
      });

      // Step 3: Register on blockchain
      const blockchainData = JSON.stringify({
        userId: user.id,
        email: userData.email,
        timestamp: Date.now(),
      });

      const blockchainRegistration = await this.api.registerUserOnBlockchain(
        userData.walletAddress,
        blockchainData
      );

      return {
        user,
        blockchainRegistration,
        walletConnection,
      };
    } catch (error) {
      console.error('Registration flow failed:', error);
      throw error;
    }
  }

  /**
   * Generate digital ID for verified user
   */
  async generateDigitalIdentity(
    userId: number, 
    blockchainAddress: string
  ): Promise<DigitalIdData> {
    try {
      // Generate unique blockchain hash
      const blockchainHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`.substring(0, 66);
      
      // Create QR code data
      const qrCodeData = {
        user_id: userId,
        blockchain_address: blockchainAddress,
        timestamp: Date.now(),
        verification_level: 'tourist',
      };

      return await this.api.generateDigitalId({
        userId,
        blockchainHash,
        qrCodeData,
      });
    } catch (error) {
      console.error('Digital ID generation failed:', error);
      throw error;
    }
  }

  /**
   * Verify a digital ID from QR code or blockchain hash
   */
  async verifyTouristIdentity(blockchainHash: string): Promise<VerificationResponse> {
    try {
      return await this.api.verifyDigitalId(blockchainHash);
    } catch (error) {
      console.error('Identity verification failed:', error);
      throw error;
    }
  }

  /**
   * Check if user exists and is registered
   */
  async checkUserStatus(walletAddress: string): Promise<{
    userExists: boolean;
    blockchainRegistered: boolean;
    user?: UserData;
    blockchainData?: BlockchainResponse;
  }> {
    try {
      // Check database
      let user: UserData | undefined;
      let userExists = false;
      
      try {
        user = await this.api.getUserByAddress(walletAddress);
        userExists = true;
      } catch (error) {
        // User doesn't exist in database
        userExists = false;
      }

      // Check blockchain
      let blockchainData: BlockchainResponse | undefined;
      let blockchainRegistered = false;
      
      try {
        blockchainData = await this.api.getUserFromBlockchain(walletAddress);
        blockchainRegistered = blockchainData.isRegistered || false;
      } catch (error) {
        // Not registered on blockchain
        blockchainRegistered = false;
      }

      return {
        userExists,
        blockchainRegistered,
        user,
        blockchainData,
      };
    } catch (error) {
      console.error('User status check failed:', error);
      throw error;
    }
  }
}

// Create singleton service instance
export const blockchainService = new BlockchainIntegrationService();

// React hooks for frontend integration
export function useApiIntegration() {
  const handleApiError = (error: Error, context: string) => {
    console.error(`${context}:`, error);
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  };

  const handleApiSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  };

  return {
    apiClient,
    blockchainService,
    handleApiError,
    handleApiSuccess,
  };
}
