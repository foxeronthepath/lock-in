// Environment Configuration
// This file contains environment-specific settings

// In production, these should come from environment variables
// For development, you can set them here temporarily
export const config = {
  // Firebase configuration - move these to environment variables in production
  firebase: {
    apiKey: "AIzaSyAZrwIsx8Fs9O07-9OOuKLYqd-PBBw7LN4", // TODO: Move to env variable
    authDomain: "lock-in-5e24e.firebaseapp.com",
    projectId: "lock-in-5e24e",
    storageBucket: "lock-in-5e24e.firebasestorage.app",
    messagingSenderId: "274698678652",
    appId: "1:274698678652:web:b9483255c355b1860b74f9",
  },
  
  // Development settings
  development: {
    enableLogging: true,
    enableDebugFunctions: true,
  },
  
  // Production settings
  production: {
    enableLogging: false,
    enableDebugFunctions: false,
  }
};

// Helper to get current environment config
export function getEnvironmentConfig() {
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.port !== '';
  
  return isDevelopment ? config.development : config.production;
}

// Helper to check if we're in development
export function isDevelopment() {
  return getEnvironmentConfig().enableLogging;
}
