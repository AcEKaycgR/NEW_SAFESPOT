// API base URL - should be from environment in production
export const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Socket URL - use wss:// in production, ws:// in development
const SOCKET_PROTOCOL = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
  (typeof window !== 'undefined' && window.location.protocol === 'https:' 
    ? `${SOCKET_PROTOCOL}//localhost:3002` 
    : 'ws://localhost:3002');