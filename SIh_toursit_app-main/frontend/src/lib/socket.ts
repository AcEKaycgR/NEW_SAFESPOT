import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

class SocketService {
  private socket: Socket;

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

  // Listen for new SOS incidents (for admin dashboard)
  onNewSOSIncident(callback: (data: any) => void) {
    this.socket.on('NEW_SOS_INCIDENT', callback);
  }

  // Acknowledge SOS incident (for admin)
  acknowledgeSOS(data: any) {
    this.socket.emit('ACKNOWLEDGE_SOS', data);
  }

  // Disconnect
  disconnect() {
    this.socket.disconnect();
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();