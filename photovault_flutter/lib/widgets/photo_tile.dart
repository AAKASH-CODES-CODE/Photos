// ============================================================
// Photo Tile - Single photo thumbnail in grid
// ============================================================
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';

class PhotoTile extends StatelessWidget {
  final AssetEntity photo;
  final VoidCallback onTap;

  const PhotoTile({super.key, required this.photo, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: FutureBuilder<Uint8List?>(
        future: photo.thumbnailDataWithSize(
          const ThumbnailSize(300, 300),
          quality: 80,
        ),
        builder: (_, snap) {
          if (!snap.hasData || snap.data == null) {
            return Container(
              color: Colors.grey.withOpacity(0.2),
              child: const Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            );
          }
          return Image.memory(
            snap.data!,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          );
        },
      ),
    );
  }
}
