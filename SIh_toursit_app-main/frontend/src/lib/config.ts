// API base URL - should be from environment in production
export const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
console.log('🔧 Base URL:', baseUrl);

// Socket URL - use wss:// in production, ws:// in development
export const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3002';
console.log('🔌 Socket URL:', socketUrl);