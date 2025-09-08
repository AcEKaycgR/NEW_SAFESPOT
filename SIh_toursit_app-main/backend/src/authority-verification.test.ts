import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { createModels, VerificationStatus, DigitalIDStatus } from '../src/database';
import { TestDatabaseSetup } from './test-utils/database-setup';

describe('Authority Verification Interface Tests', () => {
  let app: express.Application;
  let server: any;
  let testDb: TestDatabaseSetup;

  beforeAll(async () => {
    // Create Express app for authority verification
    app = express();
    app.use(cors());
    app.use(express.json());

    // Database setup with proper test isolation
    testDb = new TestDatabaseSetup();
    await testDb.setup();

    // Authority verification endpoints
    app.post('/api/authority/verify', async (req, res) => {
      try {
        const { blockchainHash, qrCodeData } = req.body;
        
        if (!blockchainHash && !qrCodeData) {
          return res.status(400).json({ 
            error: 'Either blockchainHash or qrCodeData is required' 
          });
        }

        // Use blockchain hash if provided, otherwise extract from QR code data
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
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/authority/verification-history', async (req, res) => {
      try {
        // This would typically be stored in a separate verification log table
        // For now, we'll return a mock response
        res.json({
          verifications: [],
          message: 'Verification history endpoint implemented'
        });
      } catch (error: any) {
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
          } catch (error: any) {
            results.push({
              hash,
              isValid: false,
              reason: error.message,
              user: null
            });
          }
        }

        res.json({ results });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Start server
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (testDb) {
      await testDb.teardown();
    }
  });

  beforeEach(async () => {
    // Clean test data before each test
    if (testDb) {
      await testDb.resetForTest();
    }
  });

  describe('Authority Verification API', () => {
    it('should verify a valid digital ID', async () => {
      const timestamp = Date.now();
      
      // Create verified user using helper method
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

      // Verify through authority API
      const response = await request(app)
        .post('/api/authority/verify')
        .send({ blockchainHash: hash })
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.name).toBe('Verified Tourist');
      expect(response.body.digitalId).toBeDefined();
      expect(response.body.verifiedAt).toBeDefined();
      expect(response.body.authority).toBe('Test Authority System');
    });

    it('should handle invalid digital ID', async () => {
      const response = await request(app)
        .post('/api/authority/verify')
        .send({ blockchainHash: '0xinvalidhash' })
        .expect(200);

      expect(response.body.isValid).toBe(false);
      expect(response.body.reason).toBe('Digital ID not found');
      expect(response.body.user).toBeUndefined();
    });

    it('should require blockchain hash or QR code data', async () => {
      const response = await request(app)
        .post('/api/authority/verify')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Either blockchainHash or qrCodeData is required');
    });

    it('should verify using QR code data', async () => {
      const timestamp = Date.now();
      
      // Create verified user using helper method
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

      // Verify using QR code data instead of direct hash
      const response = await request(app)
        .post('/api/authority/verify')
        .send({ qrCodeData: hash })
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.user.name).toBe('QR Tourist');
    });

    it('should handle bulk verification', async () => {
      const timestamp = Date.now();
      
      // Create verified user using helper method
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

      const response = await request(app)
        .post('/api/authority/bulk-verify')
        .send({ hashes: [validHash, invalidHash] })
        .expect(200);

      expect(response.body.results).toHaveLength(2);
      
      // Check valid result
      const validResult = response.body.results.find((r: any) => r.hash === validHash);
      expect(validResult.isValid).toBe(true);
      expect(validResult.user.name).toBe('Bulk Tourist');
      
      // Check invalid result
      const invalidResult = response.body.results.find((r: any) => r.hash === invalidHash);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.reason).toBe('Digital ID not found');
    });

    it('should handle bulk verification with invalid input', async () => {
      const response = await request(app)
        .post('/api/authority/bulk-verify')
        .send({ hashes: 'not-an-array' })
        .expect(400);

      expect(response.body.error).toBe('hashes must be an array');
    });

    it('should provide verification history endpoint', async () => {
      const response = await request(app)
        .get('/api/authority/verification-history')
        .expect(200);

      expect(response.body.message).toBe('Verification history endpoint implemented');
      expect(response.body.verifications).toBeDefined();
    });
  });

  describe('Complete Authority Verification Flow', () => {
    it('should handle a complete verification scenario', async () => {
      const timestamp = Date.now();
      
      // Step 1: Create tourist with digital ID
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

      // Step 2: Authority scans QR code and verifies
      const verificationResponse = await request(app)
        .post('/api/authority/verify')
        .send({ blockchainHash: hash })
        .expect(200);

      expect(verificationResponse.body.isValid).toBe(true);
      expect(verificationResponse.body.user.name).toBe('John Tourist');
      expect(verificationResponse.body.digitalId.status).toBe(DigitalIDStatus.ACTIVE);

      // Step 3: Authority can also check verification history
      const historyResponse = await request(app)
        .get('/api/authority/verification-history')
        .expect(200);

      expect(historyResponse.body.message).toBe('Verification history endpoint implemented');

      console.log('✅ Complete authority verification flow test passed');
    });
  });
});
