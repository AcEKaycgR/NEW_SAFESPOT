import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { 
  authenticateToken, 
  authorizeLocationAccess, 
  logLocationAccess,
  rateLimitLocationOperations 
} from '../middleware/location-auth.middleware';

const router = Router();

/**
 * Location Sharing Routes
 * All routes require authentication and implement proper authorization
 */

// Apply authentication and logging to all location routes
router.use(authenticateToken);
router.use(logLocationAccess);
router.use(rateLimitLocationOperations);

/**
 * @route POST /api/location/share
 * @desc Toggle location sharing (simple on/off)
 * @access Private
 */
router.post('/share', locationController.toggleLocationSharing.bind(locationController));

/**
 * @route POST /api/location/share/create
 * @desc Create new location sharing setting with full options
 * @access Private
 */
router.post('/share/create', locationController.createLocationShare.bind(locationController));

/**
 * @route GET /api/location/share/:shareId
 * @desc Get location sharing by ID
 * @access Private (owner or allowed accessor)
 */
router.get('/share/:shareId', locationController.getLocationShare.bind(locationController));

/**
 * @route PUT /api/location/share/:shareId
 * @desc Update location sharing settings
 * @access Private (owner only)
 */
router.put('/share/:shareId', locationController.updateLocationShare.bind(locationController));

/**
 * @route DELETE /api/location/share/:shareId
 * @desc Delete location sharing
 * @access Private (owner only)
 */
router.delete('/share/:shareId', locationController.deleteLocationShare.bind(locationController));

/**
 * @route GET /api/location/access-history
 * @desc Get access history for the authenticated user
 * @access Private
 */
router.get('/access-history', locationController.getAccessHistory.bind(locationController));

/**
 * @route GET /api/location/user/:userId/shares
 * @desc Get all location shares for a user
 * @access Private (own data only)
 */
router.get('/user/:userId/shares', 
  authorizeLocationAccess, 
  locationController.getUserLocationShares.bind(locationController)
);

/**
 * @route GET /api/location/user/:userId/active
 * @desc Get active location sharing for user
 * @access Private (own data only)
 */
router.get('/user/:userId/active', 
  authorizeLocationAccess, 
  locationController.getActiveLocationShares.bind(locationController)
);

export default router;
