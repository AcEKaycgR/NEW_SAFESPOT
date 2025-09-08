"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, Users, Activity, Plus, Search, Filter, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import GeofenceMap from './dynamic-geofence-map';

interface GeofenceDashboardProps {
  className?: string;
}

interface Geofence {
  id: number;
  name: string;
  description?: string;
  polygon_coords: Array<{ lat: number; lng: number }>;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED';
  is_active: boolean;
  created_at: string;
  created_by: number;
}

interface GeofenceStats {
  total_zones: number;
  active_alerts: number;
  users_tracked: number;
  recent_breaches: number;
}

interface BreachAlert {
  id: number;
  user_id: number;
  geofence_name: string;
  risk_level: string;
  occurred_at: string;
  latitude: number;
  longitude: number;
}

const GeofenceDashboard: React.FC<GeofenceDashboardProps> = ({ className = '' }) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [stats, setStats] = useState<GeofenceStats>({
    total_zones: 0,
    active_alerts: 0,
    users_tracked: 0,
    recent_breaches: 0
  });
  const [recentBreaches, setRecentBreaches] = useState<BreachAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    description: '',
    risk_level: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    type: 'ALERT_ZONE' as 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED',
    polygon_coords: [] as Array<{ lat: number; lng: number }>
  });

  // Load data on component mount
  useEffect(() => {
    loadGeofences();
    loadStats();
    loadRecentBreaches();
  }, []);

  const loadGeofences = async () => {
    try {
      const response = await fetch('/api/geofences');
      if (response.ok) {
        const data = await response.json();
        setGeofences(data.data?.geofences || []);
      }
    } catch (error) {
      console.error('Failed to load geofences:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/geofences/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentBreaches = async () => {
    try {
      // Mock data for now - would come from API
      setRecentBreaches([
        {
          id: 1,
          user_id: 123,
          geofence_name: 'High Risk Downtown',
          risk_level: 'HIGH',
          occurred_at: new Date().toISOString(),
          latitude: 40.7128,
          longitude: -74.0060
        },
        {
          id: 2,
          user_id: 456,
          geofence_name: 'Tourist Alert Zone',
          risk_level: 'MEDIUM',
          occurred_at: new Date(Date.now() - 300000).toISOString(),
          latitude: 40.7580,
          longitude: -73.9855
        }
      ]);
    } catch (error) {
      console.error('Failed to load recent breaches:', error);
    }
  };

  const handleCreateGeofence = async () => {
    if (!newGeofence.name || !newGeofence.polygon_coords.length) {
      alert('Please provide a name and draw a polygon on the map');
      return;
    }

    console.log('Creating geofence with data:', newGeofence);

    try {
      const response = await fetch('/api/geofences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGeofence)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        setIsCreateModalOpen(false);
        setNewGeofence({
          name: '',
          description: '',
          risk_level: 'MEDIUM',
          type: 'ALERT_ZONE',
          polygon_coords: []
        });
        loadGeofences();
        loadStats();
        // Clear the drawn polygon from the map after successful creation
        if (typeof window !== 'undefined' && (window as any).clearDrawnPolygon) {
          (window as any).clearDrawnPolygon();
        }
      } else {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        alert(`Failed to create geofence: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Failed to create geofence:', error);
      alert('Failed to create geofence');
    }
  };

  const handleDeleteGeofence = async (id: number) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;

    try {
      const response = await fetch(`/api/geofences/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadGeofences();
        loadStats();
      } else {
        alert('Failed to delete geofence');
      }
    } catch (error) {
      console.error('Failed to delete geofence:', error);
      alert('Failed to delete geofence');
    }
  };

  const handleGeofenceCreated = (geofenceData: any) => {
    console.log('handleGeofenceCreated called with:', geofenceData);
    setNewGeofence(prev => {
      const updated = {
        ...prev,
        polygon_coords: geofenceData.polygon_coords
      };
      console.log('Updated newGeofence state:', updated);
      return updated;
    });
    
    // Show a brief success message to indicate the polygon was captured
    const tempMessage = document.createElement('div');
    tempMessage.innerHTML = `
      <div class="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
        ✓ Polygon captured! Fill in the details and click "Create Geofence"
      </div>
    `;
    document.body.appendChild(tempMessage);
    
    setTimeout(() => {
      if (document.body.contains(tempMessage)) {
        document.body.removeChild(tempMessage);
      }
    }, 3000);
  };

  const filteredGeofences = (geofences || []).filter(geofence => {
    const matchesSearch = geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (geofence.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRisk = filterRisk === 'all' || geofence.risk_level === filterRisk;
    const matchesType = filterType === 'all' || geofence.type === filterType;
    
    return matchesSearch && matchesRisk && matchesType;
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'bg-red-500 hover:bg-red-600';
      case 'MEDIUM': return 'bg-orange-500 hover:bg-orange-600';
      case 'LOW': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geofence Management</h1>
          <p className="text-gray-600">Monitor and manage geofenced zones</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Geofence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Geofence</DialogTitle>
              <DialogDescription>
                Define a new geofenced area with custom parameters
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter geofence name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGeofence.description}
                    onChange={(e) => setNewGeofence(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="risk-level">Risk Level</Label>
                  <Select
                    value={newGeofence.risk_level}
                    onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                      setNewGeofence(prev => ({ ...prev, risk_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Risk</SelectItem>
                      <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                      <SelectItem value="HIGH">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Zone Type</Label>
                  <Select
                    value={newGeofence.type}
                    onValueChange={(value: 'SAFE_ZONE' | 'ALERT_ZONE' | 'RESTRICTED') => 
                      setNewGeofence(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAFE_ZONE">Safe Zone</SelectItem>
                      <SelectItem value="ALERT_ZONE">Alert Zone</SelectItem>
                      <SelectItem value="RESTRICTED">Restricted Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateGeofence} className="w-full">
                  Create Geofence
                </Button>
              </div>
              <div>
                <Label>Draw Zone on Map</Label>
                <GeofenceMap
                  height="400px"
                  showDrawControls={true}
                  mode="admin"
                  onGeofenceCreated={handleGeofenceCreated}
                  geofences={geofences}
                  key={`create-map-${geofences.length}`}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_zones}</div>
            <p className="text-xs text-muted-foreground">Active geofenced areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.active_alerts}</div>
            <p className="text-xs text-muted-foreground">Current breach alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Tracked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users_tracked}</div>
            <p className="text-xs text-muted-foreground">Currently monitored</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Breaches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_breaches}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Zone Management</TabsTrigger>
          <TabsTrigger value="map">Live Map View</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search zones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Zone Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="SAFE_ZONE">Safe Zone</SelectItem>
                    <SelectItem value="ALERT_ZONE">Alert Zone</SelectItem>
                    <SelectItem value="RESTRICTED">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Zones Table */}
          <Card>
            <CardHeader>
              <CardTitle>Geofenced Zones ({filteredGeofences.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Risk Level</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Created</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGeofences.map((geofence) => (
                      <tr key={geofence.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{geofence.name}</div>
                            {geofence.description && (
                              <div className="text-sm text-gray-500">{geofence.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className={`${getRiskBadgeColor(geofence.risk_level)} text-white`}>
                            {geofence.risk_level}
                          </Badge>
                        </td>
                        <td className="py-3">{geofence.type.replace('_', ' ')}</td>
                        <td className="py-3">
                          <Badge variant={geofence.is_active ? "default" : "secondary"}>
                            {geofence.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3">{new Date(geofence.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteGeofence(geofence.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Live Geofence Map</CardTitle>
              <CardDescription>
                Real-time view of all geofenced zones and user locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeofenceMap
                height="600px"
                mode="admin"
                geofences={geofences}
                onGeofenceSelected={setSelectedGeofence}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>
                Real-time geofence breach alerts and user activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBreaches.map((breach) => (
                  <div key={breach.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      breach.risk_level === 'HIGH' ? 'bg-red-100 text-red-600' :
                      breach.risk_level === 'MEDIUM' ? 'bg-orange-100 text-orange-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        User {breach.user_id} breached {breach.geofence_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Risk Level: {breach.risk_level} • {new Date(breach.occurred_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Location: {breach.latitude.toFixed(4)}, {breach.longitude.toFixed(4)}
                      </div>
                    </div>
                    <Badge className={getRiskBadgeColor(breach.risk_level)}>
                      {breach.risk_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeofenceDashboard;
