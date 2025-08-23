// setupTests.js
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Firebase
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for Firebase
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Setup DOM environment safely
if (typeof window !== 'undefined') {
  // Only set location if it doesn't exist or can be modified
  if (!window.location || Object.getOwnPropertyDescriptor(window, 'location')?.configurable !== false) {
    try {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          href: 'http://localhost'
        },
        configurable: true,
        writable: true
      });
    } catch (error) {
      // If we can't redefine, use existing location
      console.log('Using existing window.location');
    }
  }
}

// Mock WebSocket for Firebase Emulator
if (!global.WebSocket) {
  global.WebSocket = class WebSocket {
    constructor() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

console.log('🔥 Test environment setup completed');