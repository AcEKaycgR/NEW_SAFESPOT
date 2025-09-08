import { PrismaClient } from '../generated/prisma';
import { 
  CreateGeofenceRequest, 
  GeofenceResponse, 
  GeofenceCoordinate,
  LocationPoint 
} from '../types/geofence';

const prisma = new PrismaClient();

export class GeofenceDatabase {
  
  // Create a new geofence
  async createGeofence(data: CreateGeofenceRequest, created_by: number): Promise<GeofenceResponse> {
    // Ensure the user exists or create a default one
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

  // Helper method to ensure user exists
  private async ensureUserExists(userId: number): Promise<void> {
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

  // Get all active geofences
  async getActiveGeofences(): Promise<GeofenceResponse[]> {
    const geofences = await prisma.geofenceArea.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });

    return geofences.map(this.formatGeofenceResponse);
  }

  // Get geofence by ID
  async getGeofenceById(id: number): Promise<GeofenceResponse | null> {
    const geofence = await prisma.geofenceArea.findUnique({
      where: { id }
    });

    return geofence ? this.formatGeofenceResponse(geofence) : null;
  }

  // Update geofence
  async updateGeofence(id: number, data: Partial<CreateGeofenceRequest>): Promise<GeofenceResponse | null> {
    try {
      const updateData: any = { ...data };
      if (data.polygon_coords) {
        updateData.polygon_coords = JSON.stringify(data.polygon_coords);
      }

      const geofence = await prisma.geofenceArea.update({
        where: { id },
        data: updateData
      });

      return this.formatGeofenceResponse(geofence);
    } catch (error: any) {
      // If the record doesn't exist, Prisma throws P2025 error
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  // Soft delete geofence
  async deleteGeofence(id: number): Promise<boolean> {
    try {
      await prisma.geofenceArea.update({
        where: { id },
        data: { is_active: false }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Log a geofence breach
  async logBreach(user_id: number, geofence_id: number, location: LocationPoint, risk_score: number) {
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

  // Get breach history for a user
  async getUserBreaches(user_id: number, limit: number = 50) {
    return await prisma.geofenceBreach.findMany({
      where: { user_id },
      include: {
        geofence: true
      },
      orderBy: { occurred_at: 'desc' },
      take: limit
    });
  }

  // Get breach history for a geofence
  async getGeofenceBreaches(geofence_id: number, limit: number = 50) {
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

  // Update breach alert status
  async markBreachAlertSent(breach_id: number) {
    return await prisma.geofenceBreach.update({
      where: { id: breach_id },
      data: { alert_sent: true }
    });
  }

  // Helper method to format database response
  private formatGeofenceResponse(geofence: any): GeofenceResponse {
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

  // Get statistics for admin dashboard
  async getGeofenceStats() {
    const [totalGeofences, activeGeofences, totalBreaches, recentBreaches] = await Promise.all([
      prisma.geofenceArea.count(),
      prisma.geofenceArea.count({ where: { is_active: true } }),
      prisma.geofenceBreach.count(),
      prisma.geofenceBreach.count({
        where: {
          occurred_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
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

export const geofenceDb = new GeofenceDatabase();
