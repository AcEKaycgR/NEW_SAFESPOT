import { io, Socket } from 'socket.io-client';
import { socketUrl } from '@/lib/config';

class SocketService {
  private socket: Socket;

  constructor() {
    // Only initialize socket in browser environment
    if (typeof window !== 'undefined') {
      console.log('Initializing Socket.IO connection to:', socketUrl);
      this.socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      });
      
      // Add connection debugging
      this.socket.on('connect', () => {
        console.log('Socket.IO connected with ID:', this.socket.id);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected. Reason:', reason);
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
      console.log('Sending SOS:', data);
      this.socket.emit('SEND_SOS', data);
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
      console.log('Acknowledging SOS:', data);
      this.socket.emit('ACKNOWLEDGE_SOS', data);
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