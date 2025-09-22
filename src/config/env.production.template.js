// Production Environment Configuration Template
// Copy this file to env.production.js and update with your production values

export const config = {
  firebase: {
    apiKey: "YOUR_PRODUCTION_API_KEY",
    authDomain: "YOUR_PRODUCTION_AUTH_DOMAIN",
    projectId: "YOUR_PRODUCTION_PROJECT_ID",
    storageBucket: "YOUR_PRODUCTION_STORAGE_BUCKET",
    messagingSenderId: "YOUR_PRODUCTION_MESSAGING_SENDER_ID",
    appId: "YOUR_PRODUCTION_APP_ID",
  },
  
  development: {
    enableLogging: false,
    enableDebugFunctions: false,
  },
  
  production: {
    enableLogging: false,
    enableDebugFunctions: false,
  }
};

export function getEnvironmentConfig() {
  return config.production;
}

export function isDevelopment() {
  return false;
}
