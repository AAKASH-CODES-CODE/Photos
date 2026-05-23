# 📸 PhotoVault Flutter App

Google Photos jaisa app — phone ki saari photos automatic Cloudinary pe backup ho jayengi!

## ✨ Features

- ✅ **No login** — app open karo, direct gallery dikhega
- ✅ **Device ki saari photos** automatically dikhegi (Google Photos jaisa grid)
- ✅ **Auto background backup** to Cloudinary (FREE 25GB)
- ✅ **WiFi + Mobile Data** dono se upload
- ✅ **Already uploaded photos skip** ho jayengi (smart tracking)
- ✅ **Full screen view** with pinch zoom & swipe
- ✅ **Dark mode** toggle
- ✅ **Live progress** dikhega bottom me


## 🚀 App Kaise Run Kare (Step by Step)

### Step 1: Flutter Install

Agar Flutter installed hai toh ye command chalega:
```bash
flutter --version
```

Nahi hai toh download karo: https://flutter.dev/docs/get-started/install

### Step 2: Project Setup

```bash
# Repo clone karo
git clone https://github.com/AAKASH-CODES-CODE/Photos.git
cd Photos

# Flutter app folder me jao
cd photovault_flutter

# Dependencies install
flutter pub get
```

### Step 3: Phone Connect

**Option A: Physical Phone (Recommended)**
1. Phone me **Developer Options** ON karo
2. **USB Debugging** enable karo
3. USB cable se laptop me connect karo
4. Verify:
   ```bash
   flutter devices
   ```
   Tumhara phone dikhna chahiye.

**Option B: Emulator**
```bash
flutter emulators --launch <emulator_id>
```

### Step 4: Run!

```bash
flutter run
```

App phone pe install ho jayega aur khul jayega! 🎉

### Step 5: APK Build (Optional)

Agar tum direct APK install karna chahte ho:

```bash
flutter build apk --release
```

APK milega: `build/app/outputs/flutter-apk/app-release.apk`

Is APK ko phone me transfer karke install kar sakte ho.


## 🎯 First Time App Use

1. App open karo
2. **"Allow Photos"** permission de do (zaruri hai)
3. Saari photos grid me dikhne lagengi
4. **Background me automatic upload** start ho jayega
5. Bottom me progress dikhega: `Backed up: 5 / 100`

## 📂 Project Structure

```
photovault_flutter/
├── pubspec.yaml                  # Dependencies
├── lib/
│   ├── main.dart                 # App entry
│   ├── config/
│   │   └── constants.dart        # Cloudinary keys
│   ├── services/
│   │   ├── cloudinary_service.dart  # Upload logic
│   │   ├── backup_manager.dart      # Auto-backup queue
│   │   └── upload_tracker.dart      # Track uploaded
│   ├── screens/
│   │   ├── gallery_screen.dart      # Main grid
│   │   └── photo_view_screen.dart   # Full screen
│   └── widgets/
│       └── photo_tile.dart          # Single photo
└── android/
    └── app/src/main/
        └── AndroidManifest.xml      # Permissions
```

## 🔧 Cloudinary Already Configured

`lib/config/constants.dart` me already set hai:
- **Cloud Name:** `dpz8dkdvk`
- **Upload Preset:** `Photos`

Kuch change karne ki zarurat nahi! Bas `flutter run` karo.

## ⚙️ How It Works

```
App Open
  ↓
Permission Request (Photos)
  ↓
All Photos Load (grid)
  ↓
Background Backup Start
  ├── Photo 1 → Cloudinary ✅
  ├── Photo 2 → Cloudinary ✅
  └── ... (automatic, ek ek karke)
```

- **Already uploaded photos** SharedPreferences me track hoti hain
- App reopen karne pe wo photos skip ho jayengi
- Net cut hone pe wait karta hai, aage automatically retry karta hai

## 🐛 Troubleshooting

**"Photo Access Denied"** → Settings > Apps > PhotoVault > Permissions > Allow Photos

**Upload not working?** → Internet check karo, koi error toh nahi `flutter run` ke output me

**Build error?** → `flutter clean && flutter pub get && flutter run`

## License

MIT
