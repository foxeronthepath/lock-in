// Date Utility Functions

/**
 * Format date as YYYY-MM-DD string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateString(date) {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
}

/**
 * Get today's date as a formatted string
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayDateString() {
  return formatDateString(new Date());
}

/**
 * Check if a date string represents today
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 */
export function isToday(dateString) {
  return dateString === getTodayDateString();
}

/**
 * Get a date N days ago
 * @param {number} daysAgo - Number of days back
 * @returns {Date} Date object for N days ago
 */
export function getDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Check if a date is a weekend
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Saturday or Sunday
 */
export function isWeekend(date) {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}
