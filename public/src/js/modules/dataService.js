// Data Service Module
import { db } from '../../config/firebase.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { formatDateString } from '../utils/dateUtils.js';
import { logger } from '../utils/logger.js';

class DataService {
  constructor() {
    this.currentUser = null;
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  async saveDailyTime(additionalSeconds) {
    if (!this.currentUser || additionalSeconds < 1) return;
    
    const today = formatDateString(new Date());
    const dailyRef = doc(db, 'users', this.currentUser.uid, 'dailyTime', today);
    
    try {
      // Check if today's document exists
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        // Update existing document
        await updateDoc(dailyRef, {
          totalSeconds: increment(additionalSeconds),
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Create new document for today
        await setDoc(dailyRef, {
          date: today,
          totalSeconds: additionalSeconds,
          lastUpdated: new Date().toISOString(),
          finalized: false
        });
      }
      
      logger.log(`Daily time updated: +${additionalSeconds} seconds for ${today}`);
    } catch (error) {
      logger.error("Error saving daily time:", error);
    }
  }

  async loadTodayTime() {
    if (!this.currentUser) return;
    
    const today = formatDateString(new Date());
    const dailyRef = doc(db, 'users', this.currentUser.uid, 'dailyTime', today);
    
    try {
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        const data = dailyDoc.data();
        const todaySeconds = data.totalSeconds || 0;
        logger.log(`Today's total working time: ${todaySeconds} seconds`);
        
        // Set the timer to show today's accumulated time
        if (window.timerService) {
          window.timerService.setTodayTime(todaySeconds);
        }
      } else {
        logger.log("No time logged for today yet");
        // Set timer to 0 for new day
        if (window.timerService) {
          window.timerService.setTodayTime(0);
        }
      }
    } catch (error) {
      logger.error("Error loading today's time:", error);
      // Set timer to 0 if there's an error
      if (window.timerService) {
        window.timerService.setTodayTime(0);
      }
    }
  }

  async finalizeTodaysTime() {
    if (!this.currentUser) return;
    
    const today = formatDateString(new Date());
    const dailyRef = doc(db, 'users', this.currentUser.uid, 'dailyTime', today);
    
    try {
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        const data = dailyDoc.data();
        const totalSeconds = data.totalSeconds || 0;
        
        if (totalSeconds > 0 && !data.finalized) {
          // Create a finalized daily record
          const dailyRecordRef = doc(db, 'users', this.currentUser.uid, 'dailyRecords', today);
          
          await setDoc(dailyRecordRef, {
            date: today,
            totalSeconds: totalSeconds,
            totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
            finalizedAt: new Date().toISOString(),
            dayOfWeek: new Date(today).toLocaleDateString('en-US', { weekday: 'long' })
          });
          
          // Mark the daily time as finalized
          await updateDoc(dailyRef, {
            finalized: true,
            finalizedAt: new Date().toISOString()
          });
          
          logger.log(`Day ${today} finalized with ${totalSeconds} seconds (${Math.round((totalSeconds / 3600) * 100) / 100} hours)`);
        }
      }
    } catch (error) {
      logger.error("Error finalizing today's time:", error);
    }
  }

  async checkAndFinalizePreviousDays() {
    if (!this.currentUser) return;
    
    const today = formatDateString(new Date());
    
    try {
      // Get all daily time records (simplified query to avoid index requirements)
      const dailyTimeRef = collection(db, 'users', this.currentUser.uid, 'dailyTime');
      const unfinalizedQuery = query(
        dailyTimeRef, 
        where('finalized', '==', false)
      );
      
      const snapshot = await getDocs(unfinalizedQuery);
      
      // Process each unfinalized record
      const finalizationPromises = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const recordDate = data.date;
        
        // Only finalize days that are not today
        if (recordDate !== today && data.totalSeconds > 0) {
          logger.log(`Finalizing previous day: ${recordDate}`);
          
          const finalizationPromise = this.finalizeDay(doc, data, recordDate);
          finalizationPromises.push(finalizationPromise);
        }
      });
      
      // Wait for all finalizations to complete
      await Promise.all(finalizationPromises);
      
    } catch (error) {
      logger.error("Error checking previous days:", error);
    }
  }

  async finalizeDay(doc, data, recordDate) {
    try {
      // Create finalized record
      const dailyRecordRef = doc(db, 'users', this.currentUser.uid, 'dailyRecords', recordDate);
      
      await setDoc(dailyRecordRef, {
        date: recordDate,
        totalSeconds: data.totalSeconds,
        totalHours: Math.round((data.totalSeconds / 3600) * 100) / 100,
        finalizedAt: new Date().toISOString(),
        dayOfWeek: new Date(recordDate).toLocaleDateString('en-US', { weekday: 'long' })
      });
      
      // Mark as finalized
      await updateDoc(doc.ref, {
        finalized: true,
        finalizedAt: new Date().toISOString()
      });
      
      logger.log(`Successfully finalized day: ${recordDate}`);
    } catch (error) {
      logger.error(`Error finalizing day ${recordDate}:`, error);
    }
  }

  async getDailyRecords(days = 30) {
    if (!this.currentUser) return [];
    
    try {
      const recordsRef = collection(db, 'users', this.currentUser.uid, 'dailyRecords');
      const recordsQuery = query(
        recordsRef,
        orderBy('date', 'desc'),
        limit(days)
      );
      
      const snapshot = await getDocs(recordsQuery);
      const records = [];
      
      snapshot.forEach((doc) => {
        records.push(doc.data());
      });
      
      logger.log(`Retrieved ${records.length} daily records`);
      return records;
    } catch (error) {
      logger.error("Error getting daily records:", error);
      return [];
    }
  }

  async getWeeklySummary() {
    const records = await this.getDailyRecords(7);
    
    const totalSeconds = records.reduce((sum, record) => sum + (record.totalSeconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const avgHoursPerDay = records.length > 0 ? Math.round((totalHours / records.length) * 100) / 100 : 0;
    
    return {
      totalHours,
      avgHoursPerDay,
      daysWorked: records.length,
      records
    };
  }

  async getMonthlySummary() {
    const records = await this.getDailyRecords(30);
    
    const totalSeconds = records.reduce((sum, record) => sum + (record.totalSeconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const avgHoursPerDay = records.length > 0 ? Math.round((totalHours / records.length) * 100) / 100 : 0;
    
    return {
      totalHours,
      avgHoursPerDay,
      daysWorked: records.length,
      records
    };
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

// Create and export singleton instance
export const dataService = new DataService();
