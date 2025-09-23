// Authentication Module
import { auth, db } from '../../config/firebase.js';
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

import { generateHistoricalData } from '../utils/dataGenerator.js';
import { formatDateString } from '../utils/dateUtils.js';
import { logger } from '../../utils/logger.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authInitialized = false;
    this.init();
  }

  init() {
    // Check authentication state on app start
    onAuthStateChanged(auth, (user) => {
      // Debounce rapid auth state changes
      if (this.authStateTimeout) {
        clearTimeout(this.authStateTimeout);
      }
      
      this.authStateTimeout = setTimeout(() => {
        this.currentUser = user;
        this.authInitialized = true;
        this.handleAuthStateChange(user);
      }, 100); // Small delay to prevent rapid fire
    });
  }

  async handleAuthStateChange(user) {
    logger.log("Auth state changed. User:", user ? user.email : "null");
    logger.log("Current pathname:", window.location.pathname);
    
    if (user) {
      logger.log("User is logged in:", user.email);
      
      // Redirect to main page if on login page
      if (window.location.pathname.includes('login.html') || window.location.pathname.endsWith('/login.html')) {
        logger.log("Redirecting from login to index...");
        window.location.href = 'index.html';
        return;
      }
      
      // Initialize main app if on main page
      if (document.getElementById('timerSection')) {
        await this.initializeUserData();
      }
      
    } else {
      logger.log("User is logged out");
      this.currentUser = null;
      
      // Redirect to login if on main page or root
      const isMainPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname.endsWith('/') ||
                        window.location.pathname === '';
      
      if (isMainPage) {
        logger.log("Redirecting to login page...");
        window.location.href = 'login.html';
        return;
      }
    }
  }

  async signUp(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.log("User created successfully:", userCredential.user.email);
      
      // Initialize user data in database
      await this.createUserDocument(userCredential.user);
      
      return userCredential.user;
    } catch (error) {
      logger.error("Sign up error:", error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signIn(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.log("User signed in successfully:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      logger.error("Sign in error:", error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async logout() {
    try {
      // Finalize today's time before logging out
      if (window.dataService && this.currentUser) {
        await window.dataService.finalizeTodaysTime();
      }
      
      await signOut(auth);
      logger.log("User signed out successfully");
    } catch (error) {
      logger.error("Sign out error:", error);
      throw error;
    }
  }

  async createUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      email: user.email,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(userRef, userData);
      logger.log("User data initialized in database");
    } catch (error) {
      logger.error("Error initializing user data:", error);
    }
  }

  async initializeUserData() {
    if (!this.currentUser) return;

    try {
      logger.log("Initializing user data for:", this.currentUser.email);
      
      // Load existing data and check if we need to generate historical data
      await this.checkAndGenerateHistoricalData();
      
      // Load today's time
      if (window.dataService) {
        logger.log("Loading today's time...");
        await window.dataService.loadTodayTime();
        
        logger.log("Checking previous days...");
        await window.dataService.checkAndFinalizePreviousDays();
      }
      
      logger.log("User data initialization completed");
      
    } catch (error) {
      logger.error("Error initializing user data:", error);
      // Don't let initialization errors break the app
    }
  }

  async checkAndGenerateHistoricalData() {
    if (!this.currentUser) return;
    
    try {
      const recordsRef = collection(db, 'users', this.currentUser.uid, 'dailyRecords');
      const recentQuery = query(recordsRef, limit(5));
      const snapshot = await getDocs(recentQuery);
      
      // If user has less than 5 records, generate historical data
      if (snapshot.size < 5) {
        logger.log('New user detected, generating historical work data...');
        await generateHistoricalData(this.currentUser.uid);
      }
    } catch (error) {
      logger.error('Error checking historical data:', error);
    }
  }

  getErrorMessage(errorCode) {
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

  getCurrentUser() {
    return this.currentUser;
  }
}

// Create and export singleton instance
export const authService = new AuthService();
