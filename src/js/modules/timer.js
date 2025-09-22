// Timer Module
import { formatDateString } from '../utils/dateUtils.js';

class TimerService {
  constructor() {
    this.timer = null;
    this.seconds = 0; // Total seconds for today
    this.sessionStartTime = 0;
    this.autoSaveInterval = null;
    this.currentDate = formatDateString(new Date());
    
    this.init();
  }

  init() {
    this.updateDisplay();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.timer) {
        this.autoSaveSession();
      }
    });

    // Handle page unload - beforeunload for modern browsers
    window.addEventListener('beforeunload', (event) => {
      if (this.timer) {
        this.autoSaveBeforeClose();
        // Don't prevent page close, just save data
      }
    });

    // Handle page unload - pagehide as fallback for mobile
    window.addEventListener('pagehide', (event) => {
      if (this.timer) {
        this.autoSaveBeforeClose();
      }
    });

    // Handle page unload - unload as additional fallback
    window.addEventListener('unload', (event) => {
      if (this.timer) {
        this.autoSaveBeforeClose();
      }
    });
  }

  updateDisplay() {
    const hrs = String(Math.floor(this.seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((this.seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(this.seconds % 60).padStart(2, "0");
    
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = `${hrs}:${mins}:${secs}`;
    }
  }

  setTodayTime(todaySeconds) {
    this.seconds = todaySeconds;
    this.updateDisplay();
    console.log(`Timer set to today's accumulated time: ${todaySeconds} seconds`);
    
    // Check for any unsaved time from previous session
    this.checkAndRecoverUnsavedTime();
  }

  start() {
    if (!this.timer) {
      // Check for day change before starting
      this.checkDayChange();
      
      this.sessionStartTime = this.seconds;
      this.timer = setInterval(() => {
        this.seconds++;
        this.updateDisplay();
        
        // Save to localStorage as backup
        const currentSessionTime = this.seconds - this.sessionStartTime;
        if (currentSessionTime > 0) {
          this.saveToLocalStorage(currentSessionTime);
        }
      }, 1000);
      
      // Start periodic auto-save
      this.startAutoSave();
      
      // Update button states
      this.updateButtonStates(true);
      console.log("Timer started from", this.seconds, "seconds");
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      
      // Stop periodic auto-save
      this.stopAutoSave();
      
      // Save session time to daily total
      const sessionTime = this.seconds - this.sessionStartTime;
      if (sessionTime > 0 && window.dataService) {
        window.dataService.saveDailyTime(sessionTime);
        console.log(`Session completed: ${sessionTime} seconds added to daily total`);
        
        // Clear localStorage backup
        localStorage.removeItem('unsavedTime');
      }
      
      // Update button states
      this.updateButtonStates(false);
    }
  }

  updateButtonStates(isRunning) {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    
    if (startBtn) startBtn.disabled = isRunning;
    if (stopBtn) stopBtn.disabled = !isRunning;
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.checkDayChange();
      
      if (this.timer && this.sessionStartTime < this.seconds) {
        const sessionTime = this.seconds - this.sessionStartTime;
        if (sessionTime > 0 && window.dataService) {
          console.log(`Periodic auto-save: ${sessionTime} seconds`);
          window.dataService.saveDailyTime(sessionTime);
          // Reset session start time so we don't double-count
          this.sessionStartTime = this.seconds;
          // Clear localStorage backup
          localStorage.removeItem('unsavedTime');
        }
      }
    }, 120000); // Save every 2 minutes
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  autoSaveSession() {
    if (this.timer) {
      const sessionTime = this.seconds - this.sessionStartTime;
      if (sessionTime > 0 && window.dataService) {
        console.log(`Auto-saving session due to page visibility change: ${sessionTime} seconds`);
        window.dataService.saveDailyTime(sessionTime);
        // Reset session start time
        this.sessionStartTime = this.seconds;
        // Clear localStorage backup
        localStorage.removeItem('unsavedTime');
      }
    }
  }

  autoSaveBeforeClose() {
    if (this.timer) {
      const sessionTime = this.seconds - this.sessionStartTime;
      if (sessionTime > 0) {
        console.log(`Saving ${sessionTime} seconds to localStorage before page close`);
        console.log(`Total time at close: ${this.seconds} seconds`);
        
        // Stop the timer immediately
        clearInterval(this.timer);
        this.timer = null;
        this.stopAutoSave();
        
        // Save current session to localStorage as backup
        this.saveToLocalStorage(sessionTime);
        
        // Try to save to Firebase too (synchronous attempt)
        if (window.dataService) {
          try {
            // Use synchronous save for page close
            window.dataService.saveDailyTime(sessionTime);
          } catch (error) {
            console.log('Firebase save failed, localStorage backup will handle recovery');
          }
        }
      }
    } else {
      // Even if timer is not running, save current state as backup
      console.log(`Page closing with timer at ${this.seconds} seconds (not running)`);
    }
  }

  saveToLocalStorage(sessionTime) {
    const today = formatDateString(new Date());
    const unsavedData = {
      date: today,
      sessionTime: sessionTime,
      timestamp: Date.now()
    };
    localStorage.setItem('unsavedTime', JSON.stringify(unsavedData));
  }

  checkAndRecoverUnsavedTime() {
    const unsavedData = localStorage.getItem('unsavedTime');
    if (unsavedData) {
      try {
        const data = JSON.parse(unsavedData);
        const today = formatDateString(new Date());
        
        // Only recover if it's from today and not too old (within 24 hours)
        const timeAge = Date.now() - data.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (data.date === today && data.sessionTime > 0 && timeAge < maxAge) {
          console.log(`Recovering ${data.sessionTime} seconds from previous session`);
          
          // Add the recovered time to the current seconds (this will show on timer immediately)
          this.seconds += data.sessionTime;
          this.updateDisplay();
          
          // Save the recovered time to Firebase
          if (window.dataService) {
            window.dataService.saveDailyTime(data.sessionTime);
          }
          
          // Clear the localStorage backup after successful recovery
          localStorage.removeItem('unsavedTime');
          
          console.log(`Timer updated to show ${this.seconds} total seconds including recovered time`);
        } else {
          // Clear old or invalid data
          localStorage.removeItem('unsavedTime');
          console.log('Cleared old unsaved time data');
        }
      } catch (error) {
        console.error('Error recovering unsaved time:', error);
        localStorage.removeItem('unsavedTime');
      }
    }
  }

  checkDayChange() {
    const today = formatDateString(new Date());
    if (this.currentDate !== today) {
      console.log(`Day changed from ${this.currentDate} to ${today}`);
      
      // Update current date
      this.currentDate = today;
      
      // Reset timer for new day
      this.seconds = 0;
      this.sessionStartTime = 0;
      this.updateDisplay();
      
      // Load today's time (should be 0 for new day)
      if (window.dataService) {
        window.dataService.loadTodayTime();
      }
    }
  }

  getCurrentSeconds() {
    return this.seconds;
  }

  isRunning() {
    return this.timer !== null;
  }

  // Debug function to check localStorage backup
  checkLocalStorageBackup() {
    const unsavedData = localStorage.getItem('unsavedTime');
    if (unsavedData) {
      console.log('LocalStorage backup found:', JSON.parse(unsavedData));
      return JSON.parse(unsavedData);
    } else {
      console.log('No localStorage backup found');
      return null;
    }
  }

  // Manual function to clear localStorage backup (for testing)
  clearLocalStorageBackup() {
    localStorage.removeItem('unsavedTime');
    console.log('localStorage backup cleared');
  }
}

// Create and export singleton instance
export const timerService = new TimerService();
