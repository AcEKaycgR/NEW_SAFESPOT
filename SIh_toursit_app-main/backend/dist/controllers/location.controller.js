"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationController = exports.LocationController = void 0;
const location_queries_1 = require("../database/location-queries");
const location_1 = require("../schemas/location");
class LocationController {
    async createLocationShare(req, res) {
        try {
            const validation = location_1.CreateLocationSharingSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    error: `Validation error: ${validation.error.issues.map((i) => i.message).join(', ')}`
                });
                return;
            }
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const userIdInt = userId;
            if (isNaN(userIdInt)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const shareData = {
                userId: userIdInt,
                precision: validation.data.precision,
                expiresAt: new Date(validation.data.expiresAt),
                emergencyOverride: validation.data.emergencyOverride,
                allowedAccessors: validation.data.allowedAccessors
            };
            const locationShare = await location_queries_1.locationQueries.createLocationSharing(shareData);
            res.status(201).json({
                success: true,
                data: locationShare
            });
        }
        catch (error) {
            console.error('Error creating location share:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async toggleLocationSharing(req, res) {
        try {
            console.log('Toggle sharing called with body:', req.body);
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const { action } = req.body;
            console.log('Action:', action, 'UserId:', userId);
            if (!action || !['start', 'stop'].includes(action)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid action. Must be "start" or "stop"'
                });
                return;
            }
            if (action === 'start') {
                const existingShare = await location_queries_1.locationQueries.getActiveLocationSharing(userId);
                if (existingShare) {
                    res.status(200).json({
                        success: true,
                        message: 'Location sharing already active',
                        data: existingShare
                    });
                    return;
                }
                try {
                    console.log('Attempting to ensure user exists:', userId);
                    const user = await location_queries_1.locationQueries.ensureUserExists(userId, 'test@example.com', 'TestUser');
                    console.log('User ensured:', user);
                }
                catch (error) {
                    console.error('User creation/check failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to create or verify user'
                    });
                    return;
                }
                console.log('About to create location sharing for user:', userId);
                const defaultExpiry = new Date();
                defaultExpiry.setHours(defaultExpiry.getHours() + 4);
                const newShare = await location_queries_1.locationQueries.createLocationSharing({
                    userId: userId,
                    precision: 'street',
                    expiresAt: defaultExpiry,
                    emergencyOverride: true,
                    allowedAccessors: []
                });
                res.status(201).json({
                    success: true,
                    message: 'Location sharing started',
                    data: newShare
                });
            }
            else {
                const activeShare = await location_queries_1.locationQueries.getActiveLocationSharing(userId);
                if (!activeShare) {
                    res.status(200).json({
                        success: true,
                        message: 'No active location sharing to stop'
                    });
                    return;
                }
                const updatedShare = await location_queries_1.locationQueries.updateLocationSharing(activeShare.id, {
                    status: 'DISABLED'
                });
                res.status(200).json({
                    success: true,
                    message: 'Location sharing stopped',
                    data: updatedShare
                });
            }
        }
        catch (error) {
            console.error('Error toggling location sharing:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async getLocationShare(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const { id } = req.params;
            const locationId = parseInt(id);
            if (isNaN(locationId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid location share ID'
                });
                return;
            }
            const locationShare = await location_queries_1.locationQueries.getLocationSharing(locationId);
            if (!locationShare) {
                res.status(404).json({
                    success: false,
                    error: 'Location share not found'
                });
                return;
            }
            const currentUserId = req.user.id;
            const shareOwnerId = locationShare.user_id;
            let hasAccess = false;
            if (currentUserId === shareOwnerId) {
                hasAccess = true;
            }
            else {
                try {
                    const allowedAccessors = locationShare.allowed_accessors ?
                        JSON.parse(locationShare.allowed_accessors) : [];
                    hasAccess = Array.isArray(allowedAccessors) && allowedAccessors.includes(currentUserId);
                }
                catch (e) {
                    hasAccess = false;
                }
            }
            if (!hasAccess) {
                res.status(404).json({
                    success: false,
                    error: 'Location share not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: locationShare
            });
        }
        catch (error) {
            console.error('Error getting location share:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async updateLocationShare(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const { id } = req.params;
            const locationId = parseInt(id);
            if (isNaN(locationId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid location share ID'
                });
                return;
            }
            const validation = location_1.UpdateLocationSharingSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    error: `Validation error: ${validation.error.issues.map((i) => i.message).join(', ')}`
                });
                return;
            }
            const updateData = {};
            if (validation.data.precision)
                updateData.precision = validation.data.precision;
            if (validation.data.expiresAt)
                updateData.expiresAt = new Date(validation.data.expiresAt);
            if (validation.data.emergencyOverride !== undefined)
                updateData.emergencyOverride = validation.data.emergencyOverride;
            if (validation.data.allowedAccessors)
                updateData.allowedAccessors = validation.data.allowedAccessors;
            try {
                const locationShare = await location_queries_1.locationQueries.updateLocationSharing(locationId, updateData);
                res.status(200).json({
                    success: true,
                    data: locationShare
                });
            }
            catch (dbError) {
                if (dbError.code === 'P2025') {
                    res.status(404).json({
                        success: false,
                        error: 'Location share not found'
                    });
                    return;
                }
                throw dbError;
            }
        }
        catch (error) {
            console.error('Error updating location share:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async deleteLocationShare(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const { id } = req.params;
            const locationId = parseInt(id);
            if (isNaN(locationId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid location share ID'
                });
                return;
            }
            try {
                const success = await location_queries_1.locationQueries.deleteLocationSharing(locationId);
                res.status(200).json({
                    success: true,
                    message: 'Location share deleted'
                });
            }
            catch (dbError) {
                if (dbError.code === 'P2025') {
                    res.status(404).json({
                        success: false,
                        error: 'Location share not found'
                    });
                    return;
                }
                throw dbError;
            }
        }
        catch (error) {
            console.error('Error deleting location share:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async getUserLocationShares(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const { userId } = req.params;
            const locationShares = await location_queries_1.locationQueries.getUserLocationSharing(parseInt(userId));
            res.status(200).json({
                success: true,
                data: locationShares || []
            });
        }
        catch (error) {
            console.error('Error getting user location shares:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async getActiveLocationShares(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const locationShare = await location_queries_1.locationQueries.getActiveLocationSharing(userId);
            res.status(200).json({
                success: true,
                data: locationShare ? [locationShare] : []
            });
        }
        catch (error) {
            console.error('Error getting active location shares:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async getAccessHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const accessLogs = await location_queries_1.locationQueries.getUserAccessLogs(userId);
            const sharingHistory = await location_queries_1.locationQueries.getUserLocationSharing(userId);
            const accessHistory = [
                ...(accessLogs || []).map((log) => ({
                    id: log.id || `log-${log.accessor_id}-${log.accessed_at}`,
                    accessorId: log.accessor_id,
                    accessorName: `User ${log.accessor_id}`,
                    timestamp: log.accessed_at,
                    location: log.location_accessed,
                    purpose: log.access_reason || 'Location access',
                    duration: 0
                })),
                ...(sharingHistory || []).map((share) => ({
                    id: share.id || `share-${share.id}`,
                    accessorId: 'shared',
                    accessorName: 'Location Sharing',
                    timestamp: share.created_at,
                    location: { latitude: 0, longitude: 0 },
                    purpose: `Shared with precision: ${share.precision}`,
                    duration: share.expires_at ? new Date(share.expires_at).getTime() - new Date(share.created_at).getTime() : 0
                }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            res.status(200).json({
                success: true,
                data: accessHistory
            });
        }
        catch (error) {
            console.error('Error getting access history:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.LocationController = LocationController;
exports.locationController = new LocationController();
