// ============================================================
// Firebase + Cloudinary Configuration - PhotoVault
// ============================================================
// Firebase: Authentication + Firestore (FREE)
// Cloudinary: Image Storage (25GB FREE)
//
// SETUP:
// 1. Firebase Console: https://console.firebase.google.com/
//    - Create project → Add Web App → Copy config below
//    - Enable Authentication (Email/Password)
//    - Create Firestore Database (test mode)
//
// 2. Cloudinary: https://cloudinary.com/
//    - Create FREE account
//    - Dashboard se "Cloud Name" copy karo
//    - Settings > Upload > Add Upload Preset (Unsigned) → preset name copy karo
//
// Firestore Rules (paste in Firebase Console > Firestore > Rules):
// ----------------------------------------------------------------
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /media/{document} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//       allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//     }
//     match /folders/{document} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//       allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//     }
//   }
// }
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ REPLACE WITH YOUR FIREBASE CONFIG ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyAb0EDY5NDUr4tocYh_dV6mMiw0Z9F37TA",
  authDomain: "photos-6e67c.firebaseapp.com",
  projectId: "photos-6e67c",
  storageBucket: "photos-6e67c.firebasestorage.app",
  messagingSenderId: "683403133965",
  appId: "1:683403133965:web:196b07e5e18e8429bb0144",
  measurementId: "G-FTRFE4CS5J"
};

// ⚠️ REPLACE WITH YOUR CLOUDINARY CONFIG ⚠️
const cloudinaryConfig = {
    cloudName: "YOUR_CLOUD_NAME",           // Cloudinary Dashboard se copy karo
    uploadPreset: "YOUR_UPLOAD_PRESET"      // Settings > Upload > Upload Presets (Unsigned)
};

// Initialize Firebase (Auth + Firestore only, NO Storage needed!)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export services and functions for app.js
window.firebaseServices = { auth, db };
window.cloudinaryConfig = cloudinaryConfig;
window.firebaseAuth = { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
window.firebaseFirestore = { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, serverTimestamp };
