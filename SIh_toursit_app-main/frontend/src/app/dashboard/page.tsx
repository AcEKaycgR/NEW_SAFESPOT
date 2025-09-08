"use client";

import { motion } from "framer-motion";
import { 
  Map, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Phone,
  MapPin, 
  Clock, 
  Users, 
  Zap,
  User,
  Bell,
  Navigation,
  Info,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PanicFAB } from "@/components/ui/panic-fab";
import Link from "next/link";
import MapComponent from "@/components/safespot/map";
import SafetyScoreWrapper from "@/components/safespot/safety-score-wrapper";
import DigitalIdCard from "@/components/safespot/digital-id-card";
import { useItineraryStore } from "@/store/itinerary-store";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { items } = useItineraryStore();
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [safetyExplanation, setSafetyExplanation] = useState<string>("");
  
  // Filter today's itinerary items
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const filteredItems = items.filter(item => item.date === today);
    setTodayItems(filteredItems);
  }, [items]);

  const quickActions = [
    {
      title: "Live Map",
      description: "See safety insights around you",
      icon: Map,
      href: "/dashboard/map"
    },
    {
      title: "Plan Trip",
      description: "Create safe itineraries with AI",
      icon: Calendar,
      href: "/dashboard/itinerary"
    },
    {
      title: "Safety Alerts",
      description: "Stay updated on local conditions",
      icon: AlertTriangle,
      href: "/dashboard/notifications"
    },
    {
      title: "View Digital ID",
      description: "Access your verified identity",
      icon: User,
      href: "/dashboard/profile"
    },
    {
      title: "Location Sharing",
      description: "Control your location privacy",
      icon: Navigation,
      href: "/dashboard/location"
    },
    {
      title: "Privacy Controls",
      description: "Manage your data preferences",
      icon: Shield,
      href: "/dashboard/privacy"
    }
  ];

  const recentActivity = [
    {
      title: "Safety score updated",
      description: "Your current location score: 85/100",
      time: "2 minutes ago",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "New area explored",
      description: "Added Downtown District to your map",
      time: "1 hour ago",
      icon: MapPin,
      color: "text-primary"
    },
    {
      title: "Itinerary completed",
      description: "Museum District tour finished safely",
      time: "3 hours ago",
      icon: Calendar,
      color: "text-accent"
    }
  ];

  // Use a fixed date format to avoid hydration mismatch
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Welcome back, Explorer! 👋
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Ready for another safe adventure? Here's your travel dashboard.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Safety Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-normal">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display">Current Safety</CardTitle>
                <CardDescription>Live score for your location</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <SafetyScoreWrapper onExplanationChange={setSafetyExplanation} />
                {safetyExplanation && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg w-full">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {safetyExplanation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Quick Actions</CardTitle>
                <CardDescription>Jump into your most used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={action.title} href={action.href}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl text-left transition-all duration-normal hover:shadow-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50"
                      >
                        <action.icon className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {action.title}
                        </h3>
                        <p className="text-muted-foreground text-sm font-body">
                          {action.description}
                        </p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Live Map</CardTitle>
                <CardDescription>Your current location and nearby safety alerts</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <MapComponent showCurrentLocation showControls />
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/map">View Full Map</Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* SOS Button - now using PanicFAB */}
          <PanicFAB />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Itinerary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Today's Itinerary</CardTitle>
                <CardDescription>Your plans for {formattedDate}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayItems.length > 0 ? todayItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-md">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No plans for today. Use the Assistant to add some!
                  </p>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/dashboard/itinerary">
                    Manage Full Itinerary
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Stats & Digital ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Your Profile</CardTitle>
                <CardDescription>Your travel identity and stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Digital ID */}
                <div>
                  <h3 className="font-semibold mb-3">Digital ID</h3>
                  <DigitalIdCard simple />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                  >
                    <div className="font-display font-bold text-2xl text-success">12</div>
                    <div className="text-sm text-muted-foreground">Safe Areas</div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
                  >
                    <div className="font-display font-bold text-2xl text-primary">2.5km</div>
                    <div className="text-sm text-muted-foreground">Explored</div>
                  </motion.div>
                </div>

                {/* View Full Profile Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <Button 
                    variant="outline"
                    className="w-full font-display font-semibold"
                    asChild
                  >
                    <Link href="/dashboard/profile">
                      View Full Profile
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;