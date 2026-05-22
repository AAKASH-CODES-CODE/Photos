// ============================================================
// PhotoVault - Main Application (All-in-one module)
// Firebase Auth + Firestore + Cloudinary Upload
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// FIREBASE + CLOUDINARY CONFIG
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyAb0EDY5NDUr4tocYh_dV6mMiw0Z9F37TA",
    authDomain: "photos-6e67c.firebaseapp.com",
    projectId: "photos-6e67c",
    storageBucket: "photos-6e67c.firebasestorage.app",
    messagingSenderId: "683403133965",
    appId: "1:683403133965:web:196b07e5e18e8429bb0144"
};

const CLOUD_NAME = "dpz8dkdvk";
const UPLOAD_PRESET = "Photos";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// STATE
// ============================================================
const state = {
    currentUser: null,
    currentView: 'photos',
    currentFolder: null,
    mediaItems: [],
    folders: [],
    filteredItems: [],
    lightboxIndex: 0,
    isDarkMode: true,
    isUploading: false
};

// ============================================================
// CLOUDINARY UPLOAD
// ============================================================
function uploadToCloudinary(file, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'photovault');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', CLOUDINARY_URL, true);

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const res = JSON.parse(xhr.responseText);
                resolve({ url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height });
            } else {
                let msg = 'Upload failed';
                try { msg = JSON.parse(xhr.responseText).error?.message || msg; } catch(e) {}
                reject(new Error(msg));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.send(formData);
    });
}


// ============================================================
// AUTHENTICATION
// ============================================================
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    if (tab === 'login') {
        loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
        loginTab.className = loginTab.className.replace('text-gray-500','') + ' text-brand-600 bg-white dark:bg-gray-700 shadow';
        registerTab.className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-gray-500 dark:text-gray-400';
    } else {
        registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
        registerTab.className = registerTab.className.replace('text-gray-500','') + ' text-brand-600 bg-white dark:bg-gray-700 shadow';
        loginTab.className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-gray-500 dark:text-gray-400';
    }
    document.getElementById('authError').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth,
            document.getElementById('loginEmail').value,
            document.getElementById('loginPassword').value);
    } catch (error) { showAuthError(getAuthErrorMsg(error.code)); }
}

async function handleRegister(e) {
    e.preventDefault();
    try {
        await createUserWithEmailAndPassword(auth,
            document.getElementById('registerEmail').value,
            document.getElementById('registerPassword').value);
    } catch (error) { showAuthError(getAuthErrorMsg(error.code)); }
}

async function handleLogout() {
    try { await signOut(auth); } catch(e) { showToast('Error signing out','error'); }
}

function getAuthErrorMsg(code) {
    const m = {
        'auth/email-already-in-use': 'Email already registered',
        'auth/invalid-email': 'Invalid email',
        'auth/weak-password': 'Password must be 6+ characters',
        'auth/user-not-found': 'No account with this email',
        'auth/wrong-password': 'Wrong password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts, try later'
    };
    return m[code] || 'An error occurred. Try again.';
}

function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg; el.classList.remove('hidden');
}

// ============================================================
// AUTH STATE
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
        state.mediaItems = []; state.folders = [];
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
// FOLDERS
// ============================================================
async function loadFolders() {
    if (!state.currentUser) return;
    try {
        const q = query(collection(db,'folders'), where('userId','==',state.currentUser.uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        state.folders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderFolderList();
    } catch(e) { console.error('loadFolders:', e); }
}

function renderFolderList() {
    document.getElementById('folderList').innerHTML = state.folders.map(f => `
        <button onclick="switchView('folder','${f.id}')" class="nav-item ${state.currentView==='folder'&&state.currentFolder===f.id?'active':''} w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="flex-1 text-left truncate">${escapeHtml(f.name)}</span>
            <span class="text-xs opacity-50">${f.count||0}</span>
            <button onclick="event.stopPropagation();deleteFolder('${f.id}')" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30">
                <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </button>`).join('');
}

function showCreateFolderModal() {
    document.getElementById('folderModal').classList.replace('hidden','flex') || document.getElementById('folderModal').classList.add('flex');
    document.getElementById('folderModal').classList.remove('hidden');
    document.getElementById('folderNameInput').value = '';
    setTimeout(()=>document.getElementById('folderNameInput').focus(),100);
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    document.getElementById('folderModal').classList.remove('flex');
}

async function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) { showToast('Please enter album name','error'); return; }
    try {
        await addDoc(collection(db,'folders'), { name, userId: state.currentUser.uid, count:0, createdAt: serverTimestamp() });
        closeFolderModal();
        showToast('Album created!','success');
        await loadFolders();
    } catch(e) { showToast('Failed to create album','error'); }
}

async function deleteFolder(folderId) {
    if (!confirm('Delete album? Photos will go back to All Photos.')) return;
    try {
        const q = query(collection(db,'media'), where('userId','==',state.currentUser.uid), where('folderId','==',folderId));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => updateDoc(doc(db,'media',d.id), { folderId:null })));
        await deleteDoc(doc(db,'folders',folderId));
        showToast('Album deleted','success');
        if (state.currentFolder === folderId) switchView('photos');
        await loadFolders(); await loadMedia();
    } catch(e) { showToast('Failed to delete album','error'); }
}

// ============================================================
// VIEW SWITCHING
// ============================================================
function switchView(view, folderId = null) {
    state.currentView = view === 'folder' ? 'folder' : view;
    state.currentFolder = folderId;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'photos') {
        document.getElementById('navPhotos').classList.add('active');
        document.getElementById('viewTitle').textContent = 'All Photos';
    } else if (view === 'videos') {
        document.getElementById('navVideos').classList.add('active');
        document.getElementById('viewTitle').textContent = 'Videos';
    } else {
        const folder = state.folders.find(f => f.id === folderId);
        document.getElementById('viewTitle').textContent = folder ? folder.name : 'Album';
    }
    renderFolderList();
    renderMedia();
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}


// ============================================================
// MEDIA LOADING & RENDERING
// ============================================================
async function loadMedia() {
    if (!state.currentUser) return;
    try {
        const q = query(collection(db,'media'), where('userId','==',state.currentUser.uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        state.mediaItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMedia();
    } catch(e) { console.error('loadMedia:', e); }
}

function renderMedia() {
    const grid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');
    const videosEmpty = document.getElementById('videosEmptyState');
    const countEl = document.getElementById('mediaCount');

    if (state.currentView === 'videos') {
        grid.classList.add('hidden');
        emptyState.classList.add('hidden'); emptyState.classList.remove('flex');
        videosEmpty.classList.remove('hidden'); videosEmpty.classList.add('flex');
        countEl.textContent = ''; return;
    }
    videosEmpty.classList.add('hidden'); videosEmpty.classList.remove('flex');

    let items = state.mediaItems;
    if (state.currentView === 'folder' && state.currentFolder)
        items = items.filter(i => i.folderId === state.currentFolder);

    const search = document.getElementById('searchInput').value.toLowerCase();
    if (search) items = items.filter(i => i.fileName.toLowerCase().includes(search));

    state.filteredItems = items;
    countEl.textContent = items.length > 0 ? `${items.length} items` : '';

    if (items.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden'); emptyState.classList.add('flex'); return;
    }
    emptyState.classList.add('hidden'); emptyState.classList.remove('flex');
    grid.classList.remove('hidden');

    grid.innerHTML = items.map((item, index) => `
        <div class="media-card" onclick="openLightbox(${index})">
            <img src="${item.url}" alt="${escapeHtml(item.fileName)}" class="img-loading"
                onload="this.classList.remove('img-loading');this.classList.add('img-loaded');" loading="lazy">
            <div class="card-overlay">
                <div class="card-actions">
                    <button onclick="event.stopPropagation();showMoveModal('${item.id}')" title="Move">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    </button>
                    <button onclick="event.stopPropagation();downloadImage('${item.url}','${escapeHtml(item.fileName)}')" title="Download">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </button>
                    <button onclick="event.stopPropagation();deleteMedia('${item.id}','${item.publicId||''}')" title="Delete">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
                <p class="text-white text-xs truncate opacity-80">${escapeHtml(item.fileName)}</p>
            </div>
        </div>`).join('');
}

function handleSearch(value) { renderMedia(); }


// ============================================================
// FILE UPLOAD
// ============================================================
const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/svg+xml'];

function triggerUpload() {
    if (state.currentView === 'videos') { showToast('Video uploads are not supported','error'); return; }
    document.getElementById('fileInput').click();
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const videos = files.filter(f => f.type.startsWith('video/'));
    if (videos.length > 0) { showToast('Video uploads are not supported','error'); event.target.value=''; return; }

    const invalid = files.filter(f => !ALLOWED.includes(f.type));
    if (invalid.length > 0) { showToast('Only images allowed (JPG, PNG, WebP, GIF)','error'); event.target.value=''; return; }

    for (const file of files) { await uploadFile(file); }
    event.target.value = '';
    await loadMedia();
    await loadFolders();
}

async function uploadFile(file) {
    if (!ALLOWED.includes(file.type)) { showToast('Video uploads are not supported','error'); return; }

    state.isUploading = true;
    const progressEl = document.getElementById('uploadProgress');
    const barEl = document.getElementById('uploadBar');
    const percentEl = document.getElementById('uploadPercent');
    progressEl.classList.remove('hidden');

    try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, (pct) => {
            barEl.style.width = pct + '%';
            percentEl.textContent = pct + '%';
        });

        // Save to Firestore
        await addDoc(collection(db,'media'), {
            userId: state.currentUser.uid,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            folderId: state.currentView==='folder' ? state.currentFolder : null,
            folderName: state.currentView==='folder' ? (state.folders.find(f=>f.id===state.currentFolder)?.name||null) : null,
            createdAt: serverTimestamp()
        });

        if (state.currentView==='folder' && state.currentFolder) {
            const folder = state.folders.find(f=>f.id===state.currentFolder);
            if (folder) await updateDoc(doc(db,'folders',state.currentFolder), { count:(folder.count||0)+1 });
        }

        progressEl.classList.add('hidden');
        barEl.style.width = '0%';
        state.isUploading = false;
        showToast('Photo uploaded!','success');
    } catch(error) {
        progressEl.classList.add('hidden');
        barEl.style.width = '0%';
        state.isUploading = false;
        showToast('Upload failed: ' + error.message, 'error');
        console.error('Upload error:', error);
    }
}


// ============================================================
// DELETE / MOVE / DOWNLOAD
// ============================================================
async function deleteMedia(mediaId, publicId) {
    if (!confirm('Delete this photo permanently?')) return;
    try {
        await deleteDoc(doc(db,'media',mediaId));
        showToast('Photo deleted','success');
        await loadMedia(); await loadFolders();
    } catch(e) { showToast('Failed to delete','error'); console.error(e); }
}

function showMoveModal(mediaId) {
    const list = document.getElementById('moveAlbumList');
    list.innerHTML = `
        <button onclick="moveToFolder('${mediaId}',null)" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-sm font-medium">All Photos (No Album)</span>
        </button>
        ${state.folders.map(f=>`
        <button onclick="moveToFolder('${mediaId}','${f.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left">
            <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="text-sm font-medium">${escapeHtml(f.name)}</span>
        </button>`).join('')}`;
    document.getElementById('moveModal').classList.remove('hidden');
    document.getElementById('moveModal').classList.add('flex');
}

function closeMoveModal() {
    document.getElementById('moveModal').classList.add('hidden');
    document.getElementById('moveModal').classList.remove('flex');
}

async function moveToFolder(mediaId, folderId) {
    try {
        const folderName = folderId ? (state.folders.find(f=>f.id===folderId)?.name||null) : null;
        await updateDoc(doc(db,'media',mediaId), { folderId, folderName });
        closeMoveModal();
        showToast(`Moved to ${folderName||'All Photos'}`, 'success');
        await loadMedia(); await loadFolders();
    } catch(e) { showToast('Failed to move','error'); }
}

function downloadImage(url, fileName) {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(index) {
    state.lightboxIndex = index;
    const item = state.filteredItems[index];
    if (!item) return;
    document.getElementById('lightboxImg').src = item.url;
    document.getElementById('lightboxCaption').textContent = item.fileName;
    document.getElementById('lightbox').classList.remove('hidden');
    document.getElementById('lightbox').classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
    document.getElementById('lightbox').classList.remove('flex');
    document.body.style.overflow = '';
}

function lightboxNav(dir) {
    const next = state.lightboxIndex + dir;
    if (next >= 0 && next < state.filteredItems.length) openLightbox(next);
}

document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').classList.contains('hidden')) return;
    if (e.key==='Escape') closeLightbox();
    if (e.key==='ArrowLeft') lightboxNav(-1);
    if (e.key==='ArrowRight') lightboxNav(1);
});

// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebarOverlay');
    if (sb.classList.contains('-translate-x-full')) {
        sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden');
    } else {
        sb.classList.add('-translate-x-full'); ov.classList.add('hidden');
    }
}


// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icons = {
        success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error:   '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        info:    '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    document.getElementById('toastIcon').innerHTML = icons[type] || icons.info;
    document.getElementById('toastMsg').textContent = message;
    toast.classList.add('toast-visible');
    setTimeout(() => toast.classList.remove('toast-visible'), 3500);
}

// ============================================================
// DRAG & DROP
// ============================================================
function initDragDrop() {
    const area = document.querySelector('.flex-1.overflow-y-auto');
    if (!area) return;
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drop-active'); });
    area.addEventListener('dragleave', e => { e.preventDefault(); area.classList.remove('drop-active'); });
    area.addEventListener('drop', async e => {
        e.preventDefault(); area.classList.remove('drop-active');
        if (state.currentView === 'videos') { showToast('Video uploads are not supported','error'); return; }
        const files = Array.from(e.dataTransfer.files).filter(f => ALLOWED.includes(f.type));
        if (!files.length) { showToast('Only images allowed','error'); return; }
        for (const f of files) await uploadFile(f);
        await loadMedia(); await loadFolders();
    });
}

// ============================================================
// UTILS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str; return d.innerHTML;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDragDrop();
});

// Global bindings
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
