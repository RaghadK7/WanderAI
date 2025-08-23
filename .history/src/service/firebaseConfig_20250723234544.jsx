// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPS3tVhto9sA876-4J5qygDeqz0byf3Ro",
  authDomain: "wander-ai-eb6a1.firebaseapp.com",
  projectId: "wander-ai-eb6a1",
  storageBucket: "wander-ai-eb6a1.firebasestorage.app",
  messagingSenderId: "850060630817",
  appId: "1:850060630817:web:04ee10f6c9aa4b601dfc60",
  measurementId: "G-JVBDLD20S2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators for testing (improved approach)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Use a flag to track emulator connections
  let authEmulatorConnected = false;
  let firestoreEmulatorConnected = false;
  
  try {
    // Connect Auth Emulator
    if (!authEmulatorConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      authEmulatorConnected = true;
      console.log('Auth emulator connected');
    }
  } catch (error) {
    if (error.code !== 'auth/emulator-config-failed') {
      console.error('Auth emulator connection error:', error);
    }
  }
  
  try {
    // Connect Firestore Emulator
    if (!firestoreEmulatorConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      firestoreEmulatorConnected = true;
      console.log('Firestore emulator connected');
    }
  } catch (error) {
    if (error.code !== 'firestore/emulator-config-failed') {
      console.error('Firestore emulator connection error:', error);
    }
  }
}

// Uncomment if you need analytics
// const analytics = getAnalytics(app);