"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Check, Bell } from "lucide-react";
import { socketService } from '@/lib/socket';
import { useToast } from "@/hooks/use-toast";

// Skip static generation for this page during build
export const dynamic = 'force-dynamic';

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
  const { toast } = useToast();

  useEffect(() => {
    // Only initialize socket connection in browser environment
    if (typeof window !== 'undefined') {
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
        
        // Show notification toast for new incidents
        toast({
          title: "🚨 New SOS Alert!",
          description: `${incident.name} needs immediate assistance`,
          duration: 5000,
        });
      });

      // Cleanup listeners on component unmount
      return () => {
        socketService.getSocket().off('connect');
        socketService.getSocket().off('disconnect');
        socketService.getSocket().off('NEW_SOS_INCIDENT');
      };
    }
  }, [toast]);

  const acknowledgeIncident = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      // Emit acknowledgment
      const ackData = {
        incidentId,
        adminId: 'admin_001' // In real app, get from auth context
      };
      console.log('Acknowledging incident:', ackData);
      socketService.acknowledgeSOS(ackData);

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
            Real-time emergency alerts and incident management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 ${connected ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {incidents.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No SOS Alerts</h3>
              <p className="text-muted-foreground">
                Emergency alerts will appear here when received
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{incident.name}</h3>
                    <Badge 
                      variant={incident.status === 'active' ? 'destructive' : 'secondary'}
                    >
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </Badge>
                  </div>
                  {incident.status === 'active' && (
                    <Button 
                      size="sm" 
                      onClick={() => acknowledgeIncident(incident.id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Acknowledge
                    </Button>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(incident.timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{incident.message}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Lat: {incident.location.lat.toFixed(4)}, Lng: {incident.location.lng.toFixed(4)}</span>
                  </div>
                  {incident.acknowledgedBy && (
                    <span>Acknowledged by {incident.acknowledgedBy}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}