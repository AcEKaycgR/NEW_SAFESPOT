"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Camera, Edit2, Settings, Shield, Bell, Globe, Moon, Sun, Volume2, VolumeX, User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DigitalIdCard from "@/components/safespot/digital-id-card";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, USA",
    avatar: ""
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    locationSharing: true,
    motionEffects: true,
    language: "english",
    units: "metric",
    safetyAlerts: true,
    itinerarySharing: false,
    geofenceAlerts: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [avatarRotation, setAvatarRotation] = useState(0);

  const handleAvatarSpin = () => {
    setAvatarRotation(prev => prev + 360);
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
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
            className="inline-block text-4xl mb-4"
          >
            👤
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Digital ID and Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Digital ID Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Digital ID
                  </CardTitle>
                  <CardDescription>
                    Your verified travel identity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DigitalIdCard />
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Manage your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: avatarRotation }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarSpin}>
                          <AvatarImage src={profile.avatar} />
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-md"
                      >
                        <Camera className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={profile.location}
                          onChange={(e) => setProfile({...profile, location: e.target.value})}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant={isEditing ? "default" : "outline"}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isEditing ? "Save Changes" : "Edit Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Preferences */}
          <div className="space-y-6">
            {/* Preferences Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme & Display */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Theme & Display
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                          <div>
                            <Label className="text-sm font-medium">Dark Mode</Label>
                            <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.darkMode}
                          onCheckedChange={(value) => handlePreferenceChange('darkMode', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {preferences.motionEffects ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          <div>
                            <Label className="text-sm font-medium">Motion Effects</Label>
                            <p className="text-xs text-muted-foreground">Reduce motion for better accessibility</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.motionEffects}
                          onCheckedChange={(value) => handlePreferenceChange('motionEffects', value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="hindi">Hindi</SelectItem>
                              <SelectItem value="bengali">Bengali</SelectItem>
                              <SelectItem value="tamil">Tamil</SelectItem>
                              <SelectItem value="telugu">Telugu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Units</Label>
                          <Select value={preferences.units} onValueChange={(value) => handlePreferenceChange('units', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="metric">Metric</SelectItem>
                              <SelectItem value="imperial">Imperial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Privacy & Safety */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Privacy & Safety
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Location Sharing</Label>
                          <p className="text-xs text-muted-foreground">Share your location with trusted contacts</p>
                        </div>
                        <Switch
                          checked={preferences.locationSharing}
                          onCheckedChange={(value) => handlePreferenceChange('locationSharing', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Safety Alerts</Label>
                          <p className="text-xs text-muted-foreground">Receive real-time safety notifications</p>
                        </div>
                        <Switch
                          checked={preferences.safetyAlerts}
                          onCheckedChange={(value) => handlePreferenceChange('safetyAlerts', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Itinerary Sharing</Label>
                          <p className="text-xs text-muted-foreground">Allow others to view your travel plans</p>
                        </div>
                        <Switch
                          checked={preferences.itinerarySharing}
                          onCheckedChange={(value) => handlePreferenceChange('itinerarySharing', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Geofence Alerts</Label>
                          <p className="text-xs text-muted-foreground">Alerts when entering risk zones</p>
                        </div>
                        <Switch
                          checked={preferences.geofenceAlerts}
                          onCheckedChange={(value) => handlePreferenceChange('geofenceAlerts', value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notifications */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive notifications on your device</p>
                        </div>
                        <Switch
                          checked={preferences.notifications}
                          onCheckedChange={(value) => handlePreferenceChange('notifications', value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Data Management</CardTitle>
                  <CardDescription>
                    Account and data controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <h4 className="font-semibold text-destructive mb-2">Delete My Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}