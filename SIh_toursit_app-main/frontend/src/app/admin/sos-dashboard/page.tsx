"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Check } from "lucide-react";
import { socketService } from '@/lib/socket';

interface SOSIncident {
  id: string;
  touristId: string;
  name: string;
  location: { lat: number; lng: number };
  timestamp: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export default function SOSDashboard() {
  const [incidents, setIncidents] = useState<SOSIncident[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Listen for connection status
    socketService.getSocket().on('connect', () => {
      setConnected(true);
    });

    socketService.getSocket().on('disconnect', () => {
      setConnected(false);
    });

    // Listen for new SOS incidents
    socketService.onNewSOSIncident((incident: SOSIncident) => {
      setIncidents(prev => [incident, ...prev]);
    });

    // Cleanup listeners on component unmount
    return () => {
      socketService.getSocket().off('connect');
      socketService.getSocket().off('disconnect');
      socketService.getSocket().off('NEW_SOS_INCIDENT');
    };
  }, []);

  const acknowledgeIncident = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      // Emit acknowledgment
      socketService.acknowledgeSOS({
        incidentId,
        adminId: 'admin_001' // In real app, get from auth context
      });

      // Update local state
      setIncidents(prev => 
        prev.map(i => 
          i.id === incidentId 
            ? { ...i, status: 'acknowledged', acknowledgedBy: 'Admin', acknowledgedAt: new Date().toISOString() } 
            : i
        )
      );
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOS Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time emergency incident monitoring
          </p>
        </div>
        <Badge variant={connected ? "default" : "destructive"}>
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Incidents</h3>
              <p className="text-muted-foreground">
                Emergency alerts will appear here when tourists trigger SOS
              </p>
            </CardContent>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Card key={incident.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {incident.name}
                  </CardTitle>
                  <Badge 
                    variant={
                      incident.status === 'active' ? 'destructive' : 
                      incident.status === 'acknowledged' ? 'default' : 'secondary'
                    }
                  >
                    {incident.status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {formatTime(incident.timestamp)} • {incident.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Location: {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                    </span>
                  </div>
                  
                  {incident.status === 'acknowledged' && incident.acknowledgedAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      <span>
                        Acknowledged by {incident.acknowledgedBy} at {formatTime(incident.acknowledgedAt)}
                      </span>
                    </div>
                  )}
                  
                  {incident.status === 'active' && (
                    <Button 
                      onClick={() => acknowledgeIncident(incident.id)}
                      className="w-full"
                    >
                      Acknowledge Incident
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}