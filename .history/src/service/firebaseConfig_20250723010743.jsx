// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (optional for testing)
// export const analytics = getAnalytics(app);

// Connect to emulators in development/testing environment
// Check if we're in localhost for testing
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (isLocalhost) {
  // Connect to Auth Emulator
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('🔥 Connected to Auth Emulator');
  } catch (error) {
    console.log('Auth Emulator already connected or not available');
  }
  
  // Connect to Firestore Emulator
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔥 Connected to Firestore Emulator');
  } catch (error) {
    console.log('Firestore Emulator already connected or not available');
  }
}

// Export default app
export default app;