import { Request, Response } from 'express';
import { geofenceDb } from '../database/geofence-queries';
import { CreateGeofenceRequest, GeofenceBreachRequest } from '../types/geofence';
import { z } from 'zod';

// Extend Request type for user authentication (POC)
interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

// Validation schemas
const CreateGeofenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  polygon_coords: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })).min(3, 'At least 3 coordinates required for polygon'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  type: z.enum(['SAFE_ZONE', 'ALERT_ZONE', 'RESTRICTED'])
});

const CheckLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  user_id: z.number().int().positive()
});

export class GeofenceController {
  private webSocketService?: any; // WebSocket service for alerts
  
  constructor(webSocketService?: any) {
    this.webSocketService = webSocketService;
  }
  
  // Create a new geofence
  async createGeofence(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('Received geofence creation request:', req.body);
      const validatedData = CreateGeofenceSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      // For POC, we'll use a default created_by user ID (1)
      // In production, this would come from authentication
      const created_by = req.user?.id || 1;
      
      const geofence = await geofenceDb.createGeofence(validatedData, created_by);
      console.log('Geofence created successfully:', geofence);
      
      res.status(201).json({
        success: true,
        data: geofence
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Get all active geofences
  async getGeofences(req: Request, res: Response) {
    try {
      const { risk_level, type } = req.query;
      
      // For now, get all active geofences - filtering will be enhanced in Phase 2
      let geofences = await geofenceDb.getActiveGeofences();
      
      // Simple filtering
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
    } catch (error) {
      console.error('Error fetching geofences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch geofences'
      });
    }
  }

  // Check if location intersects with geofences
  async checkLocation(req: Request, res: Response) {
    try {
      const validatedData = CheckLocationSchema.parse(req.body);
      const { latitude, longitude, user_id } = validatedData;
      
      // Get all active geofences
      const geofences = await geofenceDb.getActiveGeofences();
      const breaches = [];
      
      // Check each geofence for intersection
      for (const geofence of geofences) {
        const isInside = this.pointInPolygon(
          { lat: latitude, lng: longitude },
          geofence.polygon_coords
        );
        
        if (isInside) {
          // Calculate risk score based on risk level
          const risk_score = this.calculateRiskScore(geofence.risk_level);
          
          // Log the breach and get the breach record
          const breachRecord = await geofenceDb.logBreach(user_id, geofence.id, { latitude, longitude }, risk_score);
          
          const breach = {
            geofence_id: geofence.id,
            geofence_name: geofence.name,
            risk_level: geofence.risk_level,
            risk_score,
            recommendations: this.getRecommendations(geofence.risk_level, geofence.type),
            breach_id: breachRecord.id // Store breach ID for alert marking
          };
          
          breaches.push(breach);
          
          // Send alerts via WebSocket
          await this.sendGeofenceAlerts(user_id, breach, { latitude, longitude });
        }
      }
      
      res.json({
        success: true,
        data: { breaches }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Get geofence statistics for admin dashboard
  async getStats(req: Request, res: Response) {
    try {
      const stats = await geofenceDb.getGeofenceStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching geofence stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  // Update geofence
  async updateGeofence(req: Request, res: Response) {
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
      
      const updatedGeofence = await geofenceDb.updateGeofence(geofenceId, validatedData);
      
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
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Delete (deactivate) geofence
  async deleteGeofence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const geofenceId = parseInt(id);
      
      if (isNaN(geofenceId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid geofence ID'
        });
      }
      
      const success = await geofenceDb.deleteGeofence(geofenceId);
      
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
    } catch (error) {
      console.error('Error deleting geofence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete geofence'
      });
    }
  }

  // Simple point-in-polygon algorithm using ray casting
  private pointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
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

  // Calculate risk score based on risk level
  private calculateRiskScore(risk_level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (risk_level) {
      case 'LOW': return Math.floor(Math.random() * 40); // 0-39
      case 'MEDIUM': return Math.floor(Math.random() * 40) + 40; // 40-79
      case 'HIGH': return Math.floor(Math.random() * 21) + 80; // 80-100
      default: return 50;
    }
  }

  // Get safety recommendations based on risk level and type
  private getRecommendations(risk_level: 'LOW' | 'MEDIUM' | 'HIGH', type: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED'): string[] {
    const recommendations: string[] = [];
    
    if (risk_level === 'HIGH') {
      recommendations.push('Exercise extreme caution');
      recommendations.push('Consider leaving the area immediately');
      recommendations.push('Stay in groups if possible');
    } else if (risk_level === 'MEDIUM') {
      recommendations.push('Stay alert and aware of surroundings');
      recommendations.push('Avoid isolated areas');
    } else {
      recommendations.push('Maintain normal safety precautions');
    }
    
    if (type === 'RESTRICTED') {
      recommendations.push('This area may have access restrictions');
      recommendations.push('Check local regulations');
    }
    
    return recommendations;
  }

  // Send geofence breach alerts via WebSocket
  private async sendGeofenceAlerts(userId: number, breach: any, location: { latitude: number; longitude: number }) {
    if (!this.webSocketService) {
      return; // No WebSocket service available
    }

    try {
      // Send user notification
      await this.sendUserNotification(userId, breach, location);
      
      // Send admin alert for medium and high risk breaches
      if (breach.risk_level === 'MEDIUM' || breach.risk_level === 'HIGH') {
        await this.sendAdminAlert(userId, breach, location);
      }
      
      // Update breach record to mark alert as sent
      await this.markAlertSent(breach.breach_id);
      
    } catch (error) {
      console.error('Failed to send geofence alerts:', error);
      // Don't throw - continue with the main flow even if alerts fail
    }
  }

  // Send notification to the user who breached the geofence
  private async sendUserNotification(userId: number, breach: any, location: { latitude: number; longitude: number }) {
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

  // Send alert to administrators for medium/high risk breaches
  private async sendAdminAlert(userId: number, breach: any, location: { latitude: number; longitude: number }) {
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
        location_accuracy: 'high' // Could be determined by GPS accuracy
      },
      timestamp: new Date()
    };

    await this.webSocketService.broadcastAdminAlert(alert);
  }

  // Mark breach record as having alert sent
  private async markAlertSent(breachId: number) {
    try {
      await geofenceDb.markBreachAlertSent(breachId);
    } catch (error) {
      console.error('Failed to mark alert as sent:', error);
    }
  }

  // Get priority level based on risk
  private getRiskPriority(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW': return 'info';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'urgent';
      default: return 'info';
    }
  }

  // Generate user-friendly breach message
  private getBreachMessage(geofenceName: string, riskLevel: string): string {
    const riskDescriptions = {
      'LOW': 'You have entered a monitored area',
      'MEDIUM': 'Caution: You are in an area that requires attention',
      'HIGH': 'WARNING: You have entered a high-risk area'
    };
    
    const description = riskDescriptions[riskLevel as keyof typeof riskDescriptions] || 'You have entered a geofenced area';
    return `${description}: ${geofenceName}. Please review the safety recommendations.`;
  }
}
