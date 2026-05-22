// ============================================================
// Firebase Configuration - PhotoVault
// ============================================================
// IMPORTANT: Replace the values below with your own Firebase project config.
// 
// To get your config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or select existing)
// 3. Add a Web App (click </> icon)
// 4. Copy your firebaseConfig object here
// 5. Enable Authentication (Email/Password) in Firebase Console
// 6. Create a Firestore Database (start in test mode)
// 7. Enable Cloud Storage in Firebase Console
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
//
// Storage Rules (paste in Firebase Console > Storage > Rules):
// ----------------------------------------------------------------
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /users/{userId}/{allPaths=**} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ⚠️ REPLACE WITH YOUR FIREBASE CONFIG ⚠️
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services and functions for app.js
window.firebaseServices = { auth, db, storage };
window.firebaseAuth = { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
window.firebaseFirestore = { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, serverTimestamp };
window.firebaseStorage = { ref, uploadBytesResumable, getDownloadURL, deleteObject };
