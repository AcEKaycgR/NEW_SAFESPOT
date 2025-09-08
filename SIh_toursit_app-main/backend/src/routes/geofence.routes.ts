import { Router } from 'express';
import { GeofenceController } from '../controllers/geofence.controller';

const router = Router();
const geofenceController = new GeofenceController();

// Geofence CRUD operations
router.post('/geofences', geofenceController.createGeofence.bind(geofenceController));
router.get('/geofences', geofenceController.getGeofences.bind(geofenceController));
router.put('/geofences/:id', geofenceController.updateGeofence.bind(geofenceController));
router.delete('/geofences/:id', geofenceController.deleteGeofence.bind(geofenceController));

// Location checking and breach detection
router.post('/geofences/check-location', geofenceController.checkLocation.bind(geofenceController));

// Statistics for admin dashboard
router.get('/geofences/stats', geofenceController.getStats.bind(geofenceController));

export { router as geofenceRoutes };
