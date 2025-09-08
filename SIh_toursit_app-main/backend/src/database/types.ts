// Database types and enums for blockchain authentication

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export enum DigitalIDStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export interface User {
  id: number;
  email: string;
  name: string;
  blockchain_address?: string;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: number;
  user_id: number;
  kyc_data: {
    document_type?: string;
    document_number?: string;
    issued_country?: string;
    expiry_date?: string;
    [key: string]: any;
  };
  emergency_contacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  created_at: Date;
  updated_at: Date;
  user?: User; // For joined queries
}

export interface DigitalID {
  id: number;
  user_id: number;
  blockchain_hash: string;
  qr_code_data: string;
  valid_from: Date;
  valid_until: Date;
  status: DigitalIDStatus;
  created_at: Date;
  user?: User; // For joined queries
}

export interface CreateUserData {
  email: string;
  name: string;
  blockchain_address?: string;
  verification_status?: VerificationStatus;
}

export interface CreateUserProfileData {
  user_id: number;
  kyc_data: any;
  emergency_contacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface CreateDigitalIDData {
  user_id: number;
  blockchain_hash: string;
  qr_code_data: string;
  valid_from: Date;
  valid_until: Date;
  status: DigitalIDStatus;
}
