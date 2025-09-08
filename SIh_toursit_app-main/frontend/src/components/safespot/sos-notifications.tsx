"use client";

import { useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface SOSIncident {
  id: string;
  touristId: string;
  name: string;
  location: { lat: number; lng: number };
  timestamp: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export function SOSNotificationHandler() {
  const { toast } = useToast();
  const [newIncidents, setNewIncidents] = useState<SOSIncident[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Listen for new SOS incidents
      socketService.onNewSOSIncident((incident: SOSIncident) => {
        // Add to new incidents list
        setNewIncidents(prev => [...prev, incident]);
        
        // Show notification toast
        toast({
          title: "🚨 New SOS Alert!",
          description: `${incident.name} needs immediate assistance at ${new Date(incident.timestamp).toLocaleTimeString()}`,
          duration: 10000, // Show for 10 seconds
        });
      });

      // Cleanup listeners
      return () => {
        socketService.getSocket().off('NEW_SOS_INCIDENT');
      };
    }
  }, [toast]);

  return null; // This component doesn't render anything, just handles notifications
}