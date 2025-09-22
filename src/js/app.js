// Main Application Entry Point
import { authService } from './modules/auth.js';
import { timerService } from './modules/timer.js';
import { dataService } from './modules/dataService.js';
import { reportsService } from './modules/reports.js';
import { logger } from '../utils/logger.js';
import { getEnvironmentConfig } from '../config/env.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // Make services available globally for backward compatibility and HTML event handlers
    window.authService = authService;
    window.timerService = timerService;
    window.dataService = dataService;
    window.reportsService = reportsService;

    // Set up data service to track current user
    this.setupUserTracking();

    // Set up global functions for HTML event handlers
    this.setupGlobalFunctions();

    // Set up navigation functionality
    this.setupNavigation();

    logger.log('Lock-In app initialized successfully');
  }

  setupUserTracking() {
    // Update data service when user changes
    const originalHandleAuthStateChange = authService.handleAuthStateChange.bind(authService);
    authService.handleAuthStateChange = (user) => {
      dataService.setCurrentUser(user);
      this.updateProfileDisplay(user);
      return originalHandleAuthStateChange(user);
    };
  }

  setupNavigation() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      // Load saved theme or default to light
      const savedTheme = localStorage.getItem('theme') || 'light';
      this.setTheme(savedTheme);
      
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
      });
    }

    // Reports navigation button
    const reportsNavBtn = document.getElementById('reportsNavBtn');
    if (reportsNavBtn) {
      reportsNavBtn.addEventListener('click', () => {
        reportsService.toggleReports();
      });
    }

    // Profile dropdown functionality
    const profileCircle = document.getElementById('profileCircle');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileCircle && profileDropdown) {
      profileCircle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleProfileDropdown();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && !profileCircle.contains(e.target)) {
          this.closeProfileDropdown();
        }
      });
    }

    // Dropdown menu item handlers
    const settingsBtn = document.getElementById('settingsBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.closeProfileDropdown();
        this.openSettings();
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        this.closeProfileDropdown();
        this.handleSignOut();
      });
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
      themeToggle.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    }
  }

  updateProfileDisplay(user) {
    const profileInitial = document.getElementById('profileInitial');
    if (profileInitial && user) {
      const email = user.email || 'User';
      const initial = email.charAt(0).toUpperCase();
      profileInitial.textContent = initial;
    }
  }

  toggleProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
      profileDropdown.classList.toggle('show');
    }
  }

  closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
      profileDropdown.classList.remove('show');
    }
  }

  openSettings() {
    // For now, show a simple alert - can be expanded to a modal later
    alert('Settings panel coming soon! 🛠️\n\nHere you could configure:\n• Theme preferences\n• Timer settings\n• Notification preferences\n• Data export options');
  }

  async handleSignOut() {
    try {
      await authService.logout();
      logger.log('User signed out successfully');
    } catch (error) {
      logger.error('Sign out error:', error);
      alert('Error signing out. Please try again.');
    }
  }

  setupGlobalFunctions() {
    // Store reference to app instance for error handling
    const app = this;
    
    // Authentication functions for login page
    window.signUp = async () => {
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      
      try {
        await authService.signUp(email, password);
        app.clearError();
      } catch (error) {
        app.showError(error.message);
      }
    };

    window.signIn = async () => {
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      
      try {
        await authService.signIn(email, password);
        app.clearError();
      } catch (error) {
        app.showError(error.message);
      }
    };

    window.logout = async () => {
      try {
        await authService.logout();
        logger.log('Logout successful!');
      } catch (error) {
        logger.error('Logout error:', error);
        alert('Error logging out. Please try again.');
      }
    };

    // Timer functions for main page
    window.start = () => {
      timerService.start();
    };

    window.stop = () => {
      timerService.stop();
    };

    // Reports functions
    window.toggleReports = () => {
      reportsService.toggleReports();
    };

    // Only expose debug functions in development
    const config = getEnvironmentConfig();
    if (config.enableDebugFunctions) {
      // Debug functions for localStorage backup testing (dev only)
      window.checkBackup = () => {
        return timerService.checkLocalStorageBackup();
      };

      window.clearBackup = () => {
        timerService.clearLocalStorageBackup();
      };

      window.finalizeTodaysTime = () => {
        if (dataService.getCurrentUser()) {
          return dataService.finalizeTodaysTime();
        }
      };

      window.getDailyRecords = (days) => {
        if (dataService.getCurrentUser()) {
          return dataService.getDailyRecords(days);
        }
        return [];
      };

      window.getWeeklySummary = () => {
        if (dataService.getCurrentUser()) {
          return dataService.getWeeklySummary();
        }
        return { totalHours: 0, avgHoursPerDay: 0, daysWorked: 0, records: [] };
      };

      window.getMonthlySummary = () => {
        if (dataService.getCurrentUser()) {
          return dataService.getMonthlySummary();
        }
        return { totalHours: 0, avgHoursPerDay: 0, daysWorked: 0, records: [] };
      };
    }
  }

  showError(message) {
    const errorElement = document.getElementById('authError');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  clearError() {
    const errorElement = document.getElementById('authError');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
