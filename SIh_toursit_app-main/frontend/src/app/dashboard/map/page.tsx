"use client";

import { motion } from "framer-motion";
import Map from "@/components/safespot/map";
import SafetyScore from "@/components/safespot/safety-score";
import SosButton from "@/components/safespot/sos-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListFilter, LocateFixed, Shield, MapPin, Navigation, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export default function TouristMapPage() {
  const [geofences, setGeofences] = useState([]);
  const [mapRef, setMapRef] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch geofences from API (same as admin)
  useEffect(() => {
    fetch("/api/geofences")
      .then((res) => res.json())
      .then((data) => setGeofences(data.data?.geofences || []));
  }, []);

  // Get current location for pan
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  const panToCurrentLocation = () => {
    if (mapRef && currentPosition) {
      mapRef.panTo(currentPosition);
      mapRef.setZoom(16);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Interactive Safety Map</h1>
          <p className="text-muted-foreground">Real-time safety insights and navigation</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Map Section */}
        <motion.div 
          className="lg:col-span-2 h-[400px] lg:h-[calc(100vh-200px)] relative rounded-xl overflow-hidden shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Map
            className="absolute inset-0"
            showCurrentLocation={true}
            showControls={true}
            showGeofences={true}
            geofences={geofences}
            onLoad={setMapRef}
          />
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-12 w-12 shadow-lg backdrop-blur-sm bg-white/80 hover:bg-white"
                onClick={panToCurrentLocation}
              >
                <LocateFixed className="h-5 w-5 text-foreground" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-12 w-12 shadow-lg backdrop-blur-sm bg-white/80 hover:bg-white"
              >
                <Shield className="h-5 w-5 text-foreground" />
              </Button>
            </motion.div>
          </div>
          
          {/* Map Legend */}
          <motion.div 
            className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="font-semibold text-sm mb-2 text-foreground">Safety Zones</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-foreground">Safe</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-foreground">Caution</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-foreground">Avoid</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* SOS Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <SosButton />
          </motion.div>

          {/* Safety Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <SafetyScore />
          </motion.div>

          {/* Visit Window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Visit Window
                </CardTitle>
                <CardDescription>Your current trip details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Start:</strong> Aug 10, 2024</p>
                  <p><strong>End:</strong> Aug 20, 2024</p>
                  <p><strong>Region:</strong> Mumbai, India</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Map Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Map Features
                </CardTitle>
                <CardDescription>Available map functionalities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    title: "Live Safety Zones",
                    description: "Color-coded areas showing real-time safety levels",
                    icon: Shield,
                  },
                  {
                    title: "Smart Navigation",
                    description: "AI-powered route planning for maximum safety",
                    icon: Navigation,
                  },
                  {
                    title: "Points of Interest",
                    description: "Discover safe attractions, restaurants, and services",
                    icon: MapPin,
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}