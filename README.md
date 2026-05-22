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

## Tech Stack

- HTML5 + Vanilla JavaScript (ES6+ Modules)
- Tailwind CSS (CDN)
- Firebase Authentication
- Firebase Cloud Firestore
- Firebase Cloud Storage

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, click the web icon (`</>`) to add a web app
4. Copy your `firebaseConfig` object

### 2. Configure the App

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

### 5. Run the App

Since this uses ES modules, you need a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
Photos/
├── index.html              # Main HTML with complete UI
├── css/
│   └── styles.css          # Custom CSS (masonry, animations, transitions)
├── js/
│   ├── firebase-config.js  # Firebase initialization & config
│   └── app.js              # Main application logic
├── assets/                 # Static assets (if needed)
└── README.md               # This file
```

## Upload Restrictions

- **Only image files** are allowed: `.jpg`, `.png`, `.webp`, `.gif`, `.bmp`, `.svg`
- **Video uploads are blocked** — attempting to upload a video shows an error toast
- File validation happens both on selection and before upload

## License

MIT
