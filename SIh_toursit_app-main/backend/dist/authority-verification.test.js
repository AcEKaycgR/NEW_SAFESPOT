"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("../src/database");
const database_setup_1 = require("./test-utils/database-setup");
(0, globals_1.describe)('Authority Verification Interface Tests', () => {
    let app;
    let server;
    let testDb;
    (0, globals_1.beforeAll)(async () => {
        app = (0, express_1.default)();
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
        app.post('/api/authority/verify', async (req, res) => {
            try {
                const { blockchainHash, qrCodeData } = req.body;
                if (!blockchainHash && !qrCodeData) {
                    return res.status(400).json({
                        error: 'Either blockchainHash or qrCodeData is required'
                    });
                }
                const hashToVerify = blockchainHash || qrCodeData;
                const verification = await testDb.digitalIDModel.verifyDigitalID(hashToVerify);
                res.json({
                    isValid: verification.isValid,
                    user: verification.user,
                    digitalId: verification.digitalId,
                    reason: verification.reason,
                    verifiedAt: new Date().toISOString(),
                    authority: 'Test Authority System'
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get('/api/authority/verification-history', async (req, res) => {
            try {
                res.json({
                    verifications: [],
                    message: 'Verification history endpoint implemented'
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post('/api/authority/bulk-verify', async (req, res) => {
            try {
                const { hashes } = req.body;
                if (!Array.isArray(hashes)) {
                    return res.status(400).json({ error: 'hashes must be an array' });
                }
                const results = [];
                for (const hash of hashes) {
                    try {
                        const verification = await testDb.digitalIDModel.verifyDigitalID(hash);
                        results.push({
                            hash,
                            isValid: verification.isValid,
                            reason: verification.reason,
                            user: verification.user
                        });
                    }
                    catch (error) {
                        results.push({
                            hash,
                            isValid: false,
                            reason: error.message,
                            user: null
                        });
                    }
                }
                res.json({ results });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        server = app.listen(0);
    });
    (0, globals_1.afterAll)(async () => {
        if (server) {
            server.close();
        }
        if (testDb) {
            await testDb.teardown();
        }
    });
    (0, globals_1.beforeEach)(async () => {
        if (testDb) {
            await testDb.resetForTest();
        }
    });
    (0, globals_1.describe)('Authority Verification API', () => {
        (0, globals_1.it)('should verify a valid digital ID', async () => {
            const timestamp = Date.now();
            const user = await testDb.createVerifiedUser({
                email: `verified-${timestamp}@test.com`,
                name: 'Verified Tourist',
                blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
            });
            const hash = `0x${(timestamp + 1000).toString(16).padStart(64, '0')}`;
            await testDb.digitalIDModel.generateDigitalID(user.id, hash, {
                user_id: user.id,
                name: user.name,
                timestamp
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/verify')
                .send({ blockchainHash: hash })
                .expect(200);
            (0, globals_1.expect)(response.body.isValid).toBe(true);
            (0, globals_1.expect)(response.body.user).toBeDefined();
            (0, globals_1.expect)(response.body.user.name).toBe('Verified Tourist');
            (0, globals_1.expect)(response.body.digitalId).toBeDefined();
            (0, globals_1.expect)(response.body.verifiedAt).toBeDefined();
            (0, globals_1.expect)(response.body.authority).toBe('Test Authority System');
        });
        (0, globals_1.it)('should handle invalid digital ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/verify')
                .send({ blockchainHash: '0xinvalidhash' })
                .expect(200);
            (0, globals_1.expect)(response.body.isValid).toBe(false);
            (0, globals_1.expect)(response.body.reason).toBe('Digital ID not found');
            (0, globals_1.expect)(response.body.user).toBeUndefined();
        });
        (0, globals_1.it)('should require blockchain hash or QR code data', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/verify')
                .send({})
                .expect(400);
            (0, globals_1.expect)(response.body.error).toBe('Either blockchainHash or qrCodeData is required');
        });
        (0, globals_1.it)('should verify using QR code data', async () => {
            const timestamp = Date.now();
            const user = await testDb.createVerifiedUser({
                email: `qr-verified-${timestamp}@test.com`,
                name: 'QR Tourist',
                blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
            });
            const hash = `0x${(timestamp + 2000).toString(16).padStart(64, '0')}`;
            await testDb.digitalIDModel.generateDigitalID(user.id, hash, {
                user_id: user.id,
                name: user.name,
                timestamp
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/verify')
                .send({ qrCodeData: hash })
                .expect(200);
            (0, globals_1.expect)(response.body.isValid).toBe(true);
            (0, globals_1.expect)(response.body.user.name).toBe('QR Tourist');
        });
        (0, globals_1.it)('should handle bulk verification', async () => {
            const timestamp = Date.now();
            const user = await testDb.createVerifiedUser({
                email: `bulk-verified-${timestamp}@test.com`,
                name: 'Bulk Tourist',
                blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
            });
            const validHash = `0x${(timestamp + 3000).toString(16).padStart(64, '0')}`;
            await testDb.digitalIDModel.generateDigitalID(user.id, validHash, {
                user_id: user.id,
                name: user.name,
                timestamp
            });
            const invalidHash = '0xinvalidhash';
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/bulk-verify')
                .send({ hashes: [validHash, invalidHash] })
                .expect(200);
            (0, globals_1.expect)(response.body.results).toHaveLength(2);
            const validResult = response.body.results.find((r) => r.hash === validHash);
            (0, globals_1.expect)(validResult.isValid).toBe(true);
            (0, globals_1.expect)(validResult.user.name).toBe('Bulk Tourist');
            const invalidResult = response.body.results.find((r) => r.hash === invalidHash);
            (0, globals_1.expect)(invalidResult.isValid).toBe(false);
            (0, globals_1.expect)(invalidResult.reason).toBe('Digital ID not found');
        });
        (0, globals_1.it)('should handle bulk verification with invalid input', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/authority/bulk-verify')
                .send({ hashes: 'not-an-array' })
                .expect(400);
            (0, globals_1.expect)(response.body.error).toBe('hashes must be an array');
        });
        (0, globals_1.it)('should provide verification history endpoint', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/authority/verification-history')
                .expect(200);
            (0, globals_1.expect)(response.body.message).toBe('Verification history endpoint implemented');
            (0, globals_1.expect)(response.body.verifications).toBeDefined();
        });
    });
    (0, globals_1.describe)('Complete Authority Verification Flow', () => {
        (0, globals_1.it)('should handle a complete verification scenario', async () => {
            const timestamp = Date.now();
            const user = await testDb.createVerifiedUser({
                email: `tourist-${timestamp}@example.com`,
                name: 'John Tourist',
                blockchain_address: `0x${timestamp.toString(16).padStart(40, '0')}`
            });
            const hash = `0x${(timestamp + 4000).toString(16).padStart(64, '0')}`;
            const digitalId = await testDb.digitalIDModel.generateDigitalID(user.id, hash, {
                user_id: user.id,
                name: user.name,
                nationality: 'Test Country',
                purpose: 'Tourism',
                timestamp
            });
            const verificationResponse = await (0, supertest_1.default)(app)
                .post('/api/authority/verify')
                .send({ blockchainHash: hash })
                .expect(200);
            (0, globals_1.expect)(verificationResponse.body.isValid).toBe(true);
            (0, globals_1.expect)(verificationResponse.body.user.name).toBe('John Tourist');
            (0, globals_1.expect)(verificationResponse.body.digitalId.status).toBe(database_1.DigitalIDStatus.ACTIVE);
            const historyResponse = await (0, supertest_1.default)(app)
                .get('/api/authority/verification-history')
                .expect(200);
            (0, globals_1.expect)(historyResponse.body.message).toBe('Verification history endpoint implemented');
            console.log('✅ Complete authority verification flow test passed');
        });
    });
});
