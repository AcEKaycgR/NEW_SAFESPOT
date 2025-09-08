// Simple test file to check socket connection
const io = require('socket.io-client');

// Try to connect to the backend socket server
const socket = io('ws://localhost:3002', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

socket.on('connect', () => {
  console.log('✅ Connected to backend socket server');
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('error', (error) => {
  console.error('💥 Socket error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timed out');
  socket.disconnect();
}, 10000);