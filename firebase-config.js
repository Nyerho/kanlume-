// Firebase Configuration for KAN LUME Banking Platform
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBh5fiVKRvzO5eAxgE2zhoURdudC7haRLE",
  authDomain: "kanlume-8fab4.firebaseapp.com",
  projectId: "kanlume-8fab4",
  storageBucket: "kanlume-8fab4.firebasestorage.app",
  messagingSenderId: "687202395809",
  appId: "1:687202395809:web:4cdc93952dbfcc1bb932e0",
  measurementId: "G-KC34WBXQ6Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// For development - uncomment these lines if using Firebase emulators
// connectFirestoreEmulator(db, 'localhost', 8080);
// connectAuthEmulator(auth, 'http://localhost:9099');

// Export for use in other files
export { db, auth, analytics };

// Firestore data structure:
// /artifacts/{appId}/users/{userId}/
//   - profile: { firstName, lastName, email, phone, address, ssn, password }
//   - accounts: { checking: { balance }, savings: { balance } }
//   - transactions: [{ date, type, amount, description, fromAccount, toAccount }]
//   - bills: [{ payee, amount, dueDate, status }]

// Helper functions for data paths
export const getAppId = () => {
  return firebaseConfig.appId || 'kan-lume-banking';
};

export const getUserPath = (userId) => {
  return `artifacts/${getAppId()}/users/${userId}`;
};

export const getTransactionsPath = (userId) => {
  return `${getUserPath(userId)}/transactions`;
};

export const getBillsPath = (userId) => {
  return `${getUserPath(userId)}/bills`;
};