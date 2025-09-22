// Import Firebase authentication functions
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
  } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
  
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
  
  let currentUser = null;
  
  // Make currentUser available globally
  window.currentUser = null;
  
  // Check if user is already logged in when page loads
  onAuthStateChanged(window.auth, (user) => {
    if (user) {
      currentUser = user;
      window.currentUser = user;
      
      // If we're on the login page and user is authenticated, redirect to main page
      if (window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
        return;
      }
      
      // If we're on the main page, show the timer section
      if (document.getElementById('timerSection')) {
        showTimerSection();
        loadTodayTime();
        checkAndFinalizePreviousDays();
        // Generate historical data if this is a new user or they have no data
        checkAndGenerateHistoricalData();
      }
      
      console.log("User is logged in:", user.email);
    } else {
      currentUser = null;
      window.currentUser = null;
      
      // If we're on the main page and user is not authenticated, redirect to login
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.location.href = 'login.html';
        return;
      }
      
      console.log("User is logged out");
    }
  });
  
  // Sign up new user
  async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
      console.log("User created successfully:", userCredential.user.email);
      
      // Initialize user data in database
      await initializeUserData(userCredential.user);
      clearError();
      
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error("Sign up error:", error);
      showError(getErrorMessage(error.code));
    }
  }
  
  // Sign in existing user  
  async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
      console.log("User signed in successfully:", userCredential.user.email);
      clearError();
      
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error("Sign in error:", error);
      showError(getErrorMessage(error.code));
    }
  }
  
  // Logout user
  async function logout() {
    try {
      // Finalize today's time before logging out
      await finalizeTodaysTime();
      
      await signOut(window.auth);
      console.log("User signed out successfully");
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }
  
  // Initialize user data in database
  async function initializeUserData(user) {
    const userRef = doc(window.db, 'users', user.uid);
    const userData = {
      email: user.email,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(userRef, userData);
      console.log("User data initialized in database");
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  }
  
  // Get today's date as a string (YYYY-MM-DD)
  function getTodayDateString() {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  }
  
  // Save daily working time
  async function saveDailyTime(additionalSeconds) {
    if (!currentUser || additionalSeconds < 1) return;
    
    const today = getTodayDateString();
    const dailyRef = doc(window.db, 'users', currentUser.uid, 'dailyTime', today);
    
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
      
      console.log(`Daily time updated: +${additionalSeconds} seconds for ${today}`);
    } catch (error) {
      console.error("Error saving daily time:", error);
    }
  }
  
  // Finalize today's time (save it as a completed daily record)
  async function finalizeTodaysTime() {
    if (!currentUser) return;
    
    const today = getTodayDateString();
    const dailyRef = doc(window.db, 'users', currentUser.uid, 'dailyTime', today);
    
    try {
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        const data = dailyDoc.data();
        const totalSeconds = data.totalSeconds || 0;
        
        if (totalSeconds > 0 && !data.finalized) {
          // Create a finalized daily record
          const dailyRecordRef = doc(window.db, 'users', currentUser.uid, 'dailyRecords', today);
          
          await setDoc(dailyRecordRef, {
            date: today,
            totalSeconds: totalSeconds,
            totalHours: Math.round((totalSeconds / 3600) * 100) / 100, // Round to 2 decimal places
            finalizedAt: new Date().toISOString(),
            dayOfWeek: new Date(today).toLocaleDateString('en-US', { weekday: 'long' })
          });
          
          // Mark the daily time as finalized
          await updateDoc(dailyRef, {
            finalized: true,
            finalizedAt: new Date().toISOString()
          });
          
          console.log(`Day ${today} finalized with ${totalSeconds} seconds (${Math.round((totalSeconds / 3600) * 100) / 100} hours)`);
        }
      }
    } catch (error) {
      console.error("Error finalizing today's time:", error);
    }
  }
  
  // Check and finalize any previous unfinalized days
  async function checkAndFinalizePreviousDays() {
    if (!currentUser) return;
    
    const today = getTodayDateString();
    
    try {
      // Get all unfinalized daily time records
      const dailyTimeRef = collection(window.db, 'users', currentUser.uid, 'dailyTime');
      const unfinalizedQuery = query(
        dailyTimeRef, 
        where('finalized', '==', false),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(unfinalizedQuery);
      
      snapshot.forEach(async (doc) => {
        const data = doc.data();
        const recordDate = data.date;
        
        // Only finalize days that are not today
        if (recordDate !== today && data.totalSeconds > 0) {
          console.log(`Finalizing previous day: ${recordDate}`);
          
          // Create finalized record
          const dailyRecordRef = doc(window.db, 'users', currentUser.uid, 'dailyRecords', recordDate);
          
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
        }
      });
    } catch (error) {
      console.error("Error checking previous days:", error);
    }
  }
  
  // Get daily records for reports (last N days)
  async function getDailyRecords(days = 30) {
    if (!currentUser) return [];
    
    try {
      const recordsRef = collection(window.db, 'users', currentUser.uid, 'dailyRecords');
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
      
      console.log(`Retrieved ${records.length} daily records`);
      return records;
    } catch (error) {
      console.error("Error getting daily records:", error);
      return [];
    }
  }
  
  // Get weekly summary
  async function getWeeklySummary() {
    const records = await getDailyRecords(7);
    
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
  
  // Get monthly summary
  async function getMonthlySummary() {
    const records = await getDailyRecords(30);
    
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

  // Load today's accumulated time and set the timer display
  async function loadTodayTime() {
    if (!currentUser) return;
    
    const today = getTodayDateString();
    const dailyRef = doc(window.db, 'users', currentUser.uid, 'dailyTime', today);
    
    try {
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        const data = dailyDoc.data();
        const todaySeconds = data.totalSeconds || 0;
        console.log(`Today's total working time: ${todaySeconds} seconds`);
        
        // Set the timer to show today's accumulated time
        if (window.setTodayTime) {
          window.setTodayTime(todaySeconds);
        }
      } else {
        console.log("No time logged for today yet");
        // Set timer to 0 for new day
        if (window.setTodayTime) {
          window.setTodayTime(0);
        }
      }
    } catch (error) {
      console.error("Error loading today's time:", error);
      // Set timer to 0 if there's an error
      if (window.setTodayTime) {
        window.setTodayTime(0);
      }
    }
  }

  // Show timer section (for main page)
  function showTimerSection() {
    const loadingSection = document.getElementById('loadingSection');
    const timerSection = document.getElementById('timerSection');
    
    if (loadingSection) loadingSection.style.display = 'none';
    if (timerSection) {
      timerSection.style.display = 'block';
      // Show user email
      document.getElementById('userEmail').textContent = currentUser.email;
    }
  }
  
  // Error handling (for login page)
  function showError(message) {
    const errorElement = document.getElementById('authError');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }
  
  function clearError() {
    const errorElement = document.getElementById('authError');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'Authentication error. Please try again';
    }
  }
  
  // Check and generate historical data for new users
  async function checkAndGenerateHistoricalData() {
    if (!currentUser) return;
    
    try {
      // Check if user already has historical data
      const recordsRef = collection(window.db, 'users', currentUser.uid, 'dailyRecords');
      const recentQuery = query(recordsRef, limit(5));
      const snapshot = await getDocs(recentQuery);
      
      // If user has less than 5 records, generate historical data
      if (snapshot.size < 5) {
        console.log('New user detected, generating historical work data...');
        await generateHistoricalWorkData();
      }
    } catch (error) {
      console.error('Error checking historical data:', error);
    }
  }
  
  // Generate realistic historical work data for the past 60 days
  async function generateHistoricalWorkData() {
    if (!currentUser) return;
    
    try {
      const today = new Date();
      const records = [];
      
      console.log('Generating 60 days of historical work data...');
      
      // Generate 60 days of historical data
      for (let i = 1; i <= 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Skip some days randomly (weekends, sick days, vacations, etc.)
        // Higher chance to skip weekends
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let skipChance = isWeekend ? 0.7 : 0.15; // 70% chance to skip weekends, 15% for weekdays
        
        if (Math.random() < skipChance) continue;
        
        const dateString = formatDateForFirebase(date);
        
        // Generate realistic work hours based on day of week
        let baseHours;
        if (isWeekend) {
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
      console.log(`Saving ${records.length} historical work records...`);
      
      for (const record of records) {
        const recordRef = doc(window.db, 'users', currentUser.uid, 'dailyRecords', record.date);
        await setDoc(recordRef, record);
      }
      
      console.log(`Successfully generated ${records.length} days of historical work data`);
      
      // Also create corresponding dailyTime records (marked as finalized)
      for (const record of records) {
        const dailyTimeRef = doc(window.db, 'users', currentUser.uid, 'dailyTime', record.date);
        await setDoc(dailyTimeRef, {
          date: record.date,
          totalSeconds: record.totalSeconds,
          lastUpdated: record.finalizedAt,
          finalized: true,
          finalizedAt: record.finalizedAt,
          generated: true
        });
      }
      
      console.log('Historical data generation completed successfully');
      
    } catch (error) {
      console.error('Error generating historical work data:', error);
    }
  }
  
  // Format date for Firebase document ID (YYYY-MM-DD)
  function formatDateForFirebase(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }

  // Make functions available globally so HTML can call them
  window.signUp = signUp;
  window.signIn = signIn;
  window.logout = logout;
  window.saveDailyTime = saveDailyTime;
  window.finalizeTodaysTime = finalizeTodaysTime;
  window.getDailyRecords = getDailyRecords;
  window.getWeeklySummary = getWeeklySummary;
  window.getMonthlySummary = getMonthlySummary;