// ============================================================
// PhotoVault - Premium Gallery Application
// ============================================================

// Firebase SDK references (initialized from firebase-config.js)
const { auth, db } = window.firebaseServices;

// Cloudinary upload function
const { uploadToCloudinary, deleteFromCloudinary } = window.cloudinaryUpload;

// Import Firebase functions
const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} = window.firebaseAuth;

const {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} = window.firebaseFirestore;

// ============================================================
// STATE MANAGEMENT
// ============================================================
const state = {
    currentUser: null,
    currentView: 'photos',       // 'photos', 'videos', or folder ID
    currentFolder: null,
    mediaItems: [],
    folders: [],
    filteredItems: [],
    lightboxIndex: 0,
    isDarkMode: true,
    isUploading: false
};


// ============================================================
// AUTHENTICATION
// ============================================================
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('bg-white', 'dark:bg-gray-700', 'shadow', 'text-brand-600', 'dark:text-brand-400');
        loginTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        registerTab.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow', 'text-brand-600', 'dark:text-brand-400');
        registerTab.classList.add('text-gray-500', 'dark:text-gray-400');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTab.classList.add('bg-white', 'dark:bg-gray-700', 'shadow', 'text-brand-600', 'dark:text-brand-400');
        registerTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        loginTab.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow', 'text-brand-600', 'dark:text-brand-400');
        loginTab.classList.add('text-gray-500', 'dark:text-gray-400');
    }
    hideAuthError();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showAuthError(getAuthErrorMessage(error.code));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showAuthError(getAuthErrorMessage(error.code));
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        showToast('Error signing out', 'error');
    }
}

function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts. Please try again later'
    };
    return messages[code] || 'An error occurred. Please try again.';
}

function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function hideAuthError() {
    document.getElementById('authError').classList.add('hidden');
}


// ============================================================
// AUTH STATE OBSERVER
// ============================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        state.currentUser = user;
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('appMain').classList.remove('hidden');
        document.getElementById('appMain').classList.add('flex');
        document.getElementById('userEmail').textContent = user.email;
        loadFolders();
        loadMedia();
    } else {
        state.currentUser = null;
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('appMain').classList.add('hidden');
        document.getElementById('appMain').classList.remove('flex');
        state.mediaItems = [];
        state.folders = [];
    }
});

// ============================================================
// DARK MODE
// ============================================================
function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.classList.toggle('dark', state.isDarkMode);
    document.getElementById('sunIcon').classList.toggle('hidden', state.isDarkMode);
    document.getElementById('moonIcon').classList.toggle('hidden', !state.isDarkMode);
    localStorage.setItem('photovault-dark', state.isDarkMode);
}

function initTheme() {
    const saved = localStorage.getItem('photovault-dark');
    state.isDarkMode = saved !== null ? saved === 'true' : true;
    document.documentElement.classList.toggle('dark', state.isDarkMode);
    document.getElementById('sunIcon').classList.toggle('hidden', state.isDarkMode);
    document.getElementById('moonIcon').classList.toggle('hidden', !state.isDarkMode);
}


// ============================================================
// FOLDER MANAGEMENT
// ============================================================
async function loadFolders() {
    if (!state.currentUser) return;
    try {
        const q = query(
            collection(db, 'folders'),
            where('userId', '==', state.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        state.folders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderFolderList();
    } catch (error) {
        console.error('Error loading folders:', error);
    }
}

function renderFolderList() {
    const container = document.getElementById('folderList');
    container.innerHTML = state.folders.map(folder => `
        <button onclick="switchView('folder', '${folder.id}')" class="nav-item ${state.currentView === 'folder' && state.currentFolder === folder.id ? 'active' : ''} w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="flex-1 text-left truncate">${escapeHtml(folder.name)}</span>
            <span class="text-xs opacity-50">${folder.count || 0}</span>
            <button onclick="event.stopPropagation(); deleteFolder('${folder.id}')" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </button>
    `).join('');
}

function showCreateFolderModal() {
    document.getElementById('folderModal').classList.remove('hidden');
    document.getElementById('folderModal').classList.add('flex');
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderNameInput').focus();
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    document.getElementById('folderModal').classList.remove('flex');
}

async function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) {
        showToast('Please enter an album name', 'error');
        return;
    }
    try {
        await addDoc(collection(db, 'folders'), {
            name,
            userId: state.currentUser.uid,
            count: 0,
            createdAt: serverTimestamp()
        });
        closeFolderModal();
        showToast('Album created successfully', 'success');
        loadFolders();
    } catch (error) {
        showToast('Failed to create album', 'error');
    }
}

async function deleteFolder(folderId) {
    if (!confirm('Delete this album? Photos inside will be moved back to "All Photos".')) return;
    try {
        // Move all photos from this folder back to unassigned
        const q = query(
            collection(db, 'media'),
            where('userId', '==', state.currentUser.uid),
            where('folderId', '==', folderId)
        );
        const snapshot = await getDocs(q);
        const updates = snapshot.docs.map(d => updateDoc(doc(db, 'media', d.id), { folderId: null }));
        await Promise.all(updates);

        await deleteDoc(doc(db, 'folders', folderId));
        showToast('Album deleted', 'success');
        if (state.currentFolder === folderId) {
            switchView('photos');
        }
        loadFolders();
        loadMedia();
    } catch (error) {
        showToast('Failed to delete album', 'error');
    }
}


// ============================================================
// VIEW SWITCHING
// ============================================================
function switchView(view, folderId = null) {
    state.currentView = view === 'folder' ? 'folder' : view;
    state.currentFolder = folderId;

    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'photos') {
        document.getElementById('navPhotos').classList.add('active');
        document.getElementById('viewTitle').textContent = 'All Photos';
    } else if (view === 'videos') {
        document.getElementById('navVideos').classList.add('active');
        document.getElementById('viewTitle').textContent = 'Videos';
    } else if (view === 'folder') {
        const folder = state.folders.find(f => f.id === folderId);
        document.getElementById('viewTitle').textContent = folder ? folder.name : 'Album';
    }

    renderFolderList();
    renderMedia();

    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}

// ============================================================
// MEDIA LOADING & RENDERING
// ============================================================
async function loadMedia() {
    if (!state.currentUser) return;
    try {
        const q = query(
            collection(db, 'media'),
            where('userId', '==', state.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        state.mediaItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMedia();
    } catch (error) {
        console.error('Error loading media:', error);
    }
}

function renderMedia() {
    const grid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');
    const videosEmptyState = document.getElementById('videosEmptyState');
    const countEl = document.getElementById('mediaCount');

    // Show videos empty state
    if (state.currentView === 'videos') {
        grid.classList.add('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        videosEmptyState.classList.remove('hidden');
        videosEmptyState.classList.add('flex');
        countEl.textContent = '';
        return;
    }

    videosEmptyState.classList.add('hidden');
    videosEmptyState.classList.remove('flex');

    // Filter items based on view
    let items = state.mediaItems;
    if (state.currentView === 'folder' && state.currentFolder) {
        items = items.filter(item => item.folderId === state.currentFolder);
    }

    // Apply search filter
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    if (searchVal) {
        items = items.filter(item => 
            item.fileName.toLowerCase().includes(searchVal) ||
            (item.folderName && item.folderName.toLowerCase().includes(searchVal))
        );
    }

    state.filteredItems = items;
    countEl.textContent = items.length > 0 ? `${items.length} items` : '';

    if (items.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    grid.classList.remove('hidden');

    grid.innerHTML = items.map((item, index) => `
        <div class="media-card" onclick="openLightbox(${index})">
            <img src="${item.url}" alt="${escapeHtml(item.fileName)}" class="img-loading" onload="this.classList.remove('img-loading'); this.classList.add('img-loaded');" loading="lazy">
            <div class="card-overlay">
                <div class="card-actions">
                    <button onclick="event.stopPropagation(); showMoveModal('${item.id}')" title="Move to album">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    </button>
                    <button onclick="event.stopPropagation(); downloadImage('${item.url}', '${escapeHtml(item.fileName)}')" title="Download">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </button>
                    <button onclick="event.stopPropagation(); deleteMedia('${item.id}', '${item.publicId || ''}')" title="Delete">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
                <p class="text-white text-xs truncate opacity-80">${escapeHtml(item.fileName)}</p>
            </div>
        </div>
    `).join('');
}

function handleSearch(value) {
    renderMedia();
}


// ============================================================
// FILE UPLOAD
// ============================================================
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

function triggerUpload() {
    if (state.currentView === 'videos') {
        showToast('Video uploads are not supported', 'error');
        return;
    }
    document.getElementById('fileInput').click();
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Validate all files are images
    const invalidFiles = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    const videoFiles = files.filter(f => VIDEO_TYPES.includes(f.type) || f.type.startsWith('video/'));

    if (videoFiles.length > 0) {
        showToast('Video uploads are not supported', 'error');
        event.target.value = '';
        return;
    }

    if (invalidFiles.length > 0) {
        showToast('Only image files are allowed (JPG, PNG, WebP, GIF)', 'error');
        event.target.value = '';
        return;
    }

    // Upload each file
    for (const file of files) {
        await uploadFile(file);
    }

    event.target.value = '';
    loadMedia();
    loadFolders();
}

async function uploadFile(file) {
    // Double-check: strictly images only
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToast('Video uploads are not supported', 'error');
        return;
    }

    state.isUploading = true;
    const progressEl = document.getElementById('uploadProgress');
    const barEl = document.getElementById('uploadBar');
    const percentEl = document.getElementById('uploadPercent');
    progressEl.classList.remove('hidden');

    try {
        // Upload to Cloudinary (FREE - 25GB storage)
        const result = await uploadToCloudinary(file, (progress) => {
            barEl.style.width = progress + '%';
            percentEl.textContent = progress + '%';
        });

        // Save metadata to Firestore (FREE)
        await addDoc(collection(db, 'media'), {
            userId: state.currentUser.uid,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            folderId: state.currentView === 'folder' ? state.currentFolder : null,
            folderName: state.currentView === 'folder' ? 
                (state.folders.find(f => f.id === state.currentFolder)?.name || null) : null,
            createdAt: serverTimestamp()
        });

        // Update folder count if uploading to a folder
        if (state.currentView === 'folder' && state.currentFolder) {
            const folder = state.folders.find(f => f.id === state.currentFolder);
            if (folder) {
                await updateDoc(doc(db, 'folders', state.currentFolder), {
                    count: (folder.count || 0) + 1
                });
            }
        }

        progressEl.classList.add('hidden');
        barEl.style.width = '0%';
        state.isUploading = false;
        showToast('Photo uploaded successfully', 'success');
    } catch (error) {
        progressEl.classList.add('hidden');
        barEl.style.width = '0%';
        state.isUploading = false;
        showToast('Upload failed: ' + error.message, 'error');
    }
}


// ============================================================
// MEDIA ACTIONS (Delete, Move, Download)
// ============================================================
async function deleteMedia(mediaId, publicId) {
    if (!confirm('Delete this photo permanently?')) return;
    try {
        // Remove from Cloudinary (note: free tier keeps CDN copy)
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        // Delete from Firestore
        await deleteDoc(doc(db, 'media', mediaId));

        showToast('Photo deleted', 'success');
        loadMedia();
        loadFolders();
    } catch (error) {
        showToast('Failed to delete photo', 'error');
        console.error(error);
    }
}

function showMoveModal(mediaId) {
    const modal = document.getElementById('moveModal');
    const list = document.getElementById('moveAlbumList');

    list.innerHTML = `
        <button onclick="moveToFolder('${mediaId}', null)" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-sm font-medium">All Photos (No Album)</span>
        </button>
        ${state.folders.map(folder => `
            <button onclick="moveToFolder('${mediaId}', '${folder.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left">
                <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <span class="text-sm font-medium">${escapeHtml(folder.name)}</span>
            </button>
        `).join('')}
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeMoveModal() {
    document.getElementById('moveModal').classList.add('hidden');
    document.getElementById('moveModal').classList.remove('flex');
}

async function moveToFolder(mediaId, folderId) {
    try {
        const folderName = folderId ? (state.folders.find(f => f.id === folderId)?.name || null) : null;
        await updateDoc(doc(db, 'media', mediaId), {
            folderId: folderId,
            folderName: folderName
        });
        closeMoveModal();
        showToast(`Moved to ${folderName || 'All Photos'}`, 'success');
        loadMedia();
        loadFolders();
    } catch (error) {
        showToast('Failed to move photo', 'error');
    }
}

function downloadImage(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(index) {
    state.lightboxIndex = index;
    const item = state.filteredItems[index];
    if (!item) return;

    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');

    img.src = item.url;
    caption.textContent = item.fileName;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
}

function lightboxNav(direction) {
    const newIndex = state.lightboxIndex + direction;
    if (newIndex >= 0 && newIndex < state.filteredItems.length) {
        openLightbox(newIndex);
    }
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('hidden')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
});

// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = !sidebar.classList.contains('-translate-x-full');

    if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }
}


// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');

    const icons = {
        success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        info: '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };

    iconEl.innerHTML = icons[type] || icons.info;
    msgEl.textContent = message;
    toast.classList.add('toast-visible');

    setTimeout(() => {
        toast.classList.remove('toast-visible');
    }, 3500);
}

// ============================================================
// DRAG & DROP SUPPORT
// ============================================================
function initDragDrop() {
    const contentArea = document.querySelector('.flex-1.overflow-y-auto');
    if (!contentArea) return;

    contentArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        contentArea.classList.add('drop-active');
    });

    contentArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        contentArea.classList.remove('drop-active');
    });

    contentArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        contentArea.classList.remove('drop-active');

        if (state.currentView === 'videos') {
            showToast('Video uploads are not supported', 'error');
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        const videoFiles = files.filter(f => VIDEO_TYPES.includes(f.type) || f.type.startsWith('video/'));
        
        if (videoFiles.length > 0) {
            showToast('Video uploads are not supported', 'error');
            return;
        }

        const imageFiles = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type));
        if (imageFiles.length === 0) {
            showToast('Only image files are allowed (JPG, PNG, WebP, GIF)', 'error');
            return;
        }

        for (const file of imageFiles) {
            await uploadFile(file);
        }
        loadMedia();
        loadFolders();
    });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDragDrop();
});

// Make functions available globally
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.toggleDarkMode = toggleDarkMode;
window.switchView = switchView;
window.triggerUpload = triggerUpload;
window.handleFileSelect = handleFileSelect;
window.handleSearch = handleSearch;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.lightboxNav = lightboxNav;
window.toggleSidebar = toggleSidebar;
window.showCreateFolderModal = showCreateFolderModal;
window.closeFolderModal = closeFolderModal;
window.createFolder = createFolder;
window.deleteFolder = deleteFolder;
window.showMoveModal = showMoveModal;
window.closeMoveModal = closeMoveModal;
window.moveToFolder = moveToFolder;
window.downloadImage = downloadImage;
window.deleteMedia = deleteMedia;
