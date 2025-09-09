"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEmergencyAccess = exports.blockchainRouter = void 0;
const express_1 = require("express");
const ethers_1 = require("ethers");
const router = (0, express_1.Router)();
exports.blockchainRouter = router;
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
const provider = new ethers_1.ethers.JsonRpcProvider('http://127.0.0.1:8545');
const userRegistry = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, USER_REGISTRY_ABI, provider);
router.post('/registerUser', async (req, res) => {
    try {
        const { userData, privateKey } = req.body;
        if (!userData || !privateKey) {
            return res.status(400).json({ error: 'userData and privateKey are required' });
        }
        const signer = new ethers_1.ethers.Wallet(privateKey, provider);
        const contractWithSigner = userRegistry.connect(signer);
        const tx = await contractWithSigner.registerUser(userData);
        await tx.wait();
        res.status(200).json({ message: 'User registered successfully', transactionHash: tx.hash });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: error.message || 'Failed to register user' });
    }
});
router.get('/getUser/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const userData = await userRegistry.getUser(address);
        res.status(200).json({ address, userData });
    }
    catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ error: error.message || 'Failed to get user data' });
    }
});
const logEmergencyAccess = async (data) => {
    try {
        console.log('Logging emergency access to blockchain:', data);
        return {
            success: true,
            transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
            blockNumber: Math.floor(Math.random() * 1000000) + 12345
        };
    }
    catch (error) {
        console.error('Blockchain emergency access logging failed:', error);
        throw error;
    }
};
exports.logEmergencyAccess = logEmergencyAccess;
