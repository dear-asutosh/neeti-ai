import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable Local Persistence for Firebase Auth
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase Persistence Error:", error);
  });

export const db = getFirestore(app);
export const storage = getStorage(app);

// JWT Token Management
const JWT_TOKEN_KEY = 'neeti_auth_token';
const JWT_EXPIRY_KEY = 'neeti_token_expiry';

// Simple JWT-like token generation (no external library needed)
export const generateAuthToken = (user) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Create token (Base64 encoded payload)
  const token = btoa(JSON.stringify(payload));
  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  
  // Store token and expiry
  localStorage.setItem(JWT_TOKEN_KEY, token);
  localStorage.setItem(JWT_EXPIRY_KEY, expiryTime.toString());
  
  return token;
};

// Verify JWT token validity
export const verifyAuthToken = () => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  const expiry = localStorage.getItem(JWT_EXPIRY_KEY);
  
  if (!token || !expiry) return null;
  
  const now = Date.now();
  if (now > parseInt(expiry)) {
    clearAuthToken();
    return null;
  }
  
  try {
    // Decode token (Base64)
    const payload = JSON.parse(atob(token));
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    clearAuthToken();
    return null;
  }
};

// Get stored token
export const getAuthToken = () => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

// Clear token
export const clearAuthToken = () => {
  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(JWT_EXPIRY_KEY);
};
