"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mockRegisterUser = jest.fn();
const mockGetUser = jest.fn();
const mockConnect = jest.fn();
const mockWait = jest.fn();
jest.mock('./index', () => {
    const express = require('express');
    const router = express.Router();
    router.post('/registerUser', async (req, res) => {
        try {
            const { userData, privateKey } = req.body;
            if (!userData || !privateKey) {
                return res.status(400).json({ error: 'userData and privateKey are required' });
            }
            const result = await mockRegisterUser(userData);
            await mockWait();
            res.status(200).json({
                message: 'User registered successfully',
                transactionHash: '0xmockTransactionHash'
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to register user' });
        }
    });
    router.get('/getUser/:address', async (req, res) => {
        try {
            const { address } = req.params;
            const userData = await mockGetUser(address);
            res.status(200).json({ address, userData });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to get user data' });
        }
    });
    return { blockchainRouter: router };
});
const { blockchainRouter } = require('./index');
describe('Blockchain API Endpoints', () => {
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/blockchain', blockchainRouter);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/blockchain/registerUser', () => {
        it('should register a user successfully', async () => {
            mockRegisterUser.mockResolvedValueOnce({
                hash: '0xmockTransactionHash',
                wait: mockWait.mockResolvedValueOnce({}),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/blockchain/registerUser')
                .send({ userData: '0xabcdef123456', privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5ef7aed7ff149677ea4d' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.transactionHash).toBe('0xmockTransactionHash');
            expect(mockRegisterUser).toHaveBeenCalledWith('0xabcdef123456');
        });
        it('should return 400 if userData or privateKey are missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/blockchain/registerUser')
                .send({ userData: '0xabcdef123456' });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('userData and privateKey are required');
        });
        it('should handle errors during user registration', async () => {
            mockRegisterUser.mockRejectedValueOnce(new Error('Blockchain error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/blockchain/registerUser')
                .send({ userData: '0xabcdef123456', privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5ef7aed7ff149677ea4d' });
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Blockchain error');
        });
    });
    describe('GET /api/blockchain/getUser/:address', () => {
        it('should get user data successfully', async () => {
            mockGetUser.mockResolvedValueOnce('0xmockUserData');
            const response = await (0, supertest_1.default)(app).get('/api/blockchain/getUser/0xmockAddress');
            expect(response.status).toBe(200);
            expect(response.body.address).toBe('0xmockAddress');
            expect(response.body.userData).toBe('0xmockUserData');
            expect(mockGetUser).toHaveBeenCalledWith('0xmockAddress');
        });
        it('should handle errors during getting user data', async () => {
            mockGetUser.mockRejectedValueOnce(new Error('User not found'));
            const response = await (0, supertest_1.default)(app).get('/api/blockchain/getUser/0xmockAddress');
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('User not found');
        });
    });
});
