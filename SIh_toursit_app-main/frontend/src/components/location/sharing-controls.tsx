import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, Clock } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

interface Location {
  latitude: number;
  longitude: number;
}

interface SharingControlsProps {
  isSharing: boolean;
  onSharingToggle: (isSharing: boolean) => void;
  onError: (error: string) => void;
  currentLocation?: Location;
  onPrivacyLevelChange?: (level: string) => void;
  privacyLevel?: string;
}

export const SharingControls: React.FC<SharingControlsProps> = ({
  isSharing,
  onSharingToggle,
  onError,
  currentLocation,
  onPrivacyLevelChange,
  privacyLevel = 'medium',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSharingToggle = async () => {
    setIsLoading(true);
    
    try {
      const action = isSharing ? 'stop' : 'start';
      const response = await authenticatedFetch('/api/location/share', {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        onSharingToggle(!isSharing);
      } else {
        throw new Error(result.message || 'Failed to toggle sharing');
      }
    } catch (error) {
      const errorMessage = `Error ${isSharing ? 'stopping' : 'starting'} location sharing`;
      onError(errorMessage);
      console.error(`Failed to ${isSharing ? 'stop' : 'start'} location sharing:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLocation = (location: Location) => {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const getPrivacyLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'low':
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Sharing Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isSharing ? 'default' : 'secondary'}>
            {isSharing ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Current Location (when sharing) */}
        {isSharing && currentLocation && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Current Location:</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatLocation(currentLocation)}
            </div>
          </div>
        )}

        {/* Privacy Level Selector (when sharing) */}
        {isSharing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getPrivacyLevelIcon(privacyLevel)}
              <span className="text-sm font-medium">Privacy Level:</span>
            </div>
            <Select 
              value={privacyLevel} 
              onValueChange={onPrivacyLevelChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Exact location</SelectItem>
                <SelectItem value="medium">Medium - Approximate area</SelectItem>
                <SelectItem value="high">High - General vicinity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sharing Toggle Button */}
        <Button
          onClick={handleSharingToggle}
          disabled={isLoading}
          variant={isSharing ? 'destructive' : 'default'}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              {isSharing ? 'Stopping...' : 'Starting...'}
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
            </>
          )}
        </Button>

        {/* Information Text */}
        <p className="text-xs text-gray-500 text-center">
          {isSharing 
            ? 'Your location is being shared with authorized contacts'
            : 'Click to start sharing your location with emergency contacts'
          }
        </p>
      </CardContent>
    </Card>
  );
};
