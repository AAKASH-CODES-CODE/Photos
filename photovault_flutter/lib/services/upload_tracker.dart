// ============================================================
// Upload Tracker - Track which photos are already uploaded
// ============================================================
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class UploadTracker {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Check if photo (by ID) is already uploaded
  static bool isUploaded(String photoId) {
    final list = _prefs?.getStringList(AppConfig.uploadedPhotosKey) ?? [];
    return list.contains(photoId);
  }

  /// Mark photo as uploaded
  static Future<void> markUploaded(String photoId) async {
    await init();
    final list = _prefs!.getStringList(AppConfig.uploadedPhotosKey) ?? [];
    if (!list.contains(photoId)) {
      list.add(photoId);
      await _prefs!.setStringList(AppConfig.uploadedPhotosKey, list);
    }
  }

  /// Get count of uploaded photos
  static int getUploadedCount() {
    return _prefs?.getStringList(AppConfig.uploadedPhotosKey)?.length ?? 0;
  }

  /// Reset (clear all tracking) - for testing
  static Future<void> reset() async {
    await _prefs?.remove(AppConfig.uploadedPhotosKey);
  }
}
