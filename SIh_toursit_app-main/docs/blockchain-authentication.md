# Blockchain Authentication & Digital ID System

## Overview

The SafeSpot platform implements a secure blockchain-based authentication system that issues tamper-proof digital IDs to tourists. This system provides secure identity verification and data storage throughout the tourist's visit.

## Architecture

### Components

1. **Frontend Components** (`frontend/src/components/blockchain/`)
   - `WalletConnection` - MetaMask wallet integration
   - `DigitalIDDisplay` - Digital ID management and display
   - `DigitalIDDisplayEnhanced` - Advanced ID features with QR codes
   - `DigitalIDVerifier` - Authority verification interface

2. **Backend APIs** (`backend/src/`)
   - Blockchain integration endpoints
   - Digital ID generation and verification
   - Authority verification system
   - Database integration layer

3. **Smart Contracts** (`smart-contracts/`)
   - User registration contract
   - Digital identity management
   - Ethereum blockchain integration

4. **Database Models** (`backend/src/database/`)
   - User management with blockchain addresses
   - Digital ID storage and lifecycle
   - User profile and KYC data

## Features

### 🔐 Secure Wallet Authentication
- **MetaMask Integration**: Connect Ethereum-compatible wallets
- **Digital Signatures**: Cryptographic verification of user identity
- **Secure Key Management**: Private keys never leave user's wallet

### 🆔 Digital Identity Management
- **Blockchain-Backed IDs**: Tamper-proof identity certificates
- **QR Code Generation**: Easy scanning for verification
- **Expiration Management**: Time-limited validity periods
- **Status Tracking**: Active, expired, and revoked states

### 👮 Authority Verification
- **Real-time Verification**: Instant ID validation
- **Comprehensive Data**: User details, verification status, and profile
- **Authority Interface**: Dedicated verification dashboard
- **Audit Trail**: Complete verification history

### 🛡️ Privacy & Security
- **Hashed Data Storage**: Sensitive information protected
- **Minimal Data Exposure**: Only necessary information shared
- **Secure Transmission**: Encrypted API communications
- **Access Control**: Role-based permissions

## API Reference

### Authentication Endpoints

#### Connect Wallet
```http
POST /api/blockchain/connectWallet
Content-Type: application/json

{
  "address": "0x742d35cc6ba...",
  "signature": "0x8f4c2c5..."
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x742d35cc6ba...",
  "isRegistered": true
}
```

#### Register User on Blockchain
```http
POST /api/blockchain/registerUser
Content-Type: application/json

{
  "address": "0x742d35cc6ba...",
  "userData": {
    "userId": 123,
    "email": "tourist@example.com",
    "timestamp": 1672531200000
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x1a2b3c...",
  "blockNumber": 18501234
}
```

### Digital ID Endpoints

#### Generate Digital ID
```http
POST /api/digital-ids
Content-Type: application/json

{
  "userId": 123,
  "blockchainHash": "0x8f9e2d...",
  "qrCodeData": {
    "user_id": 123,
    "blockchain_address": "0x742d35cc6ba...",
    "timestamp": 1672531200000
  }
}
```

**Response:**
```json
{
  "id": 456,
  "blockchain_hash": "0x8f9e2d...",
  "status": "ACTIVE",
  "valid_until": "2024-01-01T00:00:00.000Z",
  "qr_code_data": { ... }
}
```

#### Verify Digital ID
```http
POST /api/digital-ids/verify
Content-Type: application/json

{
  "blockchainHash": "0x8f9e2d..."
}
```

**Response:**
```json
{
  "isValid": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "verification_status": "VERIFIED"
  },
  "digitalId": {
    "id": 456,
    "status": "ACTIVE",
    "valid_until": "2024-01-01T00:00:00.000Z"
  }
}
```

### User Management Endpoints

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "email": "tourist@example.com",
  "name": "Jane Doe",
  "blockchain_address": "0x742d35cc6ba..."
}
```

#### Get User by Address
```http
GET /api/users/0x742d35cc6ba...
```

## Frontend Integration

### Wallet Connection Component

```tsx
import { WalletConnection } from '@/components/blockchain/wallet-connection';

function LoginPage() {
  const handleWalletConnected = (address: string, signature: string) => {
    console.log('Wallet connected:', address);
    // Handle successful connection
  };

  return (
    <WalletConnection 
      onWalletConnected={handleWalletConnected}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Digital ID Display Component

```tsx
import { DigitalIDDisplayEnhanced } from '@/components/blockchain/digital-id-display-enhanced';

function TouristDashboard() {
  return (
    <DigitalIDDisplayEnhanced
      userAddress="0x742d35cc6ba..."
      userId={123}
      onGenerateDigitalId={(id) => console.log('Generated:', id)}
      autoLoad={true}
    />
  );
}
```

### Authority Verification Component

```tsx
import { DigitalIDVerifier } from '@/components/blockchain/digital-id-verifier';

function AuthorityDashboard() {
  return (
    <DigitalIDVerifier
      onVerificationComplete={(result) => {
        if (result.isValid) {
          console.log('Valid ID for user:', result.user.name);
        }
      }}
    />
  );
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  blockchain_address TEXT UNIQUE,
  verification_status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Digital IDs Table
```sql
CREATE TABLE digital_ids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  blockchain_hash TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  qr_code_data TEXT,
  valid_until DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  kyc_data TEXT,
  emergency_contacts TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Smart Contract Integration

### UserRegistry Contract

The system uses a Solidity smart contract for decentralized user registration:

```solidity
contract UserRegistry {
    struct User {
        string dataHash;
        bool isRegistered;
        uint256 timestamp;
    }
    
    mapping(address => User) public users;
    
    function registerUser(string memory _dataHash) public {
        users[msg.sender] = User(_dataHash, true, block.timestamp);
    }
    
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
}
```

## Security Considerations

### Data Protection
- **Hashed Storage**: Sensitive data stored as cryptographic hashes
- **Minimal Exposure**: Only necessary data transmitted
- **Encryption**: All API communications use HTTPS
- **Private Key Security**: Keys never leave user's wallet

### Access Control
- **Role-Based Permissions**: Different access levels for tourists vs authorities
- **Signature Verification**: All operations require valid digital signatures
- **Time-Limited Tokens**: Expiring authentication tokens
- **Audit Logging**: Complete verification history tracking

### Blockchain Security
- **Immutable Records**: Blockchain provides tamper-proof storage
- **Decentralized Verification**: No single point of failure
- **Smart Contract Validation**: Automated verification logic
- **Transaction Transparency**: Public verification of all operations

## Error Handling

### Common Error Scenarios

1. **Wallet Not Found**
   ```json
   {
     "error": "WALLET_NOT_FOUND",
     "message": "MetaMask or compatible wallet not detected"
   }
   ```

2. **Invalid Signature**
   ```json
   {
     "error": "INVALID_SIGNATURE",
     "message": "Digital signature verification failed"
   }
   ```

3. **User Not Verified**
   ```json
   {
     "error": "USER_NOT_VERIFIED",
     "message": "User must be verified before generating digital ID"
   }
   ```

4. **Expired Digital ID**
   ```json
   {
     "error": "DIGITAL_ID_EXPIRED",
     "message": "Digital ID has expired and needs renewal"
   }
   ```

## Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd smart-contracts
npx hardhat test
```

### Test Coverage

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **End-to-End Tests**: Complete user flow testing
- **Smart Contract Tests**: Blockchain functionality testing

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL or SQLite database
- Ethereum network access (mainnet, testnet, or local)
- Environment variables configured

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/safespot

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
SMART_CONTRACT_ADDRESS=0x742d35cc6ba...

# API Keys
GOOGLE_AI_API_KEY=your-google-ai-key
```

### Deployment Steps

1. **Database Setup**
   ```bash
   npx prisma migrate deploy
   ```

2. **Smart Contract Deployment**
   ```bash
   cd smart-contracts
   npx hardhat run scripts/deploy.js --network mainnet
   ```

3. **Backend Deployment**
   ```bash
   cd backend
   npm run build
   npm start
   ```

4. **Frontend Deployment**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

## Monitoring & Maintenance

### Health Checks
- API endpoint health monitoring
- Database connection verification
- Blockchain network connectivity
- Smart contract function availability

### Maintenance Tasks
- Digital ID expiration cleanup
- Database optimization
- Log rotation
- Security updates

## Support & Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check network connection
   - Verify correct Ethereum network selected

2. **Digital ID Generation Failed**
   - Confirm user verification status
   - Check blockchain network connectivity
   - Verify smart contract deployment

3. **Verification Not Working**
   - Validate QR code data format
   - Check digital ID expiration status
   - Ensure authority permissions

### Getting Help

- Check the [troubleshooting guide](./troubleshooting.md)
- Review API documentation for error codes
- Contact development team for technical support

## License

This blockchain authentication system is part of the SafeSpot Tourist Safety Application. All rights reserved.
