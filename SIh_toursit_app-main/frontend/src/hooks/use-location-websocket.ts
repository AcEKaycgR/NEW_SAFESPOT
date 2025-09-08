import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface LocationUpdate {
  userId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  precisionLevel: string;
}

interface NotificationPayload {
  type: 'location_update' | 'sharing_started' | 'sharing_stopped' | 'emergency_access';
  userId: string;
  data: any;
  timestamp: Date;
}

interface LocationWebSocketHookProps {
  userId?: string;
  token?: string;
  autoConnect?: boolean;
}

interface LocationWebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  sendLocationUpdate: (update: Omit<LocationUpdate, 'userId'>) => void;
  subscribeToUser: (targetUserId: string) => void;
  unsubscribeFromUser: (targetUserId: string) => void;
  notifications: NotificationPayload[];
  clearNotifications: () => void;
  connect: () => void;
  disconnect: () => void;
}

export const useLocationWebSocket = ({
  userId,
  token,
  autoConnect = true
}: LocationWebSocketHookProps = {}): LocationWebSocketHookReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000); // Start with 1 second

  const connect = useCallback(() => {
    if (!token) {
      setConnectionError('No authentication token provided');
      return;
    }

    if (socket?.connected) {
      return; // Already connected
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const newSocket = io(serverUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Connection successful
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000; // Reset delay
      });

      // Connection error
      newSocket.on('connect_error', (error: any) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        setConnectionError(error.message || 'Failed to connect to server');
        
        // Implement exponential backoff for reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++;
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000); // Max 30 seconds
            connect();
          }, reconnectDelay.current);
        }
      });

      // Disconnection
      newSocket.on('disconnect', (reason: any) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect automatically
          setConnectionError('Disconnected by server');
        } else {
          // Client-side disconnect or network issues, attempt reconnection
          if (reconnectAttempts.current < maxReconnectAttempts) {
            setTimeout(connect, reconnectDelay.current);
          }
        }
      });

      // Location update received
      newSocket.on('location_updated', (notification: NotificationPayload) => {
        setNotifications(prev => [...prev, notification]);
      });

      // Sharing status changes
      newSocket.on('sharing_status_changed', (notification: NotificationPayload) => {
        setNotifications(prev => [...prev, notification]);
      });

      // Emergency access alerts
      newSocket.on('emergency_access_alert', (notification: NotificationPayload) => {
        setNotifications(prev => [...prev, notification]);
      });

      // Generic notifications
      newSocket.on('notification', (notification: NotificationPayload) => {
        setNotifications(prev => [...prev, notification]);
      });

      // Subscription confirmations
      newSocket.on('subscription_confirmed', (data: any) => {
        console.log('Subscribed to user:', data.userId);
      });

      newSocket.on('subscription_denied', (data: any) => {
        console.warn('Subscription denied for user:', data.userId);
        setNotifications(prev => [...prev, {
          type: 'sharing_stopped',
          userId: data.userId,
          data: { reason: 'Access denied' },
          timestamp: new Date()
        }]);
      });

      // Unsubscription confirmations
      newSocket.on('unsubscription_confirmed', (data: any) => {
        console.log('Unsubscribed from user:', data.userId);
      });

      // Force disconnect handling
      newSocket.on('force_disconnect', (data: any) => {
        console.log('Force disconnect:', data.reason);
        setConnectionError(`Disconnected: ${data.reason}`);
        newSocket.disconnect();
      });

      // Error handling
      newSocket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        setNotifications(prev => [...prev, {
          type: 'sharing_stopped',
          userId: userId || 'unknown',
          data: { error: error.message },
          timestamp: new Date()
        }]);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to initialize connection');
    }
  }, [token, userId]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const sendLocationUpdate = useCallback((update: Omit<LocationUpdate, 'userId'>) => {
    if (!socket || !isConnected || !userId) {
      console.warn('Cannot send location update: not connected or missing userId');
      return;
    }

    const locationUpdate: LocationUpdate = {
      ...update,
      userId
    };

    socket.emit('location_update', locationUpdate);
  }, [socket, isConnected, userId]);

  const subscribeToUser = useCallback((targetUserId: string) => {
    if (!socket || !isConnected) {
      console.warn('Cannot subscribe: not connected');
      return;
    }

    socket.emit('subscribe_to_user', targetUserId);
  }, [socket, isConnected]);

  const unsubscribeFromUser = useCallback((targetUserId: string) => {
    if (!socket || !isConnected) {
      console.warn('Cannot unsubscribe: not connected');
      return;
    }

    socket.emit('unsubscribe_from_user', targetUserId);
  }, [socket, isConnected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && token && !socket) {
      connect();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoConnect, token, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
    sendLocationUpdate,
    subscribeToUser,
    unsubscribeFromUser,
    notifications,
    clearNotifications,
    connect,
    disconnect
  };
};
