let timer;
let seconds = 0;
let sessionStartTime = 0;

function updateDisplay() {
  let hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  let mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  let secs = String(seconds % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${hrs}:${mins}:${secs}`;
}

function start() {
  if (!timer) {
    sessionStartTime = seconds; // Remember when this session started
    timer = setInterval(() => {
      seconds++;
      updateDisplay();
    }, 1000);
    
    // Update button states
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
    console.log("Timer started");
  }
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    
    // Calculate session time and save it
    const sessionTime = seconds - sessionStartTime;
    if (sessionTime > 0 && window.saveSession) {
      window.saveSession(sessionTime);
      console.log(`Session completed: ${sessionTime} seconds`);
    }
    
    // Update button states
    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  }
}

function reset() {
  stop();
  seconds = 0;
  sessionStartTime = 0;
  updateDisplay();
  console.log("Timer reset");
}

// Initialize display when page loads
updateDisplay();

// Make functions available globally so HTML can call them
window.start = start;
window.stop = stop;
window.reset = reset;