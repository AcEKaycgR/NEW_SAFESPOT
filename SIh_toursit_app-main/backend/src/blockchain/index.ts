import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

// Hardcoded for now, should be from config or env
const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const USER_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "getUser",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Initialize provider and signer (for local development)
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
// You might need a signer if you're sending transactions
// const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

// Initialize contract instance
const userRegistry = new ethers.Contract(CONTRACT_ADDRESS, USER_REGISTRY_ABI, provider) as any;

router.post('/registerUser', async (req, res) => {
  try {
    const { userData, privateKey } = req.body; // userData should be a hex string, privateKey for signing

    if (!userData || !privateKey) {
      return res.status(400).json({ error: 'userData and privateKey are required' });
    }

    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = userRegistry.connect(signer);

    const tx = await contractWithSigner.registerUser(userData);
    await tx.wait(); // Wait for the transaction to be mined

    res.status(200).json({ message: 'User registered successfully', transactionHash: tx.hash });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

router.get('/getUser/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const userData = await userRegistry.getUser(address);
    res.status(200).json({ address, userData });
  } catch (error: any) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: error.message || 'Failed to get user data' });
  }
});

export { router as blockchainRouter };

// Emergency access logging function (for service use)
export const logEmergencyAccess = async (data: {
  userId: string;
  serviceId: string;
  operatorId: string;
  incidentId: string;
  timestamp: Date;
  accessGranted: boolean;
}) => {
  try {
    // For now, just simulate blockchain logging
    // In a real implementation, this would interact with a smart contract
    console.log('Logging emergency access to blockchain:', data);
    
    // Simulate successful blockchain transaction
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Fake transaction hash
      blockNumber: Math.floor(Math.random() * 1000000) + 12345
    };
  } catch (error) {
    console.error('Blockchain emergency access logging failed:', error);
    throw error;
  }
};
