// Optimized Firebase configuration - only import what we need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Removed storage import to reduce bundle size

const firebaseConfig = {
  apiKey: "AIzaSyAGm3bzsCxYSARcgVn41ta_EOut9fauWr0",
  authDomain: "ecommerce-74229.firebaseapp.com",
  projectId: "ecommerce-74229",
  storageBucket: "ecommerce-74229.firebasestorage.app",
  messagingSenderId: "47160479095",
  appId: "1:47160479095:web:0dd3a844d5d5c3847ea572",
  measurementId: "G-47FYXTR59Z"
};

// Initialize Firebase with minimal configuration
const app = initializeApp(firebaseConfig);

// Only initialize services we actually use
export const db = getFirestore(app);
export const auth = getAuth(app);
// Storage removed to reduce bundle size