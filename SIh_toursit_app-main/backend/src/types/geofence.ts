// Geofence data types for the dynamic geofencing system

export interface GeofenceCoordinate {
  lat: number;
  lng: number;
}

export interface GeofencePolygon {
  coordinates: GeofenceCoordinate[];
}

export interface CreateGeofenceRequest {
  name: string;
  description?: string;
  polygon_coords: GeofenceCoordinate[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED';
}

export interface GeofenceResponse {
  id: number;
  name: string;
  description?: string;
  polygon_coords: GeofenceCoordinate[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED';
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface GeofenceBreachRequest {
  latitude: number;
  longitude: number;
  user_id: number;
}

export interface GeofenceBreachResponse {
  breaches: {
    geofence_id: number;
    geofence_name: string;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    risk_score: number;
    recommendations: string[];
  }[];
}

export interface GeofenceBreachEvent {
  id: number;
  user_id: number;
  geofence_id: number;
  latitude: number;
  longitude: number;
  risk_score: number;
  alert_sent: boolean;
  occurred_at: string;
  geofence?: GeofenceResponse;
}

// Risk scoring configuration
export interface RiskScoringConfig {
  LOW: { min: number; max: number };
  MEDIUM: { min: number; max: number };
  HIGH: { min: number; max: number };
}

export const DEFAULT_RISK_SCORING: RiskScoringConfig = {
  LOW: { min: 0, max: 39 },
  MEDIUM: { min: 40, max: 79 },
  HIGH: { min: 80, max: 100 }
};
