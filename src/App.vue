<template>
   <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 flex flex-col">   <!-- Header Navbar -->
    <HeaderNav
      :token="token"
      :current-url-album="currentUrlAlbum"
      :is-scanning="isScanning"
      :is-dark="isDark"
      @clear-album="clearAlbumFilter"
      @open-upload="showUploadModal = true"
      @trigger-scan="triggerScan"
      @toggle-theme="toggleTheme"
      @open-auth="showAuthModal = true"
      @logout="logout"
    />

    <!-- Main Layout Container (Sidebar + Content) -->

      <div class="flex flex-1 items-start relative w-full">
      <!-- Folder Sidebar -->
      <FolderSidebar
        :albums="albums"
        :active-album="currentUrlAlbum"
        @select-album="navigateToAlbum"
      />

      <!-- Content Area -->
    
      <main class="flex-1 min-w-0 p-3 sm:p-5 space-y-4">
        <!-- Filters -->
        <FilterBar :albums="albums" :filters="filters" @update:filters="handleFilterChange" />

        <!-- Media Grid -->
        <MediaGrid
          :items="images"
          :has-more="hasMore"
          :loading="loading"
          :is-authenticated="!!token"
          @load-more="fetchImages(false)"
          @rename-album="handleRenameAlbum"
          @select="openMediaModal"
          @assign-album="openAlbumModal"
          @delete="deleteMedia"
          @filter-by-album="(album) => handleFilterChange({ album })"
        />
      </main>
    </div>

    <!-- Modals -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @authenticated="handleAuthenticated" />
    
    <UploadModal
      v-if="showUploadModal"
      :albums="albums"
      :token="token"
      @close="showUploadModal = false"
      @start-upload="handleStartUpload"
    />

    <MediaModal
      v-if="selectedMedia"
      :media="selectedMedia"
      :items="images"
      :is-authenticated="!!token"
      :has-more="hasMore"
      :loading="loading"
      @close="selectedMedia = null"
      @delete="deleteMedia"
      @assign-album="openAlbumModal"
      @load-more="fetchImages(false)"
    />

    <AlbumModal
      v-if="selectedForAlbum"
      :filename="selectedForAlbum"
      :albums="albums"
      :token="token"
      :current-album="images.find(img => img.filename === selectedForAlbum)?.album || ''"
      @close="selectedForAlbum = null"
      @updated="refreshData"
    />

    <!-- Floating Stack Container (Bottom Right) -->
    <div class="fixed bottom-6 right-6 z-40 flex flex-col gap-3 max-w-xs w-full pointer-events-none">
      
      <!-- 1. Floating Upload Progress Widget -->
      <transition 
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-y-8 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-8 opacity-0"
      >
        <div 
          v-if="uploadState.isUploading || uploadState.statusMessage" 
          class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur pointer-events-auto space-y-2 text-slate-200"
        >
          <div class="flex items-center justify-between text-xs font-medium">
            <span class="text-slate-200 flex items-center gap-2">
              <span :class="uploadState.isProcessing ? 'animate-spin' : 'animate-bounce'">
                {{ uploadState.isProcessing ? '⚙️' : '⬆️' }}
              </span>
              {{ uploadState.isProcessing ? `Processing ${uploadState.fileCount} items...` : `Uploading ${uploadState.fileCount} assets...` }}
            </span>
            <span class="text-blue-400 font-mono font-bold">{{ uploadState.progress }}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div 
              class="h-full bg-blue-500 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              :class="{ 'animate-pulse': uploadState.isProcessing }"
              :style="{ width: `${uploadState.progress}%` }"
            ></div>
          </div>

          <div class="flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>
              {{ uploadState.isProcessing ? 'Extracting metadata...' : `${formatBytes(uploadState.bytesUploaded)} / ${formatBytes(uploadState.totalBytes)}` }}
            </span>
            <button v-if="!uploadState.isUploading" @click="uploadState.statusMessage = ''" class="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      </transition>

      <!-- 2. Floating Disk Scan Progress Widget -->
      <transition 
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-y-8 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-8 opacity-0"
      >
        <div 
          v-if="isScanning || scanStatusMessage" 
          class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur pointer-events-auto space-y-2 text-slate-200"
        >
          <div class="flex items-center justify-between text-xs font-medium">
            <span class="text-slate-200 flex items-center gap-2">
              <span :class="isScanning ? 'animate-spin' : ''">⚙️</span>
              {{ isScanning ? 'Indexing Disk Directory...' : 'Disk Scan Completed' }}
            </span>
            <button v-if="!isScanning" @click="scanStatusMessage = ''" class="text-slate-500 hover:text-white text-xs">✕</button>
          </div>

          <div v-if="isScanning" class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div class="h-full bg-blue-500 rounded-full animate-pulse w-full"></div>
          </div>

          <p class="text-[11px] text-slate-400 font-mono">
            {{ scanStatusMessage || 'Searching for untracked thumbnails...' }}
          </p>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import FilterBar from './components/FilterBar.vue';
import MediaGrid from './components/MediaGrid.vue';
import AuthModal from './components/AuthModal.vue';
import UploadModal from './components/UploadModal.vue';
import MediaModal from './components/MediaModal.vue';
import AlbumModal from './components/AlbumModal.vue';
import FolderSidebar from './components/FolderSidebar.vue';
import { useTheme } from './composables/useTheme';
import HeaderNav from './components/HeaderNav.vue';

const { isDark, toggleTheme, initTheme } = useTheme();

const token = ref(localStorage.getItem('auth_token') || '');
const images = ref([]);
const albums = ref([]);
const hasMore = ref(false);
const loading = ref(false);
const offset = ref(0);
const limit = 24;

const isScanning = ref(false);
const scanStatusMessage = ref('');

// Global Upload Reactive State
const uploadState = reactive({
  isUploading: false,
  isProcessing: false,
  progress: 0,
  bytesUploaded: 0,
  totalBytes: 0,
  fileCount: 0,
  statusMessage: '',
});

const showAuthModal = ref(false);
const showUploadModal = ref(false);
const selectedMedia = ref(null);
const selectedForAlbum = ref(null);

// Synchronous native browser path reader
const getAlbumFromUrl = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path ? decodeURIComponent(path).toLowerCase() : '';
};

const currentUrlAlbum = ref(getAlbumFromUrl());

const filters = reactive({
  search: '',
  media_type: 'all',
  album: currentUrlAlbum.value || 'all',
  sort: 'recent',
});

let ws = null;

const authFetch = async (url, options = {}) => {
  const headers = { ...options.headers };
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }
  return fetch(url, { ...options, headers });
};

const fetchAlbums = async () => {
  try {
    const res = await fetch('/api/albums');
    if (res.ok) {
      const data = await res.json();
      albums.value = data.albums || [];
    }
  } catch (err) {
    console.error('Failed to load albums:', err);
  }
};

const fetchImages = async (reset = true) => {
  if (loading.value) return;
  loading.value = true;

  if (reset) {
    offset.value = 0;
    images.value = [];
  }

  const activeAlbum = currentUrlAlbum.value || (filters.album !== 'all' ? filters.album : '');

  const query = new URLSearchParams({
    offset: offset.value,
    limit,
    ...(filters.search && { search: filters.search }),
    ...(filters.media_type !== 'all' && { media_type: filters.media_type }),
    ...(activeAlbum && activeAlbum !== 'all' && { album: activeAlbum }),
    ...(filters.sort && { sort: filters.sort }),
  });

  try {
    const res = await fetch(`/api/images/filter?${query}`);
    if (res.ok) {
      const data = await res.json();
      if (reset) {
        images.value = data.images || [];
      } else {
        images.value.push(...(data.images || []));
      }
      hasMore.value = data.has_more;
      offset.value += (data.images || []).length;
    }
  } catch (err) {
    console.error('Failed to load media:', err);
  } finally {
    loading.value = false;
  }
};

const navigateToAlbum = (albumName) => {
  const target = albumName && albumName !== 'all' ? albumName.toLowerCase() : '';
  const newPath = target ? `/${encodeURIComponent(target)}` : '/';

  window.history.pushState({}, '', newPath);
  currentUrlAlbum.value = target;
  filters.album = target || 'all';
  fetchImages(true);
};

const clearAlbumFilter = () => {
  navigateToAlbum('all');
};

const handleFilterChange = (newFilters) => {
  Object.assign(filters, newFilters);
  navigateToAlbum(filters.album);
};

const handlePopState = () => {
  currentUrlAlbum.value = getAlbumFromUrl();
  filters.album = currentUrlAlbum.value || 'all';
  fetchImages(true);
};

const refreshData = () => {
  fetchAlbums();
  fetchImages(true);
};

const handleAuthenticated = (newToken) => {
  token.value = newToken;
  localStorage.setItem('auth_token', newToken);
  showAuthModal.value = false;
};

const logout = () => {
  token.value = '';
  localStorage.removeItem('auth_token');
};

const handleRenameAlbum = async ({ oldName, newName, filename }) => {
  if (oldName) {
    await renameAlbum(oldName, newName);
  } else {
    await assignAlbumToImage(filename, newName);
  }
};

const assignAlbumToImage = async (filename, albumName) => {
  try {
    const res = await authFetch('/api/images/assign_album', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, album: albumName }),
    });
    if (res.ok) {
      refreshData();
    } else {
      alert('Failed to assign album.');
    }
  } catch (err) {
    console.error('Error assigning album:', err);
  }
};

const handleStartUpload = ({ files, album }) => {
  uploadState.isUploading = true;
  uploadState.isProcessing = false;
  uploadState.progress = 0;
  uploadState.bytesUploaded = 0;
  uploadState.totalBytes = 0;
  uploadState.fileCount = files.length;
  uploadState.statusMessage = '';

  const formData = new FormData();

  if (album && album.trim() !== '') {
    formData.append('album', album.trim());
  }

  files.forEach((f) => formData.append('images', f));

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      uploadState.bytesUploaded = e.loaded;
      uploadState.totalBytes = e.total;
      const percent = Math.round((e.loaded / e.total) * 100);

      if (percent >= 100) {
        uploadState.progress = 99;
        uploadState.isProcessing = true;
      } else {
        uploadState.progress = percent;
      }
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      uploadState.progress = 100;
      uploadState.isProcessing = false;
      uploadState.statusMessage = 'Upload completed successfully!';
      
      refreshData();
      
      setTimeout(() => {
        uploadState.isUploading = false;
        uploadState.statusMessage = '';
      }, 3500);
    } else {
      alert('Upload failed: ' + xhr.statusText);
      uploadState.isUploading = false;
      uploadState.isProcessing = false;
    }
  });

  xhr.addEventListener('error', () => {
    alert('Upload failed due to a network error.');
    uploadState.isUploading = false;
    uploadState.isProcessing = false;
  });

  xhr.open('POST', '/api/upload');
  if (token.value) {
    xhr.setRequestHeader('Authorization', `Bearer ${token.value}`);
  }
  xhr.send(formData);
};

const triggerScan = async () => {
  isScanning.value = true;
  scanStatusMessage.value = 'Scanning server directory...';

  try {
    const res = await authFetch('/api/scan', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      scanStatusMessage.value = data.message || 'Scan completed successfully.';
      refreshData();
    } else {
      scanStatusMessage.value = 'Scan request failed.';
    }
  } catch (err) {
    scanStatusMessage.value = 'Scan error: ' + err.message;
  } finally {
    isScanning.value = false;
    setTimeout(() => {
      scanStatusMessage.value = '';
    }, 4000);
  }
};

const renameAlbum = async (oldName, newName) => {
  if (!newName || newName.trim() === '' || oldName === newName) return;

  const targetNewName = newName.trim();

  try {
    const res = await fetch('/api/albums/rename', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({
        old_name: oldName,
        new_name: targetNewName
      })
    });

    if (res.ok) {
      if (currentUrlAlbum.value.toLowerCase() === oldName.toLowerCase()) {
        navigateToAlbum(targetNewName);
      } else {
        refreshData();
      }
    } else {
      const errText = await res.text();
      alert(`Failed to rename album: ${errText}`);
    }
  } catch (err) {
    console.error('Error renaming album:', err);
    alert('Failed to rename album due to network error.');
  }
};

const deleteMedia = async (filename) => {
  try {
    const res = await authFetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });

    if (res.ok) {
      images.value = images.value.filter((i) => i.filename !== filename);
      if (selectedMedia.value?.filename === filename) {
        selectedMedia.value = null;
      }
    } else {
      alert('Delete failed');
    }
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
};

const openMediaModal = (item) => {
  selectedMedia.value = item;
};

const openAlbumModal = (filename) => {
  selectedForAlbum.value = filename;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const setupWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/ws`;
  ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.action === 'rename_album') {
        const oldAlbum = data.filename;
        const newAlbum = data.album;

        // 1. Update album dropdown list in memory
        const idx = albums.value.indexOf(oldAlbum);
        if (idx !== -1) {
          albums.value[idx] = newAlbum;
        }

        // 2. Patch file paths of active images in memory
        const oldPrefix = `${oldAlbum}/`;
        const newPrefix = `${newAlbum}/`;

        images.value.forEach((img) => {
          if (img.album === oldAlbum) {
            img.album = newAlbum;
          }
          if (img.filename.startsWith(oldPrefix)) {
            img.filename = img.filename.replace(oldPrefix, newPrefix);
          }
        });

        // 3. Update route/URL state if currently viewing the renamed album
        if (currentUrlAlbum.value.toLowerCase() === oldAlbum.toLowerCase()) {
          navigateToAlbum(newAlbum);
        }
      } else if (data.action === 'upload' || data.action === 'delete') {
        refreshData();
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  };

  ws.onclose = () => {
    setTimeout(setupWebSocket, 3000);
  };
};

onMounted(() => {
  fetchAlbums();
  setupWebSocket();
  initTheme();
  
  window.addEventListener('popstate', handlePopState);
  fetchImages(true);
});

onUnmounted(() => {
  if (ws) ws.close();
  window.removeEventListener('popstate', handlePopState);
});
</script>