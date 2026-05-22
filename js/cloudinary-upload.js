// ============================================================
// Cloudinary Upload Module - PhotoVault
// ============================================================
// FREE: 25 GB storage + 25 GB bandwidth/month
// Uses unsigned upload preset (no server needed!)
// ============================================================

const { cloudName, uploadPreset } = window.cloudinaryConfig;

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

/**
 * Upload a single image file to Cloudinary with progress tracking
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Callback with progress percentage (0-100)
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
export async function uploadToCloudinary(file, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'photovault'); // All uploads go to photovault folder

        const xhr = new XMLHttpRequest();
        xhr.open('POST', CLOUDINARY_URL, true);

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        // Handle success
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve({
                    url: response.secure_url,
                    publicId: response.public_id,
                    width: response.width,
                    height: response.height,
                    format: response.format,
                    bytes: response.bytes
                });
            } else {
                let errorMsg = 'Upload failed';
                try {
                    const errResponse = JSON.parse(xhr.responseText);
                    errorMsg = errResponse.error?.message || errorMsg;
                } catch (e) {}
                reject(new Error(errorMsg));
            }
        });

        // Handle network error
        xhr.addEventListener('error', () => {
            reject(new Error('Network error - check your internet connection'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        xhr.send(formData);
    });
}

/**
 * Delete an image from Cloudinary (requires server-side for signed deletes)
 * Note: For free tier, we just remove from Firestore. 
 * Cloudinary images on free plan without delete token stay on CDN.
 * To enable deletion, you'd need a backend endpoint.
 * 
 * For now, we only delete from Firestore (removes from app UI).
 * @param {string} publicId - Cloudinary public_id of the image
 */
export async function deleteFromCloudinary(publicId) {
    // Note: Unsigned deletion is not supported by Cloudinary for security.
    // Images will be removed from app UI (Firestore) but remain on Cloudinary CDN.
    // This is fine for free tier usage.
    // To fully delete, you'd set up a Cloud Function or backend endpoint.
    console.log(`[Cloudinary] Image removed from app: ${publicId}`);
    return true;
}

/**
 * Get optimized URL with transformations
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} Optimized URL
 */
export function getOptimizedUrl(url, options = {}) {
    const { width, height, quality = 'auto', format = 'auto' } = options;
    
    if (!url || !url.includes('cloudinary.com')) return url;

    // Insert transformations into Cloudinary URL
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    let transforms = [];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    transforms.push(`q_${quality}`);
    transforms.push(`f_${format}`);

    const transformStr = transforms.join(',');
    return `${parts[0]}/upload/${transformStr}/${parts[1]}`;
}

/**
 * Get thumbnail URL (300px wide, auto height)
 */
export function getThumbnailUrl(url) {
    return getOptimizedUrl(url, { width: 400, quality: 'auto', format: 'auto' });
}

// Make available globally
window.cloudinaryUpload = { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl, getThumbnailUrl };
