// ============================================================
// Gallery Screen - Main photos grid view
// ============================================================
import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/backup_manager.dart';
import '../widgets/photo_tile.dart';
import 'photo_view_screen.dart';

class GalleryScreen extends StatefulWidget {
  final VoidCallback onToggleTheme;
  const GalleryScreen({super.key, required this.onToggleTheme});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  List<AssetEntity> _photos = [];
  bool _loading = true;
  bool _permissionDenied = false;
  final BackupManager _backupManager = BackupManager();

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    setState(() => _loading = true);

    // Request permission
    final permission = await PhotoManager.requestPermissionExtend();
    if (!permission.isAuth) {
      setState(() {
        _permissionDenied = true;
        _loading = false;
      });
      return;
    }


    // Load all photos from device
    final albums = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      onlyAll: true,
    );

    if (albums.isNotEmpty) {
      final allPhotos = await albums.first.getAssetListRange(
        start: 0,
        end: 100000,
      );
      setState(() {
        _photos = allPhotos;
        _loading = false;
      });

      // Start background backup automatically
      _backupManager.addToQueue(allPhotos);
    } else {
      setState(() => _loading = false);
    }
  }

  void _openPhoto(int index) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PhotoViewScreen(photos: _photos, initialIndex: index),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'PhotoVault',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: widget.onToggleTheme,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPhotos,
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBackupStatus(),
    );
  }


  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_permissionDenied) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.photo_library_outlined, size: 80),
              const SizedBox(height: 16),
              const Text(
                'Photo Access Denied',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please grant photo access to use this app',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => openAppSettings(),
                child: const Text('Open Settings'),
              ),
            ],
          ),
        ),
      );
    }

    if (_photos.isEmpty) {
      return const Center(child: Text('No photos found on device'));
    }

    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 2,
        crossAxisSpacing: 2,
      ),
      itemCount: _photos.length,
      itemBuilder: (_, i) => PhotoTile(
        photo: _photos[i],
        onTap: () => _openPhoto(i),
      ),
    );
  }


  Widget _buildBackupStatus() {
    return StreamBuilder<BackupStatus>(
      stream: _backupManager.statusStream,
      builder: (_, snap) {
        if (!snap.hasData) return const SizedBox.shrink();
        final s = snap.data!;
        if (s.total == 0) return const SizedBox.shrink();

        final progress = s.total > 0 ? s.uploaded / s.total : 0.0;

        return Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            border: Border(
              top: BorderSide(
                color: Theme.of(context).dividerColor.withOpacity(0.2),
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    s.isActive ? Icons.cloud_sync : Icons.cloud_done,
                    size: 18,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      s.message ?? 'Backed up: ${s.uploaded} / ${s.total}',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: progress,
                minHeight: 3,
                backgroundColor:
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
              ),
            ],
          ),
        );
      },
    );
  }
}
