// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth"; // إضافة Authentication

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
export const auth = getAuth(app); // إضافة Authentication

// Connect to emulators للتستينج
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Auth Emulator
  if (!auth._delegate._config.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  // Firestore Emulator  
  if (!db._delegate._databaseId.database.includes('localhost')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

// const analytics = getAnalytics(app);