# PhotoVault - Premium Web Gallery

A modern, premium web-based gallery application built with Vanilla JavaScript, Tailwind CSS, and Firebase.

## Features

- **Authentication** - Email/password sign in & registration via Firebase Auth
- **Photo Upload** - Drag & drop or click-to-upload with progress bar (images only)
- **Album Management** - Create, delete, and organize photos into custom albums
- **Masonry Grid** - Beautiful responsive masonry layout
- **Lightbox** - Full-screen image viewer with keyboard navigation
- **Dark/Light Mode** - Toggle with localStorage persistence
- **Search** - Filter photos by filename
- **Responsive** - Works seamlessly on mobile and desktop
- **Vercel Ready** - One-click deploy to Vercel

## Tech Stack

- HTML5 + Vanilla JavaScript (ES6+ Modules)
- Tailwind CSS (CDN)
- Firebase Authentication
- Firebase Cloud Firestore
- Firebase Cloud Storage
- Vercel (Hosting/Deployment)

---

## 🚀 Deploy to Vercel (Live karna)

### Method 1: One-Click Deploy (Sabse Easy)

1. Apna repo GitHub pe push karo
2. Go to **[vercel.com/new](https://vercel.com/new)**
3. **"Import Git Repository"** click karo
4. Apna repo select karo: `AAKASH-CODES-CODE/Photos`
5. Settings me:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (default)
   - **Build Command:** (khali chhod do)
   - **Output Directory:** (khali chhod do)
6. **"Deploy"** click karo ✅

> 2-3 minute me live ho jayega! URL milega jaise: `https://photos-xyz.vercel.app`

### Method 2: Vercel CLI se Deploy

```bash
# Step 1: Vercel CLI install karo
npm install -g vercel

# Step 2: Project folder me jao
cd Photos

# Step 3: Login karo
vercel login

# Step 4: Deploy karo (Preview)
vercel

# Step 5: Production deploy
vercel --prod
```

### Method 3: Python Script se Deploy

```bash
# Interactive wizard chalao
python setup_firebase.py

# Ya directly deploy karo
python setup_firebase.py --deploy
```

---

## 🔧 Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, click the web icon (`</>`) to add a web app
4. Copy your `firebaseConfig` object

### 2. Configure the App (2 Methods)

#### Method A: Python Script (Recommended)
```bash
python setup_firebase.py --generate-config
```
Ye interactive prompt dega — bas apni Firebase values paste karo.

#### Method B: Manual
Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Enable Firebase Services

In the Firebase Console:

- **Authentication** → Sign-in method → Enable "Email/Password"
- **Firestore Database** → Create database → Start in test mode
- **Storage** → Get started → Start in test mode

### 4. Set Security Rules

Generate rules automatically:
```bash
python setup_firebase.py --generate-rules
```

Or manually copy:

#### Firestore Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /media/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /folders/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

#### Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run Locally

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using package.json script
npm start
```

Then open `http://localhost:8000` in your browser.

---

## 🐍 Python Setup Script

`setup_firebase.py` ek interactive wizard hai jo sab kuch manage karta hai:

```bash
# Full interactive menu
python setup_firebase.py

# Individual commands
python setup_firebase.py --generate-config   # Firebase config generate karo
python setup_firebase.py --generate-rules    # Security rules generate karo
python setup_firebase.py --validate          # Config validate karo
python setup_firebase.py --deploy            # Vercel pe deploy karo (prod)
python setup_firebase.py --deploy-preview    # Vercel pe preview deploy
python setup_firebase.py --help              # Help dikhao
```

---

## 📁 Project Structure

```
Photos/
├── index.html              # Main HTML with complete UI
├── vercel.json             # Vercel deployment configuration
├── package.json            # Node.js package config
├── setup_firebase.py       # Python setup & deploy script
├── css/
│   └── styles.css          # Custom CSS (masonry, animations, transitions)
├── js/
│   ├── firebase-config.js  # Firebase initialization & config
│   └── app.js              # Main application logic
├── assets/                 # Static assets (if needed)
└── README.md               # This file
```

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Firebase config set karo
python setup_firebase.py --generate-config

# 2. Security rules generate karo
python setup_firebase.py --generate-rules

# 3. Locally test karo
python -m http.server 8000

# 4. Vercel pe live karo
vercel --prod
```

---

## Upload Restrictions

- **Only image files** are allowed: `.jpg`, `.png`, `.webp`, `.gif`, `.bmp`, `.svg`
- **Video uploads are blocked** — attempting to upload a video shows an error toast
- File validation happens both on selection and before upload

## License

MIT
