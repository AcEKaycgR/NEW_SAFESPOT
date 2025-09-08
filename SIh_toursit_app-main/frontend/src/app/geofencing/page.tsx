"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, MapPin, Activity, Globe, Smartphone, Monitor } from 'lucide-react';
import GeofenceDashboard from '@/components/geofencing/geofence-dashboard';
import TouristInterface from '@/components/geofencing/tourist-interface';
import GeofenceMap from '@/components/geofencing/geofence-map';

const GeofencingDemo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'overview' | 'admin' | 'tourist'>('overview');

  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-blue-600" />,
      title: "Dynamic Polygon Zones",
      description: "Create custom geofenced areas with any polygon shape"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Real-time Safety Monitoring",
      description: "Continuous location tracking with instant breach detection"
    },
    {
      icon: <Activity className="w-8 h-8 text-orange-600" />,
      title: "WebSocket Alerts",
      description: "Immediate notifications for geofence breaches and safety alerts"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Multi-user Management",
      description: "Track multiple tourists with individual safety profiles"
    }
  ];

  const stats = [
    { label: "Active Zones", value: "12", color: "text-blue-600" },
    { label: "Tracked Users", value: "84", color: "text-green-600" },
    { label: "Safety Score", value: "94%", color: "text-orange-600" },
    { label: "Response Time", value: "<2s", color: "text-purple-600" }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Dynamic Geofencing System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced tourist safety platform with real-time location monitoring, 
          polygon-based geofencing, and instant breach alerts
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <Button 
            onClick={() => setDemoMode('admin')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
          <Button 
            onClick={() => setDemoMode('tourist')}
            variant="outline"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Tourist Interface
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  {feature.icon}
                  <span>{feature.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Demo Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Live Demo Map</span>
          </CardTitle>
          <CardDescription>
            Interactive map showing geofenced zones and real-time monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeofenceMap
            height="500px"
            mode="view"
            geofences={[]}
          />
        </CardContent>
      </Card>

      {/* System Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>System Architecture</CardTitle>
          <CardDescription>
            Built with modern technologies for scalability and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Backend</h3>
              <div className="space-y-2">
                <Badge variant="outline">Express.js API</Badge>
                <Badge variant="outline">Prisma ORM</Badge>
                <Badge variant="outline">WebSocket.io</Badge>
                <Badge variant="outline">TypeScript</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Frontend</h3>
              <div className="space-y-2">
                <Badge variant="outline">Next.js 14</Badge>
                <Badge variant="outline">React 18</Badge>
                <Badge variant="outline">Tailwind CSS</Badge>
                <Badge variant="outline">Leaflet.js</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Features</h3>
              <div className="space-y-2">
                <Badge variant="outline">Real-time Tracking</Badge>
                <Badge variant="outline">Polygon Detection</Badge>
                <Badge variant="outline">Push Notifications</Badge>
                <Badge variant="outline">Risk Assessment</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Technical Achievements</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Point-in-polygon detection algorithm</li>
                <li>• Real-time WebSocket communication</li>
                <li>• RESTful API with comprehensive validation</li>
                <li>• Mobile-responsive interface design</li>
                <li>• Database optimization with Prisma</li>
                <li>• Comprehensive test coverage (247 tests)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Safety Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Multi-level risk assessment</li>
                <li>• Instant breach notifications</li>
                <li>• Emergency alert system</li>
                <li>• Tourist guidance and warnings</li>
                <li>• Admin monitoring dashboard</li>
                <li>• Historical activity tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-bold">Experience the System</h2>
        <p className="text-gray-600">
          Explore both the administrative interface and tourist mobile experience
        </p>
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={() => setDemoMode('admin')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Admin Dashboard Demo
          </Button>
          <Button 
            onClick={() => setDemoMode('tourist')}
            size="lg"
            variant="outline"
          >
            Tourist App Demo
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {demoMode === 'overview' && (
        <div className="container mx-auto px-4 py-8">
          {renderOverview()}
        </div>
      )}

      {demoMode === 'admin' && (
        <div className="min-h-screen bg-white">
          <div className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100">Geofence Management System</p>
              </div>
              <Button 
                onClick={() => setDemoMode('overview')}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                Back to Overview
              </Button>
            </div>
          </div>
          <GeofenceDashboard />
        </div>
      )}

      {demoMode === 'tourist' && (
        <div className="min-h-screen bg-gray-100 flex justify-center">
          <div className="w-full max-w-md bg-white shadow-lg">
            <div className="absolute top-4 right-4 z-50">
              <Button 
                onClick={() => setDemoMode('overview')}
                variant="outline"
                size="sm"
              >
                Back to Overview
              </Button>
            </div>
            <TouristInterface />
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofencingDemo;
