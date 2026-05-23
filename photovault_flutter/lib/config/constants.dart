// ============================================================
// Cloudinary Configuration
// ============================================================
// Tumhare Cloudinary account ki details (already configured!)
// ============================================================

class CloudinaryConfig {
  static const String cloudName = 'dpz8dkdvk';
  static const String uploadPreset = 'Photos';

  static String get uploadUrl =>
      'https://api.cloudinary.com/v1_1/$cloudName/image/upload';
}

class AppConfig {
  static const String appName = 'PhotoVault';

  // Background upload settings
  static const int maxConcurrentUploads = 2;
  static const Duration retryDelay = Duration(seconds: 30);

  // SharedPreferences keys
  static const String uploadedPhotosKey = 'uploaded_photos';
  static const String darkModeKey = 'dark_mode';
}
