let timer;
let seconds = 0; // This will now represent total seconds for today
let sessionStartTime = 0;
let autoSaveInterval;
let currentDate = getTodayDateString(); // Track current date

function updateDisplay() {
  let hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  let mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  let secs = String(seconds % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${hrs}:${mins}:${secs}`;
}

// Set the timer to today's accumulated time
function setTodayTime(todaySeconds) {
  seconds = todaySeconds;
  updateDisplay();
  console.log(`Timer set to today's accumulated time: ${todaySeconds} seconds`);
  
  // Check for any unsaved time from previous session
  checkAndRecoverUnsavedTime();
}

// Save unsaved time to localStorage as backup
function saveToLocalStorage(sessionTime) {
  const today = getTodayDateString();
  const unsavedData = {
    date: today,
    sessionTime: sessionTime,
    timestamp: Date.now()
  };
  localStorage.setItem('unsavedTime', JSON.stringify(unsavedData));
  console.log(`Saved ${sessionTime} seconds to localStorage as backup`);
}

// Check and recover any unsaved time from localStorage
function checkAndRecoverUnsavedTime() {
  const unsavedData = localStorage.getItem('unsavedTime');
  if (unsavedData) {
    try {
      const data = JSON.parse(unsavedData);
      const today = getTodayDateString();
      
      // Only recover if it's from today and not too old (within 24 hours)
      if (data.date === today && data.sessionTime > 0) {
        console.log(`Recovering ${data.sessionTime} seconds from previous session`);
        
        // Save the recovered time to Firebase
        if (window.saveDailyTime) {
          window.saveDailyTime(data.sessionTime);
        }
        
        // Clear the localStorage backup
        localStorage.removeItem('unsavedTime');
      } else {
        // Clear old data
        localStorage.removeItem('unsavedTime');
      }
    } catch (error) {
      console.error('Error recovering unsaved time:', error);
      localStorage.removeItem('unsavedTime');
    }
  }
}

// Get today's date as a string (YYYY-MM-DD)
function getTodayDateString() {
  const today = new Date();
  return today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
}

// Check if day has changed and finalize previous day
function checkDayChange() {
  const today = getTodayDateString();
  if (currentDate !== today) {
    console.log(`Day changed from ${currentDate} to ${today}`);
    
    // Finalize the previous day
    if (window.finalizeTodaysTime) {
      // We need to finalize the previous day's time
      const previousDate = currentDate;
      console.log(`Finalizing previous day: ${previousDate}`);
      
      // Update current date
      currentDate = today;
      
      // Reset timer for new day
      seconds = 0;
      sessionStartTime = 0;
      updateDisplay();
      
      // Load today's time (should be 0 for new day)
      if (window.loadTodayTime) {
        window.loadTodayTime();
      }
    }
  }
}

// Periodic auto-save every 2 minutes while timer is running
function startAutoSave() {
  autoSaveInterval = setInterval(() => {
    // Check for day change
    checkDayChange();
    
    if (timer && sessionStartTime < seconds) {
      const sessionTime = seconds - sessionStartTime;
      if (sessionTime > 0 && window.saveDailyTime) {
        console.log(`Periodic auto-save: ${sessionTime} seconds`);
        window.saveDailyTime(sessionTime);
        // Reset session start time so we don't double-count
        sessionStartTime = seconds;
        // Clear localStorage backup since we successfully saved to Firebase
        localStorage.removeItem('unsavedTime');
      }
    }
  }, 120000); // Save every 2 minutes (120,000 ms)
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

function start() {
  if (!timer) {
    // Check for day change before starting
    checkDayChange();
    
    sessionStartTime = seconds; // Remember when this session started
    timer = setInterval(() => {
      seconds++;
      updateDisplay();
      
      // Save to localStorage every second as backup (lightweight operation)
      const currentSessionTime = seconds - sessionStartTime;
      if (currentSessionTime > 0) {
        saveToLocalStorage(currentSessionTime);
      }
    }, 1000);
    
    // Start periodic auto-save
    startAutoSave();
    
    // Update button states
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
    console.log("Timer started from", seconds, "seconds");
  }
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    
    // Stop periodic auto-save
    stopAutoSave();
    
    // Calculate session time and save it to daily total
    const sessionTime = seconds - sessionStartTime;
    if (sessionTime > 0 && window.saveDailyTime) {
      window.saveDailyTime(sessionTime);
      console.log(`Session completed: ${sessionTime} seconds added to daily total`);
      
      // Clear localStorage backup since we successfully saved
      localStorage.removeItem('unsavedTime');
    }
    
    // Update button states
    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  }
}

// Auto-save function when page is about to close
function autoSaveBeforeClose() {
  if (timer) {
    // Timer is running, save current session to localStorage immediately
    const sessionTime = seconds - sessionStartTime;
    if (sessionTime > 0) {
      console.log(`Saving ${sessionTime} seconds to localStorage before page close`);
      
      // Stop the timer immediately
      clearInterval(timer);
      timer = null;
      stopAutoSave();
      
      // Save to localStorage (this will be recovered on next load)
      saveToLocalStorage(sessionTime);
      
      // Try to save to Firebase too, but don't wait for it
      if (window.saveDailyTime) {
        window.saveDailyTime(sessionTime);
      }
    }
  }
}

// Add event listeners for page close events
window.addEventListener('beforeunload', (event) => {
  if (timer) {
    // Auto-save the current session to localStorage
    autoSaveBeforeClose();
  }
});

// Also save on page visibility change (when switching tabs or minimizing)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && timer) {
    // Page is being hidden (tab switch, minimize, etc.)
    // Save current progress as a backup
    const sessionTime = seconds - sessionStartTime;
    if (sessionTime > 0 && window.saveDailyTime) {
      console.log(`Auto-saving session due to page visibility change: ${sessionTime} seconds`);
      window.saveDailyTime(sessionTime);
      // Reset session start time so we don't double-count
      sessionStartTime = seconds;
      // Clear localStorage backup since we successfully saved to Firebase
      localStorage.removeItem('unsavedTime');
    }
  }
});

// Initialize display when page loads
updateDisplay();

// Make functions available globally so HTML can call them
window.start = start;
window.stop = stop;
window.setTodayTime = setTodayTime;