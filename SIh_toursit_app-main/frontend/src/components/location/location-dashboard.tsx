'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SharingControls } from './sharing-controls';
import { AccessHistory } from './access-history';
import { MapPin, Users, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

interface LocationSharingStatus {
  isSharing: boolean;
  startTime?: Date;
  sharedWith?: string[];
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface PrivacySettings {
  emergencyAccessEnabled: boolean;
  precisionLevel: string;
  timeBasedSharing: boolean;
}

export function LocationDashboard() {
  // Mock user ID for testing - in production this would come from auth context
  const userId = "123";
  
  const [sharingStatus, setSharingStatus] = useState<LocationSharingStatus>({
    isSharing: false,
  });
  const [error, setError] = useState<string>('');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    emergencyAccessEnabled: true,
    precisionLevel: 'medium',
    timeBasedSharing: false,
  });
  const [refreshHistory, setRefreshHistory] = useState(false);

  // Load current sharing status on component mount
  useEffect(() => {
    loadSharingStatus();
  }, []);

  const loadSharingStatus = async () => {
    try {
      // Try to get active sharing status
      const response = await authenticatedFetch(`/api/location/user/${userId}/active`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setSharingStatus({
            isSharing: true,
            startTime: new Date(result.data[0].created_at),
            sharedWith: [], // This would need to be parsed from the data
          });
        } else {
          setSharingStatus({ isSharing: false });
        }
      } else {
        // Fallback to default state if endpoint doesn't exist
        setSharingStatus({ isSharing: false });
      }
    } catch (error) {
      console.error('Failed to load sharing status:', error);
      setError('Failed to load sharing status');
      setSharingStatus({ isSharing: false });
    }
  };

  const handleSharingToggle = (isSharing: boolean) => {
    setSharingStatus(prev => ({
      ...prev,
      isSharing,
      startTime: isSharing ? new Date() : undefined,
      currentLocation: isSharing ? { latitude: 40.7128, longitude: -74.0060 } : undefined,
    }));
    
    // Refresh access history when sharing status changes
    setRefreshHistory(prev => !prev);
  };

  const handlePrivacyLevelChange = async (level: string) => {
    setPrivacySettings(prev => ({ ...prev, precisionLevel: level }));
    
    try {
      await fetch('/api/location/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precisionLevel: level }),
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const handleEmergencyAccessToggle = async (enabled: boolean) => {
    setPrivacySettings(prev => ({ ...prev, emergencyAccessEnabled: enabled }));
    
    try {
      await fetch('/api/location/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyAccessEnabled: enabled }),
      });
    } catch (error) {
      console.error('Failed to update emergency access setting:', error);
      setError('Failed to update emergency access setting');
    }
  };

  const handleTimeBasedSharingToggle = async (enabled: boolean) => {
    setPrivacySettings(prev => ({ ...prev, timeBasedSharing: enabled }));
    
    try {
      await fetch('/api/location/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeBasedSharing: enabled }),
      });
    } catch (error) {
      console.error('Failed to update time-based sharing setting:', error);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(''), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Location Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your location sharing and privacy settings
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sharing Controls */}
          <SharingControls
            isSharing={sharingStatus.isSharing}
            onSharingToggle={handleSharingToggle}
            onError={handleError}
            currentLocation={sharingStatus.currentLocation}
            onPrivacyLevelChange={handlePrivacyLevelChange}
            privacyLevel={privacySettings.precisionLevel}
          />

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency-access">Emergency Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow emergency services to access location
                  </p>
                </div>
                <Switch
                  id="emergency-access"
                  checked={privacySettings.emergencyAccessEnabled}
                  onCheckedChange={handleEmergencyAccessToggle}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="time-based">Time-based Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically stop sharing after set duration
                  </p>
                </div>
                <Switch
                  id="time-based"
                  checked={privacySettings.timeBasedSharing}
                  onCheckedChange={handleTimeBasedSharingToggle}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Location Sharing:</span>
                <Badge variant={sharingStatus.isSharing ? 'default' : 'secondary'}>
                  {sharingStatus.isSharing ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {sharingStatus.isSharing && sharingStatus.startTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Started:</span>
                  <span className="text-sm text-muted-foreground">
                    {sharingStatus.startTime.toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emergency Access:</span>
                <Badge variant={privacySettings.emergencyAccessEnabled ? 'default' : 'secondary'}>
                  {privacySettings.emergencyAccessEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Access History */}
          <AccessHistory refresh={refreshHistory} />
        </div>
      </div>
    </div>
  );
}
