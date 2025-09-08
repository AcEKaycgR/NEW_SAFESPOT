// Mock socket.io-client for testing
const mockSocket = {
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
};

const mockIo = jest.fn(() => mockSocket);

export { mockIo as io, mockSocket };
