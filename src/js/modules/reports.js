// Reports Module
class ReportsService {
  constructor() {
    this.overlayVisible = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    const closeBtn = document.getElementById('closeReportsBtn');
    const overlay = document.getElementById('reportsOverlay');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideOverlay());
    }

    if (overlay) {
      // Close overlay when clicking on backdrop
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideOverlay();
        }
      });

      // Prevent modal content clicks from closing overlay
      const modal = overlay.querySelector('.reports-modal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }

    // Escape key to close overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayVisible) {
        this.hideOverlay();
      }
    });
  }

  showOverlay() {
    const overlay = document.getElementById('reportsOverlay');
    if (!overlay) return;

    this.overlayVisible = true;
    
    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
    
    // Show overlay with a slight delay for smoother animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
    
    // Load reports data after a brief delay to let the animation start
    setTimeout(() => {
      this.loadReports();
    }, 100);

    // Update navbar visibility when reports overlay opens
    if (window.app && window.app.updateNavbarVisibility) {
      setTimeout(() => window.app.updateNavbarVisibility(), 100);
    }
  }

  hideOverlay() {
    const overlay = document.getElementById('reportsOverlay');
    if (!overlay) return;

    this.overlayVisible = false;
    overlay.classList.remove('show');
    
    // Restore body scroll after animation completes
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 300);

    // Update navbar visibility when reports overlay closes
    if (window.app && window.app.updateNavbarVisibility) {
      setTimeout(() => window.app.updateNavbarVisibility(), 100);
    }
  }

  toggleOverlay() {
    if (this.overlayVisible) {
      this.hideOverlay();
    } else {
      this.showOverlay();
    }
  }

  // Legacy method for backward compatibility
  toggleReports() {
    this.toggleOverlay();
  }

  isReportsOpen() {
    return this.overlayVisible;
  }

  async loadReports() {
    try {
      // Load summary stats
      await this.loadSummaryStats();
      
      // Load daily chart
      await this.loadDailyChart();
      
      // Load recent days list
      await this.loadRecentDays();
      
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }

  async loadSummaryStats() {
    try {
      if (!window.dataService) return;
      
      const weekly = await window.dataService.getWeeklySummary();
      const monthly = await window.dataService.getMonthlySummary();
      
      const weeklyEl = document.getElementById('weeklyHours');
      const monthlyEl = document.getElementById('monthlyHours');
      const avgEl = document.getElementById('avgDaily');
      
      if (weeklyEl) {
        weeklyEl.textContent = weekly.totalHours ? `${weekly.totalHours}h` : '0h';
      }
      
      if (monthlyEl) {
        monthlyEl.textContent = monthly.totalHours ? `${monthly.totalHours}h` : '0h';
      }
      
      if (avgEl) {
        avgEl.textContent = monthly.avgHoursPerDay ? `${monthly.avgHoursPerDay}h` : '0h';
      }
      
    } catch (error) {
      console.error('Error loading summary stats:', error);
    }
  }

  async loadDailyChart() {
    try {
      if (!window.dataService) return;
      
      const records = await window.dataService.getDailyRecords(30);
      const chartContainer = document.getElementById('dailyChart');
      
      if (!chartContainer) return;
      
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

  async loadRecentDays() {
    try {
      if (!window.dataService) return;
      
      const records = await window.dataService.getDailyRecords(14);
      const listContainer = document.getElementById('recentDaysList');
      
      if (!listContainer) return;
      
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
}

// Create and export singleton instance
export const reportsService = new ReportsService();
