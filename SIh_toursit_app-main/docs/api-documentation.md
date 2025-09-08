# SafeSpot API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All API endpoints use HTTP Bearer token authentication or blockchain signature verification.

### Headers
```http
Content-Type: application/json
Authorization: Bearer {token}  # For authenticated endpoints
```

## Endpoints

### Health Check

#### GET /health
Check API server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-31T10:30:00.000Z"
}
```

---

## Blockchain Endpoints

### Connect Wallet

#### POST /blockchain/connectWallet
Connect and verify a MetaMask wallet.

**Request Body:**
```json
{
  "address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
  "signature": "0x8f4c2c5d78b5f4e2a1b9c3d7e8f9a2b5c6d4e3f8"
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
  "isRegistered": true,
  "message": "Wallet connected successfully"
}
```

**Error Response:**
```json
{
  "error": "INVALID_SIGNATURE",
  "message": "Digital signature verification failed"
}
```

### Register User on Blockchain

#### POST /blockchain/registerUser
Register user data on the blockchain.

**Request Body:**
```json
{
  "address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
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
  "transactionHash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  "blockNumber": 18501234,
  "isRegistered": true
}
```

### Get User from Blockchain

#### GET /blockchain/getUser/{address}
Retrieve user data from blockchain.

**Parameters:**
- `address` (string): Ethereum wallet address

**Response:**
```json
{
  "success": true,
  "isRegistered": true,
  "userData": {
    "dataHash": "0x8f9e2d3c4b5a6789...",
    "timestamp": 1672531200000
  }
}
```

---

## User Management Endpoints

### Create User

#### POST /users
Create a new user in the database.

**Request Body:**
```json
{
  "email": "tourist@example.com",
  "name": "Jane Doe",
  "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b"
}
```

**Response:**
```json
{
  "id": 123,
  "email": "tourist@example.com",
  "name": "Jane Doe",
  "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
  "verification_status": "PENDING",
  "created_at": "2025-08-31T10:30:00.000Z"
}
```

### Get User by Address

#### GET /users/{address}
Retrieve user by blockchain address.

**Parameters:**
- `address` (string): Blockchain wallet address

**Response:**
```json
{
  "id": 123,
  "email": "tourist@example.com",
  "name": "Jane Doe",
  "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
  "verification_status": "VERIFIED",
  "created_at": "2025-08-31T10:30:00.000Z",
  "updated_at": "2025-08-31T10:35:00.000Z"
}
```

### Update User Verification Status

#### PUT /users/{id}/verify
Update user verification status.

**Parameters:**
- `id` (number): User ID

**Request Body:**
```json
{
  "status": "VERIFIED"
}
```

**Response:**
```json
{
  "id": 123,
  "verification_status": "VERIFIED",
  "updated_at": "2025-08-31T10:35:00.000Z"
}
```

---

## Digital ID Endpoints

### Generate Digital ID

#### POST /digital-ids
Generate a new digital ID for a verified user.

**Request Body:**
```json
{
  "userId": 123,
  "blockchainHash": "0x8f9e2d3c4b5a6789abcdef0123456789abcdef01",
  "qrCodeData": {
    "user_id": 123,
    "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
    "timestamp": 1672531200000,
    "verification_level": "tourist"
  }
}
```

**Response:**
```json
{
  "id": 456,
  "user_id": 123,
  "blockchain_hash": "0x8f9e2d3c4b5a6789abcdef0123456789abcdef01",
  "status": "ACTIVE",
  "qr_code_data": {
    "user_id": 123,
    "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
    "timestamp": 1672531200000,
    "verification_level": "tourist"
  },
  "valid_until": "2025-12-31T23:59:59.000Z",
  "created_at": "2025-08-31T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "USER_NOT_VERIFIED",
  "message": "User must be verified before generating digital ID"
}
```

### Verify Digital ID

#### POST /digital-ids/verify
Verify a digital ID using blockchain hash.

**Request Body:**
```json
{
  "blockchainHash": "0x8f9e2d3c4b5a6789abcdef0123456789abcdef01"
}
```

**Response (Valid ID):**
```json
{
  "isValid": true,
  "user": {
    "id": 123,
    "name": "Jane Doe",
    "email": "tourist@example.com",
    "verification_status": "VERIFIED"
  },
  "digitalId": {
    "id": 456,
    "status": "ACTIVE",
    "valid_until": "2025-12-31T23:59:59.000Z",
    "created_at": "2025-08-31T10:30:00.000Z"
  },
  "qrCodeData": {
    "user_id": 123,
    "blockchain_address": "0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b",
    "timestamp": 1672531200000
  }
}
```

**Response (Invalid ID):**
```json
{
  "isValid": false,
  "reason": "Digital ID not found"
}
```

### Get Active Digital IDs for User

#### GET /digital-ids/user/{userId}
Get all active digital IDs for a specific user.

**Parameters:**
- `userId` (number): User ID

**Response:**
```json
{
  "user_id": 123,
  "digital_ids": [
    {
      "id": 456,
      "blockchain_hash": "0x8f9e2d3c4b5a6789abcdef0123456789abcdef01",
      "status": "ACTIVE",
      "valid_until": "2025-12-31T23:59:59.000Z",
      "created_at": "2025-08-31T10:30:00.000Z"
    }
  ]
}
```

### Revoke Digital ID

#### PUT /digital-ids/{id}/revoke
Revoke a digital ID.

**Parameters:**
- `id` (number): Digital ID

**Response:**
```json
{
  "id": 456,
  "status": "REVOKED",
  "updated_at": "2025-08-31T11:00:00.000Z"
}
```

---

## User Profile Endpoints

### Create User Profile

#### POST /user-profiles
Create or update user profile with KYC data.

**Request Body:**
```json
{
  "user_id": 123,
  "kyc_data": {
    "document_type": "passport",
    "document_number": "P123456789",
    "issued_country": "US",
    "expiry_date": "2030-12-31"
  },
  "emergency_contacts": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "family",
      "email": "john@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "id": 789,
  "user_id": 123,
  "kyc_data": {
    "document_type": "passport",
    "document_number": "P123456789",
    "issued_country": "US",
    "expiry_date": "2030-12-31"
  },
  "emergency_contacts": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "family",
      "email": "john@example.com"
    }
  ],
  "created_at": "2025-08-31T10:30:00.000Z"
}
```

### Get User Profile

#### GET /user-profiles/{userId}
Get user profile by user ID.

**Parameters:**
- `userId` (number): User ID

**Response:**
```json
{
  "id": 789,
  "user_id": 123,
  "kyc_data": {
    "document_type": "passport",
    "document_number": "P123456789",
    "issued_country": "US",
    "expiry_date": "2030-12-31"
  },
  "emergency_contacts": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "family",
      "email": "john@example.com"
    }
  ],
  "created_at": "2025-08-31T10:30:00.000Z",
  "updated_at": "2025-08-31T10:35:00.000Z"
}
```

---

## Error Codes

### Standard HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Custom Error Codes

| Error Code | Description |
|------------|-------------|
| `WALLET_NOT_FOUND` | MetaMask or compatible wallet not detected |
| `INVALID_SIGNATURE` | Digital signature verification failed |
| `USER_NOT_FOUND` | User not found in database |
| `USER_NOT_VERIFIED` | User must be verified before operation |
| `DIGITAL_ID_NOT_FOUND` | Digital ID not found |
| `DIGITAL_ID_EXPIRED` | Digital ID has expired |
| `DIGITAL_ID_REVOKED` | Digital ID has been revoked |
| `BLOCKCHAIN_ERROR` | Blockchain transaction failed |
| `INVALID_ADDRESS` | Invalid Ethereum address format |
| `DUPLICATE_EMAIL` | Email already exists |
| `INVALID_QR_DATA` | QR code data format invalid |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error details",
    "timestamp": "2025-08-31T10:30:00.000Z"
  }
}
```

---

## Rate Limiting

### Limits
- General API calls: 100 requests per minute
- Blockchain operations: 10 requests per minute
- Digital ID verification: 50 requests per minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531260
```

---

## Authentication Flow

### 1. Wallet Connection
```
Client -> POST /blockchain/connectWallet
Server -> Verify signature
Server -> Return connection status
```

### 2. User Registration
```
Client -> POST /users (create user)
Client -> POST /blockchain/registerUser (blockchain registration)
Client -> POST /user-profiles (KYC data)
Admin -> PUT /users/{id}/verify (verify user)
```

### 3. Digital ID Generation
```
Client -> POST /digital-ids (generate ID)
Server -> Verify user status
Server -> Create blockchain hash
Server -> Return digital ID with QR code
```

### 4. ID Verification (Authority)
```
Authority -> POST /digital-ids/verify
Server -> Validate blockchain hash
Server -> Return user and ID details
```

---

## SDK Integration

### JavaScript/TypeScript

```javascript
import { ApiClient } from './api-client';

const api = new ApiClient('http://localhost:3001/api');

// Connect wallet
const connection = await api.connectWallet(address, signature);

// Generate digital ID
const digitalId = await api.generateDigitalId({
  userId: 123,
  blockchainHash: '0x...',
  qrCodeData: { ... }
});

// Verify digital ID
const verification = await api.verifyDigitalId(blockchainHash);
```

### React Integration

```tsx
import { useApiIntegration } from '@/lib/api-integration';

function MyComponent() {
  const { connectWallet, generateDigitalId, verifyDigitalId } = useApiIntegration();
  
  const handleConnect = async () => {
    try {
      const result = await connectWallet(address, signature);
      console.log('Connected:', result);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  return <button onClick={handleConnect}>Connect Wallet</button>;
}
```

---

## Testing

### Example Test Requests

```bash
# Health check
curl http://localhost:3001/health

# Connect wallet
curl -X POST http://localhost:3001/api/blockchain/connectWallet \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35cc6ba...","signature":"0x8f4c2c5..."}'

# Generate digital ID
curl -X POST http://localhost:3001/api/digital-ids \
  -H "Content-Type: application/json" \
  -d '{"userId":123,"blockchainHash":"0x8f9e2d...","qrCodeData":{...}}'

# Verify digital ID
curl -X POST http://localhost:3001/api/digital-ids/verify \
  -H "Content-Type: application/json" \
  -d '{"blockchainHash":"0x8f9e2d..."}'
```

---

## Changelog

### v1.0.0 (2025-08-31)
- Initial release of blockchain authentication API
- Wallet connection endpoints
- Digital ID generation and verification
- User management system
- Authority verification interface

### v1.1.0 (Planned)
- Multi-chain support
- Enhanced QR code features
- Batch verification operations
- Advanced analytics endpoints
