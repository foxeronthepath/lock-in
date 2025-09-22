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
    increment 
  } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
  
  let currentUser = null;
  
  // Check if user is already logged in when page loads
  onAuthStateChanged(window.auth, (user) => {
    if (user) {
      currentUser = user;
      
      // If we're on the login page and user is authenticated, redirect to main page
      if (window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
        return;
      }
      
      // If we're on the main page, show the timer section
      if (document.getElementById('timerSection')) {
        showTimerSection();
        loadUserStats();
      }
      
      console.log("User is logged in:", user.email);
    } else {
      currentUser = null;
      
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
      totalTime: 0,
      totalSessions: 0,
      createdAt: new Date().toISOString(),
      lastSession: null
    };
    
    try {
      await setDoc(userRef, userData);
      console.log("User data initialized in database");
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  }
  
  // Save completed session to database
  async function saveSession(sessionTimeInSeconds) {
    if (!currentUser || sessionTimeInSeconds < 1) return;
    
    const userRef = doc(window.db, 'users', currentUser.uid);
    
    try {
      await updateDoc(userRef, {
        totalTime: increment(sessionTimeInSeconds),
        totalSessions: increment(1),
        lastSession: new Date().toISOString()
      });
      
      console.log(`Session saved: ${sessionTimeInSeconds} seconds`);
      loadUserStats(); // Refresh stats display
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }
  
  // Load user stats from database
  async function loadUserStats() {
    if (!currentUser) return;
    
    const userRef = doc(window.db, 'users', currentUser.uid);
    
    try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        updateStatsDisplay(data);
      } else {
        // User document doesn't exist, create it
        await initializeUserData(currentUser);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }
  
  // Update the stats display on the page
  function updateStatsDisplay(userData) {
    const totalMinutes = Math.round((userData.totalTime || 0) / 60);
    const totalSessions = userData.totalSessions || 0;
    const lastSession = userData.lastSession 
      ? new Date(userData.lastSession).toLocaleDateString() 
      : 'Never';
    
    document.getElementById('totalTime').textContent = `${totalMinutes} minutes`;
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('lastSession').textContent = lastSession;
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
  
  // Make functions available globally so HTML can call them
  window.signUp = signUp;
  window.signIn = signIn;
  window.logout = logout;
  window.saveSession = saveSession;