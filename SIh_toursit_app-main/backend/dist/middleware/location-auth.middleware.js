"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLocationAccess = exports.validateSharingPermissions = exports.rateLimitLocationOperations = exports.authorizeEmergencyAccess = exports.authorizeLocationAccess = exports.authenticateToken = exports.LocationAuthMiddleware = void 0;
class LocationAuthMiddleware {
    static async authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid authentication token'
                });
            }
            const userInfo = authHeader.split(' ')[1];
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
            req.user = {
                id: parseInt(userId),
                email: email,
                name: name
            };
            next();
        }
        catch (error) {
            console.error('Authentication error:', error);
            return res.status(500).json({
                error: 'Authentication failed',
                message: 'An error occurred during authentication'
            });
        }
    }
    static async authorizeLocationAccess(req, res, next) {
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
            if (currentUserId !== requestedUserId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only access your own location data'
                });
            }
            next();
        }
        catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                error: 'Authorization failed',
                message: 'An error occurred during authorization'
            });
        }
    }
    static async authorizeEmergencyAccess(req, res, next) {
        try {
            const currentUserId = req.user?.id;
            if (!currentUserId) {
                return res.status(401).json({
                    error: 'User not authenticated',
                    message: 'Authentication required for emergency access'
                });
            }
            const userEmail = req.user?.email;
            const isEmergencyAuthority = userEmail?.includes('authority') || userEmail?.includes('emergency');
            if (!isEmergencyAuthority) {
                return res.status(403).json({
                    error: 'Emergency access denied',
                    message: 'Emergency authority permissions required'
                });
            }
            next();
        }
        catch (error) {
            console.error('Emergency authorization error:', error);
            return res.status(500).json({
                error: 'Emergency authorization failed',
                message: 'An error occurred during emergency authorization'
            });
        }
    }
    static async rateLimitLocationOperations(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next();
            }
            const userKey = `location_ops_${userId}`;
            const now = Date.now();
            const windowMs = 60 * 1000;
            const maxRequests = 10;
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            return res.status(500).json({
                error: 'Rate limiting failed',
                message: 'An error occurred during rate limiting'
            });
        }
    }
    static async validateSharingPermissions(req, res, next) {
        try {
            const { shareId } = req.params;
            const currentUserId = req.user?.id;
            if (!currentUserId) {
                return res.status(401).json({
                    error: 'User not authenticated',
                    message: 'Authentication required to access shared location'
                });
            }
            next();
        }
        catch (error) {
            console.error('Sharing permissions error:', error);
            return res.status(500).json({
                error: 'Permission validation failed',
                message: 'An error occurred during permission validation'
            });
        }
    }
    static async logLocationAccess(req, res, next) {
        try {
            const userId = req.user?.id;
            const { method, originalUrl, ip } = req;
            console.log(`Location access log: User ${userId} ${method} ${originalUrl} from ${ip} at ${new Date()}`);
            next();
        }
        catch (error) {
            console.error('Access logging error:', error);
            next();
        }
    }
}
exports.LocationAuthMiddleware = LocationAuthMiddleware;
exports.authenticateToken = LocationAuthMiddleware.authenticateToken, exports.authorizeLocationAccess = LocationAuthMiddleware.authorizeLocationAccess, exports.authorizeEmergencyAccess = LocationAuthMiddleware.authorizeEmergencyAccess, exports.rateLimitLocationOperations = LocationAuthMiddleware.rateLimitLocationOperations, exports.validateSharingPermissions = LocationAuthMiddleware.validateSharingPermissions, exports.logLocationAccess = LocationAuthMiddleware.logLocationAccess;
