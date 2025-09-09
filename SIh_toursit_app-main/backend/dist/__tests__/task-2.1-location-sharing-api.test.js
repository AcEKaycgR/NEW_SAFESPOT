"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_setup_1 = require("../test-utils/database-setup");
const location_controller_1 = require("../controllers/location.controller");
const location_auth_middleware_1 = require("../middleware/location-auth.middleware");
const location_1 = require("../types/location");
describe('Task 2.1: Location Sharing API Endpoints', () => {
    let testDb;
    let controller;
    let testUserId;
    let testUser2Id;
    beforeAll(async () => {
        testDb = new database_setup_1.TestDatabaseSetup();
        await testDb.setup();
        controller = new location_controller_1.LocationController();
    });
    afterAll(async () => {
        await testDb.teardown();
    });
    beforeEach(async () => {
        const testUser1 = await testDb.createTestUser({
            email: 'user1@test.com',
            name: 'Test User 1'
        });
        testUserId = testUser1.id;
        const testUser2 = await testDb.createTestUser({
            email: 'user2@test.com',
            name: 'Test User 2'
        });
        testUser2Id = testUser2.id;
    });
    afterEach(async () => {
        await testDb.forceCleanup();
    });
    describe('POST /api/location/share - Create Location Share', () => {
        it('should create location share with valid data', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false,
                    allowedAccessors: ['friend1', 'friend2']
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: expect.any(Number),
                    precision: 'STREET',
                    emergency_override: false,
                    user_id: testUserId
                })
            }));
        });
        it('should require authentication', async () => {
            const mockReq = {
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not authenticated'
            });
        });
        it('should validate request body', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.stringContaining('Validation error')
            }));
        });
        it('should handle all precision levels', async () => {
            const precisionLevels = [
                location_1.LocationPrecision.EXACT,
                location_1.LocationPrecision.STREET,
                location_1.LocationPrecision.NEIGHBORHOOD,
                location_1.LocationPrecision.CITY
            ];
            for (const precision of precisionLevels) {
                const mockReq = {
                    user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                    body: {
                        precision: precision,
                        expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        emergencyOverride: false
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };
                await controller.createLocationShare(mockReq, mockRes);
                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        precision: precision.toUpperCase()
                    })
                }));
            }
        });
        it('should handle emergency override flag', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.EXACT,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: true
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    emergency_override: true
                })
            }));
        });
    });
    describe('GET /api/location/share/:id - Get Location Share', () => {
        it('should retrieve location share by ID', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const locationShareId = createRes.json.mock.calls[0][0].data.id;
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: locationShareId,
                    user_id: testUserId
                })
            }));
        });
        it('should require authentication', async () => {
            const mockReq = {
                params: { id: '123' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not authenticated'
            });
        });
        it('should return 404 for non-existent location share', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: '99999' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Location share not found'
            });
        });
        it('should handle invalid ID format', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: 'invalid-id' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid location share ID'
            });
        });
    });
    describe('PUT /api/location/share/:id - Update Location Share', () => {
        it('should update location share with valid data', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const locationShareId = createRes.json.mock.calls[0][0].data.id;
            const updateReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() },
                body: {
                    precision: location_1.LocationPrecision.CITY,
                    emergencyOverride: true
                }
            };
            const updateRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.updateLocationShare(updateReq, updateRes);
            expect(updateRes.status).toHaveBeenCalledWith(200);
            expect(updateRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: locationShareId,
                    precision: 'CITY',
                    emergency_override: true
                })
            }));
        });
        it('should require authentication', async () => {
            const mockReq = {
                params: { id: '123' },
                body: { precision: location_1.LocationPrecision.CITY }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.updateLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
        it('should return 404 for non-existent location share', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: '99999' },
                body: { precision: location_1.LocationPrecision.CITY }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.updateLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
        it('should handle partial updates', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const locationShareId = createRes.json.mock.calls[0][0].data.id;
            const updateReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() },
                body: { precision: location_1.LocationPrecision.NEIGHBORHOOD }
            };
            const updateRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.updateLocationShare(updateReq, updateRes);
            expect(updateRes.status).toHaveBeenCalledWith(200);
            expect(updateRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    precision: 'NEIGHBORHOOD'
                })
            }));
        });
    });
    describe('DELETE /api/location/share/:id - Delete Location Share', () => {
        it('should delete location share by ID', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const locationShareId = createRes.json.mock.calls[0][0].data.id;
            const deleteReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() }
            };
            const deleteRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.deleteLocationShare(deleteReq, deleteRes);
            expect(deleteRes.status).toHaveBeenCalledWith(200);
            expect(deleteRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Location share deleted'
            });
        });
        it('should require authentication', async () => {
            const mockReq = {
                params: { id: '123' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.deleteLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
        it('should return 404 for non-existent location share', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: '99999' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.deleteLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
    describe('GET /api/location/user/:userId/shares - Get User Location Shares', () => {
        it('should get all location shares for a user', async () => {
            for (let i = 0; i < 3; i++) {
                const createReq = {
                    user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                    body: {
                        precision: location_1.LocationPrecision.STREET,
                        expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        emergencyOverride: false
                    }
                };
                const createRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };
                await controller.createLocationShare(createReq, createRes);
            }
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { userId: testUserId.toString() },
                query: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getUserLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        user_id: testUserId
                    })
                ])
            }));
        });
        it('should support pagination', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { userId: testUserId.toString() },
                query: { limit: '5', offset: '0' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getUserLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
        it('should require authentication', async () => {
            const mockReq = {
                params: { user: { id: testUserId, email: 'test@example.com', name: 'Test User' } },
                query: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getUserLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });
    describe('GET /api/location/active - Get Active Location Shares', () => {
        it('should get only active (non-expired) location shares', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                query: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getActiveLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.any(Array)
            }));
        });
        it('should support filtering by precision', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                query: { precision: 'street' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getActiveLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
        it('should require authentication', async () => {
            const mockReq = {
                query: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getActiveLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
        it('should support pagination', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                query: { limit: '10', offset: '0' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getActiveLocationShares(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
    describe('LocationAuthMiddleware - Authentication', () => {
        it('should authenticate valid Bearer token', async () => {
            const mockReq = {
                headers: {
                    authorization: 'Bearer 123:test@example.com:Test'
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();
            await location_auth_middleware_1.LocationAuthMiddleware.authenticateToken(mockReq, mockRes, mockNext);
            expect(mockReq.user).toEqual({
                id: 123,
                email: 'test@example.com',
                name: 'Test'
            });
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject request without authorization header', async () => {
            const mockReq = {
                headers: {}
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();
            await location_auth_middleware_1.LocationAuthMiddleware.authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject malformed Bearer token', async () => {
            const mockReq = {
                headers: {
                    authorization: 'InvalidFormat'
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();
            await location_auth_middleware_1.LocationAuthMiddleware.authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject invalid token content', async () => {
            const mockReq = {
                headers: {
                    authorization: 'Bearer invalidtoken'
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();
            await location_auth_middleware_1.LocationAuthMiddleware.authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('Error Handling & Edge Cases', () => {
        it('should handle malformed request data gracefully', async () => {
            const mockReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: 'invalid-precision',
                    expiresAt: 'invalid-date'
                }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.stringContaining('Validation error')
            }));
        });
        it('should handle expired location shares correctly', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() - 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            const activeReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                query: {}
            };
            const activeRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getActiveLocationShares(activeReq, activeRes);
            expect(activeRes.status).toHaveBeenCalledWith(200);
            const responseData = activeRes.json.mock.calls[0][0].data;
            expect(Array.isArray(responseData)).toBe(true);
        });
    });
    describe('Integration Scenarios', () => {
        it('should handle complete CRUD workflow', async () => {
            const createReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false,
                    allowedAccessors: ['friend1']
                }
            };
            const createRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(createReq, createRes);
            expect(createRes.status).toHaveBeenCalledWith(201);
            const locationShareId = createRes.json.mock.calls[0][0].data.id;
            const readReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() }
            };
            const readRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(readReq, readRes);
            expect(readRes.status).toHaveBeenCalledWith(200);
            const updateReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() },
                body: { precision: location_1.LocationPrecision.CITY }
            };
            const updateRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.updateLocationShare(updateReq, updateRes);
            expect(updateRes.status).toHaveBeenCalledWith(200);
            const deleteReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() }
            };
            const deleteRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.deleteLocationShare(deleteReq, deleteRes);
            expect(deleteRes.status).toHaveBeenCalledWith(200);
        });
        it('should handle multi-user privacy scenarios', async () => {
            const user1CreateReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                body: {
                    precision: location_1.LocationPrecision.STREET,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    emergencyOverride: false
                }
            };
            const user1CreateRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.createLocationShare(user1CreateReq, user1CreateRes);
            expect(user1CreateRes.status).toHaveBeenCalledWith(201);
            const locationShareId = user1CreateRes.json.mock.calls[0][0].data.id;
            const user1GetReq = {
                user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
                params: { id: locationShareId.toString() }
            };
            const user1GetRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(user1GetReq, user1GetRes);
            expect(user1GetRes.status).toHaveBeenCalledWith(200);
            const user2GetReq = {
                user: { id: testUser2Id, email: 'test2@example.com', name: 'Test User 2' },
                params: { id: locationShareId.toString() }
            };
            const user2GetRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await controller.getLocationShare(user2GetReq, user2GetRes);
            expect([404, 403]).toContain(user2GetRes.status.mock.calls[0][0]);
        });
    });
});
