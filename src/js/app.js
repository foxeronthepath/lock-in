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

    // Settings panel event listeners
    this.setupSettingsListeners();
  }

  setupSettingsListeners() {
    // Close settings button
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    // Settings overlay click to close
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    // Save settings button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Export data button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => {
        this.exportData();
      });
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.clearData();
      });
    }

    // Theme selector change
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        this.setTheme(selectedTheme);
      });
    }

    // Escape key to close settings
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel && settingsPanel.classList.contains('open')) {
          this.closeSettings();
        }
      }
    });
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
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.classList.add('open');
      this.loadSettings();
      // Focus management for accessibility
      const closeBtn = document.getElementById('closeSettingsBtn');
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  }

  closeSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.classList.remove('open');
    }
  }

  loadSettings() {
    // Load theme setting
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      themeSelect.value = savedTheme;
    }

    // Load other settings from localStorage
    const autoSaveInterval = document.getElementById('autoSaveInterval');
    if (autoSaveInterval) {
      const savedInterval = localStorage.getItem('autoSaveInterval') || '5';
      autoSaveInterval.value = savedInterval;
    }

    const reminderSound = document.getElementById('reminderSound');
    if (reminderSound) {
      const savedSound = localStorage.getItem('reminderSound') === 'true';
      reminderSound.checked = savedSound;
    }

    const breakReminder = document.getElementById('breakReminder');
    if (breakReminder) {
      const savedBreak = localStorage.getItem('breakReminder') === 'true';
      breakReminder.checked = savedBreak;
    }

    const dailyGoal = document.getElementById('dailyGoal');
    if (dailyGoal) {
      const savedGoal = localStorage.getItem('dailyGoal') || '8';
      dailyGoal.value = savedGoal;
    }

    const goalNotification = document.getElementById('goalNotification');
    if (goalNotification) {
      const savedGoalNotif = localStorage.getItem('goalNotification') !== 'false';
      goalNotification.checked = savedGoalNotif;
    }
  }

  saveSettings() {
    // Save theme setting
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      const selectedTheme = themeSelect.value;
      localStorage.setItem('theme', selectedTheme);
      this.setTheme(selectedTheme);
    }

    // Save other settings
    const autoSaveInterval = document.getElementById('autoSaveInterval');
    if (autoSaveInterval) {
      localStorage.setItem('autoSaveInterval', autoSaveInterval.value);
    }

    const reminderSound = document.getElementById('reminderSound');
    if (reminderSound) {
      localStorage.setItem('reminderSound', reminderSound.checked.toString());
    }

    const breakReminder = document.getElementById('breakReminder');
    if (breakReminder) {
      localStorage.setItem('breakReminder', breakReminder.checked.toString());
    }

    const dailyGoal = document.getElementById('dailyGoal');
    if (dailyGoal) {
      localStorage.setItem('dailyGoal', dailyGoal.value);
    }

    const goalNotification = document.getElementById('goalNotification');
    if (goalNotification) {
      localStorage.setItem('goalNotification', goalNotification.checked.toString());
    }

    // Show feedback
    this.showSettingsSaved();
  }

  showSettingsSaved() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✅ Saved!';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 2000);
    }
  }

  async exportData() {
    try {
      if (!dataService.getCurrentUser()) {
        alert('Please log in to export your data.');
        return;
      }

      // Get user data
      const dailyRecords = await dataService.getDailyRecords(365); // Last year
      const weeklySummary = await dataService.getWeeklySummary();
      const monthlySummary = await dataService.getMonthlySummary();

      const exportData = {
        exportDate: new Date().toISOString(),
        user: dataService.getCurrentUser().email,
        dailyRecords,
        weeklySummary,
        monthlySummary,
        settings: {
          theme: localStorage.getItem('theme'),
          autoSaveInterval: localStorage.getItem('autoSaveInterval'),
          reminderSound: localStorage.getItem('reminderSound'),
          breakReminder: localStorage.getItem('breakReminder'),
          dailyGoal: localStorage.getItem('dailyGoal'),
          goalNotification: localStorage.getItem('goalNotification')
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lock-in-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.log('Data exported successfully');
    } catch (error) {
      logger.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  }

  clearData() {
    if (!dataService.getCurrentUser()) {
      alert('Please log in to clear your data.');
      return;
    }

    const confirmation = confirm(
      'Are you sure you want to clear ALL your timer data?\n\n' +
      'This action cannot be undone and will permanently delete:\n' +
      '• All daily timer records\n' +
      '• All reports data\n' +
      '• All statistics\n\n' +
      'Type "DELETE" in the next prompt to confirm.'
    );

    if (confirmation) {
      const doubleConfirm = prompt('Type "DELETE" to confirm (case-sensitive):');
      if (doubleConfirm === 'DELETE') {
        try {
          // Clear data through dataService
          dataService.clearAllData();
          
          // Refresh reports if open
          if (reportsService.isReportsOpen()) {
            reportsService.loadReports();
          }
          
          alert('All data has been cleared successfully.');
          logger.log('All user data cleared');
        } catch (error) {
          logger.error('Error clearing data:', error);
          alert('Error clearing data. Please try again.');
        }
      } else {
        alert('Data clearing cancelled - confirmation text did not match.');
      }
    }
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
