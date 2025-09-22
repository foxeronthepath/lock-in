// Reports and Visualization Module

let reportsVisible = false;

// Toggle reports panel visibility
function toggleReports() {
  const reportsContent = document.getElementById('reportsContent');
  const toggleBtn = document.getElementById('toggleReportsBtn');
  
  reportsVisible = !reportsVisible;
  
  if (reportsVisible) {
    reportsContent.style.display = 'block';
    toggleBtn.textContent = 'Hide Reports';
    loadReports();
  } else {
    reportsContent.style.display = 'none';
    toggleBtn.textContent = 'Show Reports';
  }
}

// Historical data is now generated automatically in the background

// Format date as YYYY-MM-DD string
function formatDateString(date) {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
}

// Load and display reports
async function loadReports() {
  try {
    // Load summary stats
    await loadSummaryStats();
    
    // Load daily chart
    await loadDailyChart();
    
    // Load recent days list
    await loadRecentDays();
    
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

// Load summary statistics
async function loadSummaryStats() {
  try {
    const weekly = await window.getWeeklySummary();
    const monthly = await window.getMonthlySummary();
    
    document.getElementById('weeklyHours').textContent = 
      weekly.totalHours ? `${weekly.totalHours}h` : '0h';
    
    document.getElementById('monthlyHours').textContent = 
      monthly.totalHours ? `${monthly.totalHours}h` : '0h';
    
    document.getElementById('avgDaily').textContent = 
      monthly.avgHoursPerDay ? `${monthly.avgHoursPerDay}h` : '0h';
    
  } catch (error) {
    console.error('Error loading summary stats:', error);
  }
}

// Load daily chart
async function loadDailyChart() {
  try {
    const records = await window.getDailyRecords(30);
    const chartContainer = document.getElementById('dailyChart');
    
    if (!records || records.length === 0) {
      chartContainer.innerHTML = '<div class="no-data">No data available</div>';
      return;
    }
    
    // Sort records by date (ascending)
    records.sort((a, b) => a.date.localeCompare(b.date));
    
    // Find max hours for scaling
    const maxHours = Math.max(...records.map(r => r.totalHours || 0));
    const chartMaxHeight = 180; // pixels
    
    // Generate chart bars
    let chartHTML = '';
    records.forEach(record => {
      const hours = record.totalHours || 0;
      const height = maxHours > 0 ? (hours / maxHours) * chartMaxHeight : 0;
      const date = new Date(record.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      chartHTML += `
        <div class="chart-bar" style="height: ${height}px">
          <div class="chart-bar-tooltip">
            ${dayName} ${dayNumber}<br>
            ${hours}h
          </div>
        </div>
      `;
    });
    
    chartContainer.innerHTML = chartHTML;
    
  } catch (error) {
    console.error('Error loading daily chart:', error);
  }
}

// Load recent days list
async function loadRecentDays() {
  try {
    const records = await window.getDailyRecords(14);
    const listContainer = document.getElementById('recentDaysList');
    
    if (!records || records.length === 0) {
      listContainer.innerHTML = '<div class="no-data">No recent work data</div>';
      return;
    }
    
    // Sort records by date (descending - most recent first)
    records.sort((a, b) => b.date.localeCompare(a.date));
    
    let listHTML = '';
    records.forEach(record => {
      const date = new Date(record.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      const dayOfWeek = record.dayOfWeek || date.toLocaleDateString('en-US', { weekday: 'long' });
      const hours = record.totalHours || 0;
      
      listHTML += `
        <div class="day-item">
          <div>
            <span class="day-date">${formattedDate}</span>
            <span class="day-weekday">${dayOfWeek}</span>
          </div>
          <div class="day-hours">${hours}h</div>
        </div>
      `;
    });
    
    listContainer.innerHTML = listHTML;
    
  } catch (error) {
    console.error('Error loading recent days:', error);
  }
}

// Make functions available globally
window.toggleReports = toggleReports;
window.loadReports = loadReports;
