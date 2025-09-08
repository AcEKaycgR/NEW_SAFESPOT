import { Router } from 'express';
import { privacyController } from '../controllers/privacy.controller';
import { authenticateToken } from '../middleware/location-auth.middleware';

const router = Router();

// Apply authentication middleware to all privacy routes
router.use(authenticateToken);

// GET /api/privacy/settings - Get Privacy Settings
router.get('/settings', privacyController.getPrivacySettings.bind(privacyController));

// PUT /api/privacy/settings - Update Privacy Settings
router.put('/settings', privacyController.updatePrivacySettings.bind(privacyController));

export { router as privacyRoutes };
