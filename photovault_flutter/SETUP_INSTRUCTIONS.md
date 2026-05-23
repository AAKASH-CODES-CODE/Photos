# 🚀 Quick Setup Guide

## Important Note

Ye repo me sirf **main app code** push kiya gaya hai (lib/, pubspec.yaml, AndroidManifest.xml).
Flutter ke baki platform files (gradle, ios, etc.) tumhe **automatically generate** karne hain.

## Quick Setup (3 commands):

```bash
# 1. Clone karo
git clone https://github.com/AAKASH-CODES-CODE/Photos.git
cd Photos

# 2. Flutter platform files create karo
flutter create photovault_flutter --org com.photovault --project-name photovault_flutter

# 3. Dependencies install karo aur run karo
cd photovault_flutter
flutter pub get
flutter run
```

## Why this works:

- `flutter create` purane code ko **overwrite NAHI karta** (sirf missing files add karta hai)
- Tumhare `lib/`, `pubspec.yaml`, aur `AndroidManifest.xml` safe rahenge
- Sirf `android/`, `ios/`, `web/` ke missing files create honge

## Done! 🎉

Ab phone connect karo aur `flutter run` chalao!
