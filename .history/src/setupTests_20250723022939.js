// setupTests.js
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Firebase
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for Firebase
global.fetch = require('jest-fetch-mock');

// Setup DOM environment
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost'
  }
});

// Mock WebSocket for Firebase Emulator
global.WebSocket = class WebSocket {
  constructor() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

console.log('🔥 Test environment setup completed');