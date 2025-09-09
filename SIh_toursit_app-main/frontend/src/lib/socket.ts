import { io, Socket } from 'socket.io-client';
// Direct import for debugging and proper parsing
const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3002').replace(/"/g, '');
console.log('📡 Socket URL from env:', process.env.NEXT_PUBLIC_SOCKET_URL);
console.log('📡 Using socket URL:', SOCKET_URL);

class SocketService {
  private socket: Socket;

  constructor() {
    // Only initialize socket in browser environment
    if (typeof window !== 'undefined') {
      console.log('Initializing Socket.IO connection to:', SOCKET_URL);
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        path: '/socket.io/',
        secure: SOCKET_URL.startsWith('wss://') || SOCKET_URL.startsWith('https://'),
        upgrade: true,
        rememberUpgrade: true
      });
      
      // Add connection debugging
      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected with ID:', this.socket.id);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        console.error('Failed to connect to:', SOCKET_URL);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected. Reason:', reason);
      });
      
      this.socket.on('error', (error) => {
        console.error('💥 Socket.IO error:', error);
      });
    } else {
      // Create a mock socket for server-side rendering
      this.socket = {
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
      } as unknown as Socket;
    }
  }

  // Send SOS alert
  sendSOS(data: any) {
    if (typeof window !== 'undefined') {
      console.log('📤 Sending SOS:', data);
      if (this.socket.connected) {
        this.socket.emit('SEND_SOS', data);
      } else {
        console.error('Socket not connected, cannot send SOS');
      }
    }
  }

  // Listen for SOS acknowledgment
  onSOSAcknowledged(callback: (data: any) => void) {
    if (typeof window !== 'undefined') {
      this.socket.on('SOS_ACKNOWLEDGED', callback);
    }
  }

  // Listen for new SOS incidents (for admin dashboard)
  onNewSOSIncident(callback: (data: any) => void) {
    if (typeof window !== 'undefined') {
      this.socket.on('NEW_SOS_INCIDENT', callback);
    }
  }

  // Acknowledge SOS incident (for admin)
  acknowledgeSOS(data: any) {
    if (typeof window !== 'undefined') {
      console.log('✅ Acknowledging SOS:', data);
      if (this.socket.connected) {
        this.socket.emit('ACKNOWLEDGE_SOS', data);
      } else {
        console.error('Socket not connected, cannot acknowledge SOS');
      }
    }
  }

  // Disconnect
  disconnect() {
    if (typeof window !== 'undefined') {
      this.socket.disconnect();
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();