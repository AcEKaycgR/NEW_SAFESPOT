import { Request, Response, NextFunction } from 'express';

// Extended Request interface for authenticated users
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

/**
 * Location Authorization Middleware
 * Handles authentication and authorization for location-related endpoints
 */
export class LocationAuthMiddleware {

  /**
   * Simple authentication middleware for testing
   * In production, this would verify JWT tokens
   */
  static async authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Access token required',
          message: 'Please provide a valid authentication token'
        });
      }

      // Simplified authentication for testing - extract user info from header
      // In production, this would verify a JWT token
      const userInfo = authHeader.split(' ')[1]; // Expecting "Bearer userId:email:name"
      
      if (!userInfo) {
        return res.status(401).json({
          error: 'Invalid token format',
          message: 'Token format should be: Bearer userId:email:name'
        });
      }

      const [userId, email, name] = userInfo.split(':');
      
      if (!userId || !email || !name) {
        return res.status(401).json({
          error: 'Invalid token content',
          message: 'Token must contain userId:email:name'
        });
      }

      // Attach user info to request
      req.user = {
        id: parseInt(userId),
        email: email,
        name: name
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        error: 'Authentication failed',
        message: 'An error occurred during authentication'
      });
    }
  }

  /**
   * Check if user has permission to access location data
   */
  static async authorizeLocationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const requestedUserId = parseInt(userId);
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({
          error: 'User not authenticated',
          message: 'Authentication required to access location data'
        });
      }

      // Users can only access their own location data (simplified authorization)
      // In a real app, this might include checking for emergency authority permissions
      if (currentUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own location data'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        error: 'Authorization failed',
        message: 'An error occurred during authorization'
      });
    }
  }

  /**
   * Check if user has emergency authority access
   */
  static async authorizeEmergencyAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({
          error: 'User not authenticated',
          message: 'Authentication required for emergency access'
        });
      }

      // In a real app, this would check if the user has emergency authority role
      // For now, we'll implement a simplified check
      const userEmail = req.user?.email;
      const isEmergencyAuthority = userEmail?.includes('authority') || userEmail?.includes('emergency');

      if (!isEmergencyAuthority) {
        return res.status(403).json({
          error: 'Emergency access denied',
          message: 'Emergency authority permissions required'
        });
      }

      next();
    } catch (error) {
      console.error('Emergency authorization error:', error);
      return res.status(500).json({
        error: 'Emergency authorization failed',
        message: 'An error occurred during emergency authorization'
      });
    }
  }

  /**
   * Rate limiting for location sharing operations
   */
  static async rateLimitLocationOperations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(); // Let authentication middleware handle this
      }

      // Simple in-memory rate limiting (in production, use Redis or similar)
      const userKey = `location_ops_${userId}`;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      const maxRequests = 10; // Max 10 location operations per minute

      // This is a simplified implementation
      // In production, you'd use a proper rate limiting library
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      return res.status(500).json({
        error: 'Rate limiting failed',
        message: 'An error occurred during rate limiting'
      });
    }
  }

  /**
   * Validate location sharing permissions
   */
  static async validateSharingPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { shareId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({
          error: 'User not authenticated',
          message: 'Authentication required to access shared location'
        });
      }

      // Additional validation logic would go here
      // For example, checking if the user is in the allowed accessors list
      
      next();
    } catch (error) {
      console.error('Sharing permissions error:', error);
      return res.status(500).json({
        error: 'Permission validation failed',
        message: 'An error occurred during permission validation'
      });
    }
  }

  /**
   * Log location access for audit purposes
   */
  static async logLocationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { method, originalUrl, ip } = req;
      
      // Log the access attempt
      console.log(`Location access log: User ${userId} ${method} ${originalUrl} from ${ip} at ${new Date()}`);
      
      next();
    } catch (error) {
      console.error('Access logging error:', error);
      // Don't fail the request if logging fails
      next();
    }
  }
}

// Export individual middleware functions for easier use
export const {
  authenticateToken,
  authorizeLocationAccess,
  authorizeEmergencyAccess,
  rateLimitLocationOperations,
  validateSharingPermissions,
  logLocationAccess
} = LocationAuthMiddleware;
