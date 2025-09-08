# Real-Time SOS System Implementation Guide

## Overview
This document outlines the step-by-step implementation of a real-time SOS system that connects tourists with administrators for immediate emergency response.

## Architecture
```
Tourist App → WebSocket Server → Admin Dashboard
     ↓              ↓              ↓
   SOS Event    Real-time Sync   Live Updates
     ↓              ↓              ↓
  Location Data   Push Alerts   Incident Tracking
```

## Prerequisites
- Node.js and npm installed
- Working SafeSpot application
- Basic understanding of WebSocket concepts

## Implementation Steps

### Step 1: Install Socket.IO Dependencies

```bash
cd backend
npm install socket.io socket.io-client
```

### Step 2: Create WebSocket Server

Create `backend/src/socket-server.ts`:

```typescript
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Store active SOS incidents
const sosIncidents: Map<string, any> = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Tourist sends SOS
  socket.on('SEND_SOS', (data) => {
    console.log('SOS Received:', data);
    
    // Store incident
    const incidentId = `sos_${Date.now()}`;
    const incident = {
      id: incidentId,
      touristId: data.touristId,
      name: data.name,
      location: data.location,
      timestamp: new Date().toISOString(),
      message: data.message || "Emergency SOS triggered",
      status: 'active'
    };
    
    sosIncidents.set(incidentId, incident);
    
    // Broadcast to all admins
    io.emit('NEW_SOS_INCIDENT', incident);
  });

  // Admin acknowledges incident
  socket.on('ACKNOWLEDGE_SOS', (data) => {
    const incident = sosIncidents.get(data.incidentId);
    if (incident) {
      incident.status = 'acknowledged';
      incident.acknowledgedBy = data.adminId;
      incident.acknowledgedAt = new Date().toISOString();
      
      sosIncidents.set(data.incidentId, incident);
      
      // Notify tourist
      io.emit('SOS_ACKNOWLEDGED', {
        incidentId: data.incidentId,
        acknowledgedBy: data.adminId
      });
    }
  });

  // Tourist disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { server, io };
```

### Step 3: Integrate Socket Server with Main Server

Update `backend/src/server.ts`:

```typescript
// Add these imports at the top
import { server, io } from './socket-server';

// At the end of the file, before app.listen()
// Start Socket.IO server on different port or same server
const socketPort = parseInt(process.env.SOCKET_PORT || '3002', 10);
server.listen(socketPort, () => {
  console.log(`🔌 Socket.IO server listening at http://localhost:${socketPort}`);
});
```

### Step 4: Update Tourist Frontend for SOS Integration

Install socket.io-client:

```bash
cd frontend
npm install socket.io-client
```

Create `frontend/src/lib/socket.ts`:

```typescript
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

class SocketService {
  private socket: any;

  constructor() {
    this.socket = io(SOCKET_URL);
  }

  // Send SOS alert
  sendSOS(data: any) {
    this.socket.emit('SEND_SOS', data);
  }

  // Listen for SOS acknowledgment
  onSOSAcknowledged(callback: (data: any) => void) {
    this.socket.on('SOS_ACKNOWLEDGED', callback);
  }

  // Disconnect
  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService();
```

### Step 5: Modify SOS Button Component

Update `frontend/src/components/safespot/sos-button.tsx`:

```typescript
"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Siren, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { socketService } from '@/lib/socket';

export default function SosButton() {
  const [dispatchState, setDispatchState] = useState<'idle' | 'pending' | 'dispatched'>('idle');
  const { toast } = useToast();
  const [touristData, setTouristData] = useState({
    id: 'tourist_123', // In real app, get from auth context
    name: 'John Doe',
    location: { lat: 19.0760, lng: 72.8777 } // Mumbai coordinates
  });

  const handleSosConfirm = () => {
    setDispatchState('pending');
    
    // Send SOS via WebSocket
    socketService.sendSOS({
      touristId: touristData.id,
      name: touristData.name,
      location: touristData.location,
      message: "Emergency SOS triggered by tourist"
    });

    toast({
      title: "SOS Signal Sent",
      description: "Authorities have been notified of your location.",
    });

    // Listen for acknowledgment
    socketService.onSOSAcknowledged((data) => {
      setDispatchState('dispatched');
      toast({
        title: "Help is on the way",
        description: `Your SOS has been acknowledged by admin.`,
      });
    });

    setTimeout(() => {
      if (dispatchState === 'pending') {
        setDispatchState('dispatched');
        toast({
          title: "Dispatch Confirmed",
          description: "Help is on the way. Please stay in a safe location.",
        });
      }
    }, 3000);
  };

  const handleReset = () => {
      setDispatchState('idle');
  };

  if (dispatchState !== 'idle') {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-yellow-500 bg-yellow-500/10 p-8 text-center">
            {dispatchState === 'pending' ? (
                <>
                    <div className="relative flex items-center justify-center">
                         <Siren className="h-16 w-16 animate-ping text-yellow-500" />
                         <Siren className="absolute h-16 w-16 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-semibold">Awaiting Dispatch...</h3>
                    <p className="text-muted-foreground">Your SOS has been received. Connecting to the nearest authority.</p>
                </>
            ) : (
                <>
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <h3 className="text-xl font-semibold">Help is on the way</h3>
                    <p className="text-muted-foreground">A unit has been dispatched to your location. Stay on the line if possible.</p>
                    <Button variant="outline" onClick={handleReset}>Close Status</Button>
                </>
            )}
        </div>
      )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full h-24 rounded-2xl shadow-lg transform active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-4">
            <Siren className="h-10 w-10" />
            <div className="text-left">
                <p className="text-2xl font-bold">PANIC</p>
                <p className="font-light">Tap for Emergency</p>
            </div>
          </div>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
            <div className="flex justify-center">
                <div className="rounded-full border-4 border-destructive p-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
            </div>
          <AlertDialogTitle className="text-center text-2xl">Confirm SOS Activation</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will immediately send your live location and personal details to the nearest police authority. Only use this in a genuine emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSosConfirm}>Confirm & Send Alert</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Step 6: Create Admin SOS Dashboard

Create `frontend/src/app/admin/sos-dashboard/page.tsx`:

```typescript
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
    // Listen for new SOS incidents
    const handleNewIncident = (incident: SOSIncident) => {
      setIncidents(prev => [incident, ...prev]);
    };

    // Connect to WebSocket
    socketService.socket.on('connect', () => {
      setConnected(true);
    });

    socketService.socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for new incidents
    socketService.socket.on('NEW_SOS_INCIDENT', handleNewIncident);

    return () => {
      socketService.socket.off('NEW_SOS_INCIDENT', handleNewIncident);
    };
  }, []);

  const acknowledgeIncident = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      // Emit acknowledgment
      socketService.socket.emit('ACKNOWLEDGE_SOS', {
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
```

### Step 7: Update Environment Variables

Add to `.env` files:

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
SOCKET_PORT=3002
```

### Step 8: Test the Implementation

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Open two browser windows:
   - Tourist dashboard: http://localhost:3000/dashboard
   - Admin SOS dashboard: http://localhost:3000/admin/sos-dashboard

4. Click the SOS button on the tourist dashboard
5. Observe the incident appear immediately on the admin dashboard
6. Click "Acknowledge Incident" on admin dashboard
7. See the status update on tourist side

## Production Considerations

1. **Authentication**: Add JWT token verification for secure connections
2. **Rate Limiting**: Prevent abuse with rate limiting on SOS triggers
3. **Location Accuracy**: Implement GPS accuracy validation
4. **Offline Support**: Add offline queuing for SOS messages
5. **Scalability**: Use Redis for incident storage in production
6. **Security**: Implement proper CORS and authentication
7. **Logging**: Add comprehensive logging for audit trails
8. **Backup Communication**: Implement SMS/email fallback for critical alerts

## Troubleshooting

1. **Connection Issues**: Ensure WebSocket server is running on correct port
2. **CORS Errors**: Update CORS configuration in socket server
3. **Missing Incidents**: Check if tourist data is being sent correctly
4. **Acknowledgment Failures**: Verify admin ID is properly passed

## Next Steps for Enhanced System

1. Add real-time map updates showing tourist locations
2. Implement incident escalation for unacknowledged SOS
3. Add multimedia support (photos, audio) to SOS alerts
4. Create incident resolution workflow
5. Add integration with emergency services APIs
6. Implement automated location tracking during SOS
7. Add chat functionality between tourist and responder