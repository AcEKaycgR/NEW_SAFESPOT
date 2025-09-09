import { Server, Socket } from 'socket.io';
import http from 'http';

// Store active SOS incidents
const sosIncidents: Map<string, any> = new Map();

export const initSocketServer = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // In development, allow all origins. For production, you should have a whitelist.
        // The logic here should be more robust for a real production environment.
        const allowedOrigins = [
          'http://localhost:3000',
          'https://new-safespot-1.onrender.com',
          'https://your-custom-domain.com' // Keep this as a placeholder
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/safespot-socket/'
  });

  io.on('connection', (socket: Socket) => {
    console.log('📱 User connected:', socket.id);

    // Tourist sends SOS
    socket.on('SEND_SOS', (data) => {
      console.log('🚨 SOS Received:', data);
      
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
      
      console.log('📢 Broadcasting NEW_SOS_INCIDENT:', incident);
      // Broadcast to all admins
      io.emit('NEW_SOS_INCIDENT', incident);
    });

    // Admin acknowledges incident
    socket.on('ACKNOWLEDGE_SOS', (data) => {
      console.log('✅ ACKNOWLEDGE_SOS received:', data);
      const incident = sosIncidents.get(data.incidentId);
      if (incident) {
        incident.status = 'acknowledged';
        incident.acknowledgedBy = data.adminId;
        incident.acknowledgedAt = new Date().toISOString();
        
        sosIncidents.set(data.incidentId, incident);
        
        console.log('📢 Broadcasting SOS_ACKNOWLEDGED:', {
          incidentId: data.incidentId,
          acknowledgedBy: data.adminId
        });
        // Notify tourist
        io.emit('SOS_ACKNOWLEDGED', {
          incidentId: data.incidentId,
          acknowledgedBy: data.adminId
        });
      } else {
        console.log('❌ Incident not found:', data.incidentId);
      }
    });

    // Tourist disconnects
    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });

  console.log('🔌 Socket.IO server initialized.');

  return io;
};