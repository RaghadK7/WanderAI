import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your Firebase config
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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development/testing
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Check if already connected to avoid multiple connections
  if (!auth._delegate._config.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  if (!db._delegate._databaseId.database.includes('localhost')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

export default app;