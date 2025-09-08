import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Shield, Target } from 'lucide-react';

export interface PrecisionLevel {
  value: string;
  label: string;
  description: string;
  accuracy: string;
  privacyLevel: 'low' | 'medium' | 'high';
  recommended?: boolean;
}

interface PrecisionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const precisionLevels: PrecisionLevel[] = [
  {
    value: 'exact',
    label: 'Exact Location',
    description: 'Shares your exact GPS coordinates',
    accuracy: '±5m accuracy',
    privacyLevel: 'low'
  },
  {
    value: 'street',
    label: 'Street Level (±100m)',
    description: 'Shares approximate location with some privacy',
    accuracy: '±100m accuracy',
    privacyLevel: 'medium',
    recommended: true
  },
  {
    value: 'neighborhood',
    label: 'Neighborhood Level',
    description: 'Shares general neighborhood area',
    accuracy: '±1km accuracy',
    privacyLevel: 'medium'
  },
  {
    value: 'city',
    label: 'City Level',
    description: 'Only shares your city or town',
    accuracy: 'City-level accuracy',
    privacyLevel: 'high'
  }
];

const getPrivacyBadgeText = (level: 'low' | 'medium' | 'high'): string => {
  switch (level) {
    case 'low': return 'High Precision';
    case 'medium': return 'Balanced';
    case 'high': return 'High Privacy';
  }
};

const getPrivacyBadgeVariant = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'low': return 'destructive';
    case 'medium': return 'default';
    case 'high': return 'secondary';
  }
};

const getIcon = (value: string) => {
  switch (value) {
    case 'exact': return <Target className="h-4 w-4" />;
    case 'approximate': return <MapPin className="h-4 w-4" />;
    case 'city': return <MapPin className="h-4 w-4" />;
    case 'region': return <Shield className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

export function PrecisionSelector({ value, onChange, disabled }: PrecisionSelectorProps) {
  const selectedLevel = precisionLevels.find(level => level.value === value) || precisionLevels[1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Location Precision Level</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how precise your location sharing will be
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger 
              aria-label="Location precision level"
              aria-describedby="precision-description"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {precisionLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex items-center gap-2">
                    {getIcon(level.value)}
                    <span>{level.label}</span>
                    {level.recommended && (
                      <Badge variant="secondary" data-testid="recommended-badge">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visual Precision Indicator */}
        <div data-testid="precision-visual" className="flex items-center justify-center p-4 bg-muted rounded-lg">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center">
              {getIcon(value)}
            </div>
            {value === 'exact' && (
              <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-pulse" />
            )}
            {value === 'approximate' && (
              <div className="absolute -inset-2 rounded-full border border-blue-300 opacity-50" />
            )}
            {value === 'city' && (
              <div className="absolute -inset-4 rounded-full border border-green-300 opacity-30" />
            )}
            {value === 'region' && (
              <div className="absolute -inset-6 rounded-full border border-gray-300 opacity-20" />
            )}
          </div>
        </div>

        {/* Selected Level Information */}
        <div 
          role="region" 
          aria-label="Precision level description"
          id="precision-description"
          className="space-y-2 p-3 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedLevel.label}</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getPrivacyBadgeVariant(selectedLevel.privacyLevel)}
                data-testid="privacy-indicator"
              >
                {getPrivacyBadgeText(selectedLevel.privacyLevel)}
              </Badge>
              {selectedLevel.recommended && (
                <Badge variant="secondary">Recommended</Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {selectedLevel.description}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{selectedLevel.accuracy}</span>
            {selectedLevel.privacyLevel === 'low' && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" data-testid="warning-icon" />
                <span>This will share your exact location</span>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Tip:</strong> You can change this setting anytime for different sharing sessions.</p>
          {selectedLevel.privacyLevel === 'low' && (
            <p className="text-orange-600">⚠️ Exact location sharing may pose privacy risks in public spaces.</p>
          )}
          {selectedLevel.recommended && (
            <p className="text-green-600">✓ This setting provides a good balance of utility and privacy.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
