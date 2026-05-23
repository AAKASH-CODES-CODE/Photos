// ============================================================
// Backup Manager - Background queue uploader
// ============================================================
import 'dart:async';
import 'package:photo_manager/photo_manager.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'cloudinary_service.dart';
import 'upload_tracker.dart';

class BackupManager {
  static final BackupManager _instance = BackupManager._internal();
  factory BackupManager() => _instance;
  BackupManager._internal();

  final List<AssetEntity> _queue = [];
  bool _isUploading = false;
  int _uploadedCount = 0;
  int _totalCount = 0;

  // Listeners for UI updates
  final _statusController = StreamController<BackupStatus>.broadcast();
  Stream<BackupStatus> get statusStream => _statusController.stream;

  /// Add photos to upload queue (skips already uploaded)
  void addToQueue(List<AssetEntity> photos) {
    for (final photo in photos) {
      if (!UploadTracker.isUploaded(photo.id) &&
          !_queue.any((p) => p.id == photo.id)) {
        _queue.add(photo);
      }
    }
    _totalCount = _queue.length + _uploadedCount;
    _emit();
    _processQueue();
  }


  Future<void> _processQueue() async {
    if (_isUploading || _queue.isEmpty) return;
    _isUploading = true;

    while (_queue.isNotEmpty) {
      // Check internet (WiFi or mobile data — both allowed)
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity == ConnectivityResult.none) {
        // No internet - wait and retry
        _emit(message: 'Waiting for internet...');
        await Future.delayed(const Duration(seconds: 10));
        continue;
      }

      final photo = _queue.first;

      try {
        final file = await photo.file;
        if (file == null) {
          _queue.removeAt(0);
          continue;
        }

        _emit(message: 'Uploading ${_uploadedCount + 1}/$_totalCount...');

        final url = await CloudinaryService.uploadImage(file);

        if (url != null) {
          await UploadTracker.markUploaded(photo.id);
          _uploadedCount++;
          _queue.removeAt(0);
          _emit();
        } else {
          // Upload failed - retry later
          await Future.delayed(const Duration(seconds: 5));
        }
      } catch (e) {
        print('[Backup] Error: $e');
        await Future.delayed(const Duration(seconds: 5));
      }
    }

    _isUploading = false;
    _emit(message: 'All photos backed up ✓');
  }

  void _emit({String? message}) {
    _statusController.add(BackupStatus(
      uploaded: _uploadedCount,
      total: _totalCount,
      pending: _queue.length,
      isActive: _isUploading,
      message: message,
    ));
  }

  void dispose() => _statusController.close();
}

class BackupStatus {
  final int uploaded;
  final int total;
  final int pending;
  final bool isActive;
  final String? message;
  BackupStatus({
    required this.uploaded,
    required this.total,
    required this.pending,
    required this.isActive,
    this.message,
  });
}
