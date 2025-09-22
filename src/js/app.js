// Main Application Entry Point
import { authService } from './modules/auth.js';
import { timerService } from './modules/timer.js';
import { dataService } from './modules/dataService.js';
import { reportsService } from './modules/reports.js';

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

    console.log('Lock-In app initialized successfully');
    console.log('Global functions available:', {
      signUp: typeof window.signUp,
      signIn: typeof window.signIn, 
      logout: typeof window.logout,
      start: typeof window.start,
      stop: typeof window.stop
    });
  }

  setupUserTracking() {
    // Update data service when user changes
    const originalHandleAuthStateChange = authService.handleAuthStateChange.bind(authService);
    authService.handleAuthStateChange = (user) => {
      dataService.setCurrentUser(user);
      return originalHandleAuthStateChange(user);
    };
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
      console.log('Logout function called!');
      try {
        console.log('Calling authService.logout()...');
        await authService.logout();
        console.log('Logout successful!');
      } catch (error) {
        console.error('Logout error:', error);
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

    // Legacy compatibility functions
    window.setTodayTime = (seconds) => {
      timerService.setTodayTime(seconds);
    };

    window.saveDailyTime = (seconds) => {
      if (dataService.getCurrentUser()) {
        dataService.saveDailyTime(seconds);
      }
    };

    // Debug functions for localStorage backup testing
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
