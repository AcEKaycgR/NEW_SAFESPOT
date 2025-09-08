import { Request, Response } from 'express';
import { locationQueries } from '../database/location-queries';
import { CreateLocationSharingSchema, UpdateLocationSharingSchema } from '../schemas/location';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export class LocationController {
  async createLocationShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = CreateLocationSharingSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: `Validation error: ${validation.error.issues.map((i: any) => i.message).join(', ')}`
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

      // Parse and validate userId (already an integer)
      const userIdInt = userId;
      if (isNaN(userIdInt)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      // Transform string date to Date object
      const shareData = {
        userId: userIdInt,
        precision: validation.data.precision,
        expiresAt: new Date(validation.data.expiresAt),
        emergencyOverride: validation.data.emergencyOverride,
        allowedAccessors: validation.data.allowedAccessors
      };

      const locationShare = await locationQueries.createLocationSharing(shareData);

      res.status(201).json({
        success: true,
        data: locationShare
      });
    } catch (error) {
      console.error('Error creating location share:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async toggleLocationSharing(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        // Check if user already has active sharing
        const existingShare = await locationQueries.getActiveLocationSharing(userId);
        
        if (existingShare) {
          res.status(200).json({
            success: true,
            message: 'Location sharing already active',
            data: existingShare
          });
          return;
        }

        // Ensure user exists in database (for testing with mock user ID)
        try {
          console.log('Attempting to ensure user exists:', userId);
          const user = await locationQueries.ensureUserExists(userId, 'test@example.com', 'TestUser');
          console.log('User ensured:', user);
        } catch (error) {
          console.error('User creation/check failed:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to create or verify user'
          });
          return;
        }

        console.log('About to create location sharing for user:', userId);

        // Create new sharing with default settings - call database method directly
        const defaultExpiry = new Date();
        defaultExpiry.setHours(defaultExpiry.getHours() + 4); // 4 hours default

        const newShare = await locationQueries.createLocationSharing({
          userId: userId,
          precision: 'street', // Default precision
          expiresAt: defaultExpiry,
          emergencyOverride: true,
          allowedAccessors: []
        });

        res.status(201).json({
          success: true,
          message: 'Location sharing started',
          data: newShare
        });
      } else { // action === 'stop'
        // Find and deactivate active sharing
        const activeShare = await locationQueries.getActiveLocationSharing(userId);
        
        if (!activeShare) {
          res.status(200).json({
            success: true,
            message: 'No active location sharing to stop'
          });
          return;
        }

        // Deactivate the sharing (assuming there's an update method)
        const updatedShare = await locationQueries.updateLocationSharing(activeShare.id, {
          status: 'DISABLED'
        });

        res.status(200).json({
          success: true,
          message: 'Location sharing stopped',
          data: updatedShare
        });
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getLocationShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      
      // Validate ID format
      const locationId = parseInt(id);
      if (isNaN(locationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid location share ID'
        });
        return;
      }
      
      const locationShare = await locationQueries.getLocationSharing(locationId);
      if (!locationShare) {
        res.status(404).json({
          success: false,
          error: 'Location share not found'
        });
        return;
      }

      // Privacy protection: Users can only access their own location shares
      // or shares where they are explicitly allowed accessors
      const currentUserId = req.user.id;
      const shareOwnerId = locationShare.user_id;
      
      let hasAccess = false;
      
      // Owner can always access
      if (currentUserId === shareOwnerId) {
        hasAccess = true;
      } else {
        // Check if current user is in allowed accessors
        try {
          const allowedAccessors = locationShare.allowed_accessors ? 
            JSON.parse(locationShare.allowed_accessors) : [];
          hasAccess = Array.isArray(allowedAccessors) && allowedAccessors.includes(currentUserId);
        } catch (e) {
          // If JSON parsing fails, assume no access
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
    } catch (error) {
      console.error('Error getting location share:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateLocationShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      
      // Validate ID format
      const locationId = parseInt(id);
      if (isNaN(locationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid location share ID'
        });
        return;
      }

      const validation = UpdateLocationSharingSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: `Validation error: ${validation.error.issues.map((i: any) => i.message).join(', ')}`
        });
        return;
      }

      const updateData: any = {};
      if (validation.data.precision) updateData.precision = validation.data.precision;
      if (validation.data.expiresAt) updateData.expiresAt = new Date(validation.data.expiresAt);
      if (validation.data.emergencyOverride !== undefined) updateData.emergencyOverride = validation.data.emergencyOverride;
      if (validation.data.allowedAccessors) updateData.allowedAccessors = validation.data.allowedAccessors;

      try {
        const locationShare = await locationQueries.updateLocationSharing(locationId, updateData);
        
        res.status(200).json({
          success: true,
          data: locationShare
        });
      } catch (dbError: any) {
        if (dbError.code === 'P2025') {
          res.status(404).json({
            success: false,
            error: 'Location share not found'
          });
          return;
        }
        throw dbError;
      }
    } catch (error) {
      console.error('Error updating location share:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteLocationShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      
      // Validate ID format
      const locationId = parseInt(id);
      if (isNaN(locationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid location share ID'
        });
        return;
      }
      
      try {
        const success = await locationQueries.deleteLocationSharing(locationId);
        
        res.status(200).json({
          success: true,
          message: 'Location share deleted'
        });
      } catch (dbError: any) {
        if (dbError.code === 'P2025') {
          res.status(404).json({
            success: false,
            error: 'Location share not found'
          });
          return;
        }
        throw dbError;
      }
    } catch (error) {
      console.error('Error deleting location share:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getUserLocationShares(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { userId } = req.params;

      const locationShares = await locationQueries.getUserLocationSharing(parseInt(userId));

      res.status(200).json({
        success: true,
        data: locationShares || []
      });
    } catch (error) {
      console.error('Error getting user location shares:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getActiveLocationShares(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const locationShare = await locationQueries.getActiveLocationSharing(userId);

      res.status(200).json({
        success: true,
        data: locationShare ? [locationShare] : []
      });
    } catch (error) {
      console.error('Error getting active location shares:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getAccessHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Get user's access logs (who accessed their location)
      const accessLogs = await locationQueries.getUserAccessLogs(userId);
      
      // Get user's location sharing history
      const sharingHistory = await locationQueries.getUserLocationSharing(userId);

      // Combine and format as an array of access records
      const accessHistory = [
        // Convert access logs to access records
        ...(accessLogs || []).map((log: any) => ({
          id: log.id || `log-${log.accessor_id}-${log.accessed_at}`,
          accessorId: log.accessor_id,
          accessorName: `User ${log.accessor_id}`, // In real app, this would be looked up
          timestamp: log.accessed_at,
          location: log.location_accessed,
          purpose: log.access_reason || 'Location access',
          duration: 0 // This would need to be calculated
        })),
        // Convert sharing history to access records
        ...(sharingHistory || []).map((share: any) => ({
          id: share.id || `share-${share.id}`,
          accessorId: 'shared',
          accessorName: 'Location Sharing',
          timestamp: share.created_at,
          location: { latitude: 0, longitude: 0 }, // This would come from actual location
          purpose: `Shared with precision: ${share.precision}`,
          duration: share.expires_at ? new Date(share.expires_at).getTime() - new Date(share.created_at).getTime() : 0
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.status(200).json({
        success: true,
        data: accessHistory
      });
    } catch (error) {
      console.error('Error getting access history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// Export an instance for use in routes
export const locationController = new LocationController();
