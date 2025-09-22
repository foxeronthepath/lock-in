// Centralized Logging Utility
import { isDevelopment } from '../config/env.js';

class Logger {
  constructor() {
    this.isDev = isDevelopment();
  }

  log(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error(...args);
  }

  warn(...args) {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.isDev) {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.isDev) {
      console.debug(...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
