import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrecisionSelector } from './precision-selector';
import { Users, Clock, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

export interface PrivacySettings {
  precisionLevel: string;
  emergencyAccess: boolean;
  timeBasedSharing: boolean;
  maxSharingDuration: number;
  sharingDurationHours: number; // New field for hours input
  autoStopSharing: boolean;
  allowedContacts: string[];
  blockedContacts: string[];
}

interface PrivacyControlsProps {
  userId: string;
  settings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => void;
}

export function PrivacyControls({ userId, settings, onUpdate }: PrivacyControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  const updateSettings = async (updates: Partial<PrivacySettings>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Map frontend field names to backend field names
      const backendUpdates: any = {};
      if (updates.precisionLevel !== undefined) {
        backendUpdates.defaultPrecision = updates.precisionLevel; // Keep as-is, no conversion needed
      }
      if (updates.emergencyAccess !== undefined) {
        backendUpdates.allowEmergencyServices = updates.emergencyAccess;
      }
      if (updates.maxSharingDuration !== undefined) {
        backendUpdates.autoExpireMinutes = updates.maxSharingDuration;
      }
      // Add other field mappings as needed

      const response = await authenticatedFetch('/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(backendUpdates) // Send only the privacy settings, not userId
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const newSettings = { ...settings, ...updates };
      onUpdate(newSettings);
    } catch (err) {
      setError('Failed to update privacy settings');
      console.error('Privacy settings update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrecisionChange = (precisionLevel: string) => {
    updateSettings({ precisionLevel });
  };

  const handleEmergencyAccessToggle = (emergencyAccess: boolean) => {
    updateSettings({ emergencyAccess });
  };

  const handleTimeBasedToggle = (timeBasedSharing: boolean) => {
    updateSettings({ timeBasedSharing });
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value);
    setDurationError(null);

    if (duration < 5) {
      setDurationError('Duration must be at least 5 minutes');
      return;
    }

    if (duration > 1440) {
      setDurationError('Duration cannot exceed 1440 minutes (24 hours)');
      return;
    }

    updateSettings({ maxSharingDuration: duration });
  };

  const handleDurationHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseFloat(event.target.value);
    setDurationError(null);

    if (hours < 0.1) {
      setDurationError('Duration must be at least 0.1 hours (6 minutes)');
      return;
    }

    if (hours > 24) {
      setDurationError('Duration cannot exceed 24 hours');
      return;
    }

    const minutes = Math.round(hours * 60);
    updateSettings({ 
      maxSharingDuration: minutes,
      sharingDurationHours: hours 
    });
  };

  const handleAutoStopToggle = (autoStopSharing: boolean) => {
    updateSettings({ autoStopSharing });
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Updating...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Control how your location is shared and who can access it
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Precision */}
          <div>
            <Label className="text-base font-medium">Location Precision</Label>
            <div className="mt-2">
              <PrecisionSelector
                value={settings.precisionLevel}
                onChange={handlePrecisionChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <Separator />

          {/* Emergency Access */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label 
                htmlFor="emergency-access"
                className="text-base font-medium"
              >
                Emergency Access
              </Label>
              <p 
                className="text-sm text-muted-foreground"
                id="emergency-access-description"
              >
                Allow emergency services to access your location even when sharing is disabled
              </p>
            </div>
            <Switch
              id="emergency-access"
              checked={settings.emergencyAccess}
              onCheckedChange={handleEmergencyAccessToggle}
              disabled={isLoading}
              aria-describedby="emergency-access-description"
            />
          </div>

          <Separator />

          {/* Time-based Sharing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label 
                  htmlFor="time-based"
                  className="text-base font-medium flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Time-based Sharing
                </Label>
                <p 
                  className="text-sm text-muted-foreground"
                  id="time-based-description"
                >
                  Automatically manage sharing duration and controls
                </p>
              </div>
              <Switch
                id="time-based"
                checked={settings.timeBasedSharing}
                onCheckedChange={handleTimeBasedToggle}
                disabled={isLoading}
                aria-describedby="time-based-description"
              />
            </div>

            {/* Duration Controls - Only show when time-based sharing is enabled */}
            {settings.timeBasedSharing && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration-hours">Duration (hours)</Label>
                      <Input
                        id="duration-hours"
                        type="number"
                        min="0.1"
                        max="24"
                        step="0.1"
                        value={settings.sharingDurationHours || Math.round((settings.maxSharingDuration / 60) * 10) / 10}
                        onChange={handleDurationHoursChange}
                        disabled={isLoading}
                        className={durationError ? 'border-red-500' : ''}
                        placeholder="e.g., 2.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="1440"
                        value={settings.maxSharingDuration}
                        onChange={handleDurationChange}
                        disabled={isLoading}
                        className={durationError ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>
                  {durationError && (
                    <p className="text-sm text-red-500">{durationError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Set sharing duration in hours (with decimals) or minutes. Changes in either field will update both.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label 
                      htmlFor="auto-stop"
                      className="text-sm font-medium"
                    >
                      Auto-stop after duration
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically stop sharing when duration expires
                    </p>
                  </div>
                  <Switch
                    id="auto-stop"
                    checked={settings.autoStopSharing}
                    onCheckedChange={handleAutoStopToggle}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contact Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage which contacts can request and access your location
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Allowed Contacts</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {settings.allowedContacts.length > 0 ? (
                settings.allowedContacts.map((contact, index) => (
                  <Badge key={index} variant="secondary">
                    {contact}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No allowed contacts set</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Blocked Contacts</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {settings.blockedContacts.length > 0 ? (
                settings.blockedContacts.map((contact, index) => (
                  <Badge key={index} variant="destructive">
                    {contact}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No blocked contacts</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm" disabled={isLoading}>
              Manage Contacts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Privacy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Precision Level:</span>
              <Badge variant="outline">{settings.precisionLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Emergency Access:</span>
              <Badge variant={settings.emergencyAccess ? 'default' : 'secondary'}>
                {settings.emergencyAccess ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Time Controls:</span>
              <Badge variant={settings.timeBasedSharing ? 'default' : 'secondary'}>
                {settings.timeBasedSharing ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            {settings.timeBasedSharing && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Max Duration:</span>
                <span>{settings.maxSharingDuration} minutes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
