"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceController = void 0;
const geofence_queries_1 = require("../database/geofence-queries");
const zod_1 = require("zod");
const CreateGeofenceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    polygon_coords: zod_1.z.array(zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        lng: zod_1.z.number().min(-180).max(180)
    })).min(3, 'At least 3 coordinates required for polygon'),
    risk_level: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    type: zod_1.z.enum(['SAFE_ZONE', 'ALERT_ZONE', 'RESTRICTED'])
});
const CheckLocationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    user_id: zod_1.z.number().int().positive()
});
class GeofenceController {
    constructor(webSocketService) {
        this.webSocketService = webSocketService;
    }
    async createGeofence(req, res) {
        try {
            console.log('Received geofence creation request:', req.body);
            const validatedData = CreateGeofenceSchema.parse(req.body);
            console.log('Validated data:', validatedData);
            const created_by = req.user?.id || 1;
            const geofence = await geofence_queries_1.geofenceDb.createGeofence(validatedData, created_by);
            console.log('Geofence created successfully:', geofence);
            res.status(201).json({
                success: true,
                data: geofence
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error('Validation error:', error.errors);
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            console.error('Error creating geofence:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({
                success: false,
                error: 'Failed to create geofence',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getGeofences(req, res) {
        try {
            const { risk_level, type } = req.query;
            let geofences = await geofence_queries_1.geofenceDb.getActiveGeofences();
            if (risk_level) {
                geofences = geofences.filter(g => g.risk_level === risk_level);
            }
            if (type) {
                geofences = geofences.filter(g => g.type === type);
            }
            res.json({
                success: true,
                data: {
                    geofences,
                    total: geofences.length
                }
            });
        }
        catch (error) {
            console.error('Error fetching geofences:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch geofences'
            });
        }
    }
    async checkLocation(req, res) {
        try {
            const validatedData = CheckLocationSchema.parse(req.body);
            const { latitude, longitude, user_id } = validatedData;
            const geofences = await geofence_queries_1.geofenceDb.getActiveGeofences();
            const breaches = [];
            for (const geofence of geofences) {
                const isInside = this.pointInPolygon({ lat: latitude, lng: longitude }, geofence.polygon_coords);
                if (isInside) {
                    const risk_score = this.calculateRiskScore(geofence.risk_level);
                    const breachRecord = await geofence_queries_1.geofenceDb.logBreach(user_id, geofence.id, { latitude, longitude }, risk_score);
                    const breach = {
                        geofence_id: geofence.id,
                        geofence_name: geofence.name,
                        risk_level: geofence.risk_level,
                        risk_score,
                        recommendations: this.getRecommendations(geofence.risk_level, geofence.type),
                        breach_id: breachRecord.id
                    };
                    breaches.push(breach);
                    await this.sendGeofenceAlerts(user_id, breach, { latitude, longitude });
                }
            }
            res.json({
                success: true,
                data: { breaches }
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            console.error('Error checking location:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check location'
            });
        }
    }
    async getStats(req, res) {
        try {
            const stats = await geofence_queries_1.geofenceDb.getGeofenceStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error fetching geofence stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics'
            });
        }
    }
    async updateGeofence(req, res) {
        try {
            const { id } = req.params;
            const geofenceId = parseInt(id);
            if (isNaN(geofenceId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid geofence ID'
                });
            }
            const validatedData = CreateGeofenceSchema.partial().parse(req.body);
            const updatedGeofence = await geofence_queries_1.geofenceDb.updateGeofence(geofenceId, validatedData);
            if (!updatedGeofence) {
                return res.status(404).json({
                    success: false,
                    error: 'Geofence not found'
                });
            }
            res.json({
                success: true,
                data: updatedGeofence
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            }
            console.error('Error updating geofence:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update geofence'
            });
        }
    }
    async deleteGeofence(req, res) {
        try {
            const { id } = req.params;
            const geofenceId = parseInt(id);
            if (isNaN(geofenceId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid geofence ID'
                });
            }
            const success = await geofence_queries_1.geofenceDb.deleteGeofence(geofenceId);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Geofence not found'
                });
            }
            res.json({
                success: true,
                message: 'Geofence deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting geofence:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete geofence'
            });
        }
    }
    pointInPolygon(point, polygon) {
        const { lat, lng } = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lng, yi = polygon[i].lat;
            const xj = polygon[j].lng, yj = polygon[j].lat;
            if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    calculateRiskScore(risk_level) {
        switch (risk_level) {
            case 'LOW': return Math.floor(Math.random() * 40);
            case 'MEDIUM': return Math.floor(Math.random() * 40) + 40;
            case 'HIGH': return Math.floor(Math.random() * 21) + 80;
            default: return 50;
        }
    }
    getRecommendations(risk_level, type) {
        const recommendations = [];
        if (risk_level === 'HIGH') {
            recommendations.push('Exercise extreme caution');
            recommendations.push('Consider leaving the area immediately');
            recommendations.push('Stay in groups if possible');
        }
        else if (risk_level === 'MEDIUM') {
            recommendations.push('Stay alert and aware of surroundings');
            recommendations.push('Avoid isolated areas');
        }
        else {
            recommendations.push('Maintain normal safety precautions');
        }
        if (type === 'RESTRICTED') {
            recommendations.push('This area may have access restrictions');
            recommendations.push('Check local regulations');
        }
        return recommendations;
    }
    async sendGeofenceAlerts(userId, breach, location) {
        if (!this.webSocketService) {
            return;
        }
        try {
            await this.sendUserNotification(userId, breach, location);
            if (breach.risk_level === 'MEDIUM' || breach.risk_level === 'HIGH') {
                await this.sendAdminAlert(userId, breach, location);
            }
            await this.markAlertSent(breach.breach_id);
        }
        catch (error) {
            console.error('Failed to send geofence alerts:', error);
        }
    }
    async sendUserNotification(userId, breach, location) {
        const priority = this.getRiskPriority(breach.risk_level);
        const notification = {
            type: 'geofence_breach',
            userId: userId.toString(),
            data: {
                geofence_name: breach.geofence_name,
                risk_level: breach.risk_level,
                priority,
                breach_location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                safety_recommendations: breach.recommendations,
                timestamp: new Date().toISOString(),
                message: this.getBreachMessage(breach.geofence_name, breach.risk_level)
            },
            timestamp: new Date()
        };
        await this.webSocketService.broadcastNotification(notification);
    }
    async sendAdminAlert(userId, breach, location) {
        const alert = {
            type: 'admin_geofence_alert',
            data: {
                user_id: userId,
                geofence_name: breach.geofence_name,
                risk_level: breach.risk_level,
                requires_immediate_attention: breach.risk_level === 'HIGH',
                user_context: {
                    user_id: userId,
                    last_known_location: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                },
                breach_details: {
                    geofence_id: breach.geofence_id,
                    risk_score: breach.risk_score,
                    recommendations: breach.recommendations
                },
                timestamp: new Date().toISOString(),
                location_accuracy: 'high'
            },
            timestamp: new Date()
        };
        await this.webSocketService.broadcastAdminAlert(alert);
    }
    async markAlertSent(breachId) {
        try {
            await geofence_queries_1.geofenceDb.markBreachAlertSent(breachId);
        }
        catch (error) {
            console.error('Failed to mark alert as sent:', error);
        }
    }
    getRiskPriority(riskLevel) {
        switch (riskLevel) {
            case 'LOW': return 'info';
            case 'MEDIUM': return 'warning';
            case 'HIGH': return 'urgent';
            default: return 'info';
        }
    }
    getBreachMessage(geofenceName, riskLevel) {
        const riskDescriptions = {
            'LOW': 'You have entered a monitored area',
            'MEDIUM': 'Caution: You are in an area that requires attention',
            'HIGH': 'WARNING: You have entered a high-risk area'
        };
        const description = riskDescriptions[riskLevel] || 'You have entered a geofenced area';
        return `${description}: ${geofenceName}. Please review the safety recommendations.`;
    }
}
exports.GeofenceController = GeofenceController;
