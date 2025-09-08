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