// Historical Data Generator Utility
import { db } from '../../config/firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { formatDateString, isWeekend } from './dateUtils.js';
import { logger } from './logger.js';

/**
 * Generate realistic historical work data for new users
 * @param {string} userId - The user's Firebase UID
 */
export async function generateHistoricalData(userId) {
  if (!userId) return;
  
  try {
    const today = new Date();
    const records = [];
    
    logger.log('Generating 60 days of historical work data...');
    
    // Generate 60 days of historical data
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip some days randomly (weekends, sick days, vacations, etc.)
      const skipChance = isWeekend(date) ? 0.7 : 0.15; // 70% chance to skip weekends, 15% for weekdays
      
      if (Math.random() < skipChance) continue;
      
      const dateString = formatDateString(date);
      
      // Generate realistic work hours based on day of week
      let baseHours;
      if (isWeekend(date)) {
        // Weekend work is usually lighter
        baseHours = 2 + Math.random() * 4; // 2-6 hours
      } else {
        // Weekday work is more substantial
        baseHours = 5 + Math.random() * 4; // 5-9 hours
      }
      
      // Add some natural variation
      const variation = (Math.random() - 0.5) * 2; // -1 to +1 hour variation
      const hours = Math.max(1, Math.min(10, baseHours + variation));
      const totalSeconds = Math.floor(hours * 3600);
      
      const record = {
        date: dateString,
        totalSeconds: totalSeconds,
        totalHours: Math.round(hours * 100) / 100,
        finalizedAt: new Date(date.getTime() + 20 * 60 * 60 * 1000).toISOString(), // Finalized 20 hours after the work day
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        generated: true // Mark as generated data
      };
      
      records.push(record);
    }
    
    // Save all records to Firebase
    logger.log(`Saving ${records.length} historical work records...`);
    
    for (const record of records) {
      const recordRef = doc(db, 'users', userId, 'dailyRecords', record.date);
      await setDoc(recordRef, record);
    }
    
    logger.log(`Successfully generated ${records.length} days of historical work data`);
    
    // Also create corresponding dailyTime records (marked as finalized)
    for (const record of records) {
      const dailyTimeRef = doc(db, 'users', userId, 'dailyTime', record.date);
      await setDoc(dailyTimeRef, {
        date: record.date,
        totalSeconds: record.totalSeconds,
        lastUpdated: record.finalizedAt,
        finalized: true,
        finalizedAt: record.finalizedAt,
        generated: true
      });
    }
    
    logger.log('Historical data generation completed successfully');
    
  } catch (error) {
    logger.error('Error generating historical work data:', error);
  }
}
