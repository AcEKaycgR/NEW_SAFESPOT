"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geofenceDb = exports.GeofenceDatabase = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class GeofenceDatabase {
    async createGeofence(data, created_by) {
        await this.ensureUserExists(created_by);
        const geofence = await prisma.geofenceArea.create({
            data: {
                name: data.name,
                description: data.description,
                polygon_coords: JSON.stringify(data.polygon_coords),
                risk_level: data.risk_level,
                type: data.type,
                created_by
            }
        });
        return this.formatGeofenceResponse(geofence);
    }
    async ensureUserExists(userId) {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    id: userId,
                    email: `user${userId}@example.com`,
                    name: `User ${userId}`,
                    verification_status: 'VERIFIED'
                }
            });
        }
    }
    async getActiveGeofences() {
        const geofences = await prisma.geofenceArea.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });
        return geofences.map(this.formatGeofenceResponse);
    }
    async getGeofenceById(id) {
        const geofence = await prisma.geofenceArea.findUnique({
            where: { id }
        });
        return geofence ? this.formatGeofenceResponse(geofence) : null;
    }
    async updateGeofence(id, data) {
        try {
            const updateData = { ...data };
            if (data.polygon_coords) {
                updateData.polygon_coords = JSON.stringify(data.polygon_coords);
            }
            const geofence = await prisma.geofenceArea.update({
                where: { id },
                data: updateData
            });
            return this.formatGeofenceResponse(geofence);
        }
        catch (error) {
            if (error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
    async deleteGeofence(id) {
        try {
            await prisma.geofenceArea.update({
                where: { id },
                data: { is_active: false }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async logBreach(user_id, geofence_id, location, risk_score) {
        return await prisma.geofenceBreach.create({
            data: {
                user_id,
                geofence_id,
                latitude: location.latitude,
                longitude: location.longitude,
                risk_score,
                alert_sent: false
            }
        });
    }
    async getUserBreaches(user_id, limit = 50) {
        return await prisma.geofenceBreach.findMany({
            where: { user_id },
            include: {
                geofence: true
            },
            orderBy: { occurred_at: 'desc' },
            take: limit
        });
    }
    async getGeofenceBreaches(geofence_id, limit = 50) {
        return await prisma.geofenceBreach.findMany({
            where: { geofence_id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { occurred_at: 'desc' },
            take: limit
        });
    }
    async markBreachAlertSent(breach_id) {
        return await prisma.geofenceBreach.update({
            where: { id: breach_id },
            data: { alert_sent: true }
        });
    }
    formatGeofenceResponse(geofence) {
        return {
            id: geofence.id,
            name: geofence.name,
            description: geofence.description,
            polygon_coords: JSON.parse(geofence.polygon_coords),
            risk_level: geofence.risk_level,
            type: geofence.type,
            created_by: geofence.created_by,
            is_active: geofence.is_active,
            created_at: geofence.created_at.toISOString(),
            updated_at: geofence.updated_at.toISOString()
        };
    }
    async getGeofenceStats() {
        const [totalGeofences, activeGeofences, totalBreaches, recentBreaches] = await Promise.all([
            prisma.geofenceArea.count(),
            prisma.geofenceArea.count({ where: { is_active: true } }),
            prisma.geofenceBreach.count(),
            prisma.geofenceBreach.count({
                where: {
                    occurred_at: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        return {
            totalGeofences,
            activeGeofences,
            totalBreaches,
            recentBreaches
        };
    }
}
exports.GeofenceDatabase = GeofenceDatabase;
exports.geofenceDb = new GeofenceDatabase();
