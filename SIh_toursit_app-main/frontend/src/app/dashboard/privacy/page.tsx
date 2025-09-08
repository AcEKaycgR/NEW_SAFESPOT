"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { PrivacyControls } from '@/components/location/privacy-controls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Settings, Info, Lock, Eye, AlertTriangle } from 'lucide-react';

interface PrivacySettings {
  precisionLevel: string;
  emergencyAccess: boolean;
  timeBasedSharing: boolean;
  maxSharingDuration: number;
  autoStopSharing: boolean;
  allowedContacts: string[];
  blockedContacts: string[];
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    precisionLevel: 'medium',
    emergencyAccess: true,
    timeBasedSharing: false,
    maxSharingDuration: 60,
    autoStopSharing: true,
    allowedContacts: [],
    blockedContacts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in real app, get from auth context
  const userId = 'user-123';

  useEffect(() => {
    // Load existing privacy settings
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // In a real app, fetch from API
        // const response = await fetch(`/api/privacy/settings/${userId}`);
        // const data = await response.json();
        // setSettings(data);
        
        // For now, use default settings
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load privacy settings');
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const handleSettingsUpdate = (newSettings: PrivacySettings) => {
    setSettings(newSettings);
  };

  const getPrecisionBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="text-3xl"
            >
              🔐
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Privacy Controls</h1>
              <p className="text-muted-foreground">
                Manage your location sharing privacy and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Current Settings Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Current Privacy Settings</CardTitle>
              </div>
              <CardDescription>
                Overview of your current privacy configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Precision Level</span>
                  <Badge className={getPrecisionBadgeColor(settings.precisionLevel)}>
                    {settings.precisionLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Emergency Access</span>
                  <Badge variant={settings.emergencyAccess ? "default" : "secondary"}>
                    {settings.emergencyAccess ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Auto-stop Sharing</span>
                  <Badge variant={settings.autoStopSharing ? "default" : "secondary"}>
                    {settings.autoStopSharing ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Understanding Your Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Data Protection</h4>
                  </div>
                  <p className="text-sm text-blue-800">
                    Your location data is encrypted and securely stored with blockchain technology
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Transparency</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    You can always see who has accessed your location through the access history
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <h4 className="font-medium text-purple-900">Control</h4>
                  </div>
                  <p className="text-sm text-purple-800">
                    You have complete control over when and how your location is shared
                  </p>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your privacy settings control how your location is shared and who can access it. 
                  Changes are applied immediately and affect all active sharing sessions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Privacy Controls Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Configure your location sharing privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrivacyControls
                userId={userId}
                settings={settings}
                onUpdate={handleSettingsUpdate}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}