"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { MapPin, Shield, AlertTriangle, Navigation, Users, Clock, Bell, Settings, Home, Map } from 'lucide-react';
import GeofenceMap from './dynamic-geofence-map';

interface TouristInterfaceProps {
  userId?: number;
  className?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface NearbyZone {
  id: number;
  name: string;
  type: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  distance: number;
  description?: string;
}

interface SafetyScore {
  score: number;
  level: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CAUTION' | 'DANGER';
  factors: string[];
}

interface NotificationItem {
  id: number;
  type: 'breach' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  zone_name?: string;
}

const TouristInterface: React.FC<TouristInterfaceProps> = ({ 
  userId = 1,
  className = '' 
}) => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [nearbyZones, setNearbyZones] = useState<NearbyZone[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [safetyScore, setSafetyScore] = useState<SafetyScore>({
    score: 85,
    level: 'GOOD',
    factors: ['Safe area', 'Daylight hours', 'Good connectivity']
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'map' | 'notifications'>('home');
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);

  // Initialize location tracking
  useEffect(() => {
    requestLocationPermission();
    loadNotifications();
    loadGeofences();
  }, []);

  // Track location every 30 seconds
  useEffect(() => {
    if (locationPermission) {
      const interval = setInterval(updateLocation, 30000);
      updateLocation(); // Initial location
      return () => clearInterval(interval);
    }
  }, [locationPermission]);

  const requestLocationPermission = async () => {
    try {
      if (!('geolocation' in navigator)) {
        console.error('Geolocation is not supported by this browser');
        setLocationPermission(false);
        setIsLocationLoading(false);
        return;
      }

      // Check current permission state
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Location permission state:', permission.state);
        
        if (permission.state === 'granted') {
          setLocationPermission(true);
          setIsLocationLoading(false);
          return;
        }
      }

      // Request permission by attempting to get location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location permission granted:', position.coords);
          setLocationPermission(true);
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Location permission denied:', error);
          setLocationPermission(false);
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      setIsLocationLoading(false);
    }
  };

  const updateLocation = () => {
    if (!locationPermission) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 30000 // Reduced max age for more frequent updates
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Location obtained:', position.coords);
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };

        setCurrentLocation(newLocation);
        await checkLocationSafety(newLocation);
        await loadNearbyZones(newLocation);
      },
      (error) => {
        console.error('Error getting location:', error);
        
        // Provide more detailed error handling
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Trying again...';
            // Retry with less strict options
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const newLocation: UserLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                  };
                  setCurrentLocation(newLocation);
                  await checkLocationSafety(newLocation);
                  await loadNearbyZones(newLocation);
                },
                () => console.error('Retry failed'),
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
              );
            }, 1000);
            break;
        }
        
        // You can add a toast notification here
        console.warn(errorMessage);
      },
      options
    );
  };

  const checkLocationSafety = async (location: UserLocation) => {
    try {
      const response = await fetch('/api/geofences/check-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          user_id: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.breaches?.length > 0) {
          // Handle breach notifications
          const breach = data.data.breaches[0];
          addNotification({
            id: Date.now(),
            type: 'breach',
            title: 'Zone Alert',
            message: `You've entered ${breach.geofence_name}. Please be cautious.`,
            timestamp: new Date().toISOString(),
            zone_name: breach.geofence_name
          });
        }
      }
    } catch (error) {
      console.error('Error checking location safety:', error);
    }
  };

  const loadNearbyZones = async (location: UserLocation) => {
    try {
      // Mock nearby zones data - would come from API
      const mockZones: NearbyZone[] = [
        {
          id: 1,
          name: 'Tourist Safe Zone',
          type: 'SAFE_ZONE',
          risk_level: 'LOW',
          distance: 150,
          description: 'Well-lit area with tourist police presence'
        },
        {
          id: 2,
          name: 'Market District Alert',
          type: 'ALERT_ZONE',
          risk_level: 'MEDIUM',
          distance: 300,
          description: 'Crowded area - watch for pickpockets'
        },
        {
          id: 3,
          name: 'Construction Zone',
          type: 'RESTRICTED',
          risk_level: 'HIGH',
          distance: 500,
          description: 'Restricted access - safety hazard'
        }
      ];

      setNearbyZones(mockZones);
      updateSafetyScore(mockZones);
    } catch (error) {
      console.error('Error loading nearby zones:', error);
    }
  };

  const loadGeofences = async () => {
    try {
      const response = await fetch('/api/geofences');
      if (response.ok) {
        const data = await response.json();
        setGeofences(data.data?.geofences || []);
      }
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  };

  const updateSafetyScore = (zones: NearbyZone[]) => {
    const closestHighRisk = zones.find(z => z.risk_level === 'HIGH' && z.distance < 200);
    const closestMediumRisk = zones.find(z => z.risk_level === 'MEDIUM' && z.distance < 100);
    const nearSafeZone = zones.find(z => z.type === 'SAFE_ZONE' && z.distance < 300);

    let score = 85;
    let level: SafetyScore['level'] = 'GOOD';
    let factors: string[] = [];

    if (closestHighRisk) {
      score -= 30;
      factors.push('High risk zone nearby');
    }
    if (closestMediumRisk) {
      score -= 15;
      factors.push('Alert zone in proximity');
    }
    if (nearSafeZone) {
      score += 10;
      factors.push('Near safe zone');
    }

    factors.push('GPS tracking active');
    factors.push(new Date().getHours() >= 6 && new Date().getHours() <= 20 ? 'Daylight hours' : 'Night hours');

    if (score >= 80) level = 'EXCELLENT';
    else if (score >= 65) level = 'GOOD';
    else if (score >= 50) level = 'MODERATE';
    else if (score >= 30) level = 'CAUTION';
    else level = 'DANGER';

    setSafetyScore({ score: Math.max(0, Math.min(100, score)), level, factors });
  };

  const loadNotifications = () => {
    // Mock notifications - would come from API/WebSocket
    setNotifications([
      {
        id: 1,
        type: 'info',
        title: 'Welcome!',
        message: 'Your location tracking is now active. Stay safe!',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const addNotification = (notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'SAFE_ZONE': return <Shield className="w-4 h-4 text-green-600" />;
      case 'ALERT_ZONE': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'RESTRICTED': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Current Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLocationLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Getting your location...</p>
            </div>
          ) : !locationPermission ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Location Access Required</AlertTitle>
              <AlertDescription>
                Please enable location access to use safety features.
                <Button onClick={requestLocationPermission} className="ml-2 mt-2">
                  Enable Location
                </Button>
              </AlertDescription>
            </Alert>
          ) : currentLocation ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Accuracy: ±{Math.round(currentLocation.accuracy)}m • 
                    Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={updateLocation}
                  className="flex items-center space-x-1"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">Location unavailable</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={updateLocation}
                className="flex items-center space-x-1"
              >
                <Navigation className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Safety Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={safetyScore.score} className="h-3" />
              </div>
              <div className="text-2xl font-bold">{safetyScore.score}</div>
            </div>
            <Badge className={`${getSafetyScoreColor(safetyScore.score)} text-white`}>
              {safetyScore.level}
            </Badge>
            <div className="space-y-1">
              {safetyScore.factors.map((factor, index) => (
                <p key={index} className="text-sm text-gray-600">• {factor}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Nearby Zones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nearbyZones.map((zone) => (
              <div key={zone.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                {getZoneIcon(zone.type)}
                <div className="flex-1">
                  <div className="font-medium">{zone.name}</div>
                  <div className="text-sm text-gray-600">{zone.description}</div>
                  <div className="text-xs text-gray-500">{zone.distance}m away</div>
                </div>
                <Badge variant={zone.risk_level === 'HIGH' ? 'destructive' : 'secondary'}>
                  {zone.risk_level}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Bell className="w-6 h-6" />
              <span className="text-sm">Emergency Alert</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Find Tourist Help</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMapView = () => (
    <div className="h-full">
      <GeofenceMap
        height="calc(100vh - 200px)"
        mode="tourist"
        userLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : undefined}
        geofences={geofences}
      />
    </div>
  );

  const renderNotificationsView = () => (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'breach' ? 'bg-red-100 text-red-600' :
                  notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {notification.type === 'breach' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className={`max-w-md mx-auto bg-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Tourist Safety</h1>
        <p className="text-blue-100 text-sm">Stay safe while exploring</p>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'map' && renderMapView()}
        {activeView === 'notifications' && renderNotificationsView()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveView('home')}
              className={`flex-1 py-3 px-4 text-center ${
                activeView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Home className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`flex-1 py-3 px-4 text-center ${
                activeView === 'map' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Map className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">Map</span>
            </button>
            <button
              onClick={() => setActiveView('notifications')}
              className={`flex-1 py-3 px-4 text-center relative ${
                activeView === 'notifications' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Bell className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">Alerts</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1/2 transform translate-x-2 -translate-y-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristInterface;
