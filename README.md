# PhotoVault - Premium Web Gallery (100% FREE)

A modern, premium web-based gallery application built with Vanilla JavaScript, Tailwind CSS, Firebase (Auth + Firestore) and **Cloudinary** (FREE image storage).

## 💰 Cost: ₹0 (ZERO)

| Service | Free Limit | Used For |
|---------|-----------|----------|
| **Firebase Auth** | Unlimited users | Login/Register |
| **Firebase Firestore** | 1 GB storage, 50K reads/day | Photo metadata, albums |
| **Cloudinary** | 25 GB storage, 25 GB bandwidth/month | Image hosting |
| **Vercel** | 100 GB bandwidth/month | Website hosting |

---

## Features

- **Authentication** - Email/password sign in & registration via Firebase Auth
- **Photo Upload** - Drag & drop or click-to-upload with progress bar (images only)
- **Cloudinary Storage** - 25GB FREE image hosting with auto-optimization
- **Album Management** - Create, delete, and organize photos into custom albums
- **Masonry Grid** - Beautiful responsive masonry layout
- **Lightbox** - Full-screen image viewer with keyboard navigation
- **Dark/Light Mode** - Toggle with localStorage persistence
- **Search** - Filter photos by filename
- **Responsive** - Works seamlessly on mobile and desktop
- **Vercel Ready** - One-click deploy

---

## 🚀 Quick Start (5 Minutes Setup)

### Step 1: Cloudinary Account (FREE)

1. Go to [cloudinary.com](https://cloudinary.com/) → **Sign Up Free**
2. Dashboard se **Cloud Name** copy karo
3. **Settings** → **Upload** → **Upload Presets** section
4. **"Add Upload Preset"** click karo:
   - **Signing Mode:** `Unsigned` ⚠️ (important!)
   - **Folder:** `photovault`
   - **Save** karo
5. Jo preset name mila (e.g., `ml_default` ya custom name), wo copy karo

### Step 2: Firebase Project (FREE)

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. **"Add Project"** → naam do → create karo
3. Web app add karo (`</>` icon) → config copy karo
4. **Authentication** → Sign-in method → **Email/Password** enable karo
5. **Firestore Database** → Create database → **Start in test mode**

### Step 3: Config Update karo

Open `js/firebase-config.js` and replace values:

```javascript
// Firebase Config
const firebaseConfig = {
    apiKey: "APNI_API_KEY",
    authDomain: "APNA_PROJECT.firebaseapp.com",
    projectId: "APNA_PROJECT_ID",
    storageBucket: "APNA_PROJECT.appspot.com",
    messagingSenderId: "APNA_SENDER_ID",
    appId: "APNA_APP_ID"
};

// Cloudinary Config
const cloudinaryConfig = {
    cloudName: "APNA_CLOUD_NAME",
    uploadPreset: "APNA_UPLOAD_PRESET"
};
```

### Step 4: Deploy to Vercel

```bash
# Option A: CLI
npm install -g vercel
vercel --prod

# Option B: Website
# vercel.com/new → Import GitHub repo → Deploy
```

### Step 5: Done! 🎉

---

## 🐍 Python Setup Script

Interactive wizard jo sab automatically karta hai:

```bash
# Full interactive menu
python setup_firebase.py

# Individual commands
python setup_firebase.py --generate-config    # Firebase + Cloudinary config
python setup_firebase.py --generate-rules     # Firestore security rules
python setup_firebase.py --validate           # Config check karo
python setup_firebase.py --deploy             # Vercel pe deploy (prod)
python setup_firebase.py --help               # Help
```

---

## 🔐 Firestore Security Rules

Firebase Console → Firestore → Rules me paste karo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /media/{document} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /folders/{document} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

> ⚠️ Firebase Storage rules ki ab zaroorat NAHI hai — hum Cloudinary use kar rahe hain!

---

## 📁 Project Structure

```
Photos/
├── index.html              # Main HTML with complete UI
├── vercel.json             # Vercel deployment config
├── package.json            # Node.js package config
├── setup_firebase.py       # Python setup & deploy wizard
├── css/
│   └── styles.css          # Custom CSS (masonry, animations)
├── js/
│   ├── firebase-config.js  # Firebase + Cloudinary config
│   ├── cloudinary-upload.js # Cloudinary upload module (FREE)
│   └── app.js              # Main application logic
├── assets/                 # Static assets
└── README.md               # This file
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                      │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  HTML   │  │  Tailwind │  │  Vanilla  │  │
│  │  + UI   │  │    CSS    │  │    JS     │  │
│  └─────────┘  └──────────┘  └───────────┘  │
└───────────┬────────────────────┬────────────┘
            │                    │
    ┌───────▼───────┐   ┌───────▼───────┐
    │   Firebase    │   │  Cloudinary   │
    │  (FREE)       │   │  (FREE)       │
    │               │   │               │
    │ • Auth        │   │ • 25GB Storage│
    │ • Firestore   │   │ • Auto CDN   │
    │   (metadata)  │   │ • Optimize   │
    └───────────────┘   └───────────────┘
```

---

## ⚡ Upload Flow

1. User selects image → **File type validated** (video blocked!)
2. Image uploaded to **Cloudinary** (progress bar shown)
3. Cloudinary returns **secure URL + public_id**
4. Metadata saved to **Firestore** (url, filename, folder, timestamp)
5. Gallery refreshes automatically ✅

---

## 🚫 Upload Restrictions

- **Only image files** allowed: `.jpg`, `.png`, `.webp`, `.gif`, `.bmp`, `.svg`
- **Video uploads BLOCKED** — shows error toast: "Video uploads are not supported"
- Double validation: once on file select, once before upload

---

## 🌐 Deploy to Vercel

### Method 1: One-Click (Easiest)
1. [vercel.com/new](https://vercel.com/new)
2. Import `AAKASH-CODES-CODE/Photos`
3. Framework: `Other`
4. Deploy ✅

### Method 2: CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Method 3: Python Script
```bash
python setup_firebase.py --deploy
```

---

## 🔧 Local Development

```bash
# Python server
python -m http.server 8000

# Or Node.js
npx serve . -l 3000

# Or package.json script
npm start
```

Open `http://localhost:8000`

---

## License

MIT
