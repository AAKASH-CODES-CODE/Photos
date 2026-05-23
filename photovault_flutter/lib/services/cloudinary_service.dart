// ============================================================
// Cloudinary Upload Service
// ============================================================
import 'dart:io';
import 'package:dio/dio.dart';
import '../config/constants.dart';

class CloudinaryService {
  static final Dio _dio = Dio();

  /// Upload a single image file to Cloudinary
  /// Returns the secure URL of uploaded image, or null on failure
  static Future<String?> uploadImage(File file, {
    Function(double)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
        'upload_preset': CloudinaryConfig.uploadPreset,
        'folder': 'photovault',
      });

      final response = await _dio.post(
        CloudinaryConfig.uploadUrl,
        data: formData,
        onSendProgress: (sent, total) {
          if (total > 0 && onProgress != null) {
            onProgress(sent / total);
          }
        },
      );

      if (response.statusCode == 200) {
        return response.data['secure_url'] as String?;
      }
      return null;
    } catch (e) {
      print('[Cloudinary] Upload failed: $e');
      return null;
    }
  }
}
