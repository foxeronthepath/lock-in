// Firebase Configuration
// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZrwIsx8Fs9O07-9OOuKLYqd-PBBw7LN4",
  authDomain: "lock-in-5e24e.firebaseapp.com",
  projectId: "lock-in-5e24e",
  storageBucket: "lock-in-5e24e.firebasestorage.app",
  messagingSenderId: "274698678652",
  appId: "1:274698678652:web:b9483255c355b1860b74f9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialized successfully!");
