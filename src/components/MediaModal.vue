<template>
  <div 
    ref="modalContainer"
    class="fixed inset-0 z-50 bg-slate-900/95 dark:bg-black/95 text-slate-100 flex flex-col justify-between overflow-hidden select-none" 
    @click.self="$emit('close')"
  >
    <!-- Top Bar Navigation & Controls -->
    <header class="h-14 px-3 sm:px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 pr-2">
        <span class="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px] sm:max-w-xs" :title="currentItem?.filename">
          {{ currentItem?.filename }}
        </span>
        <span class="text-xs text-slate-500 shrink-0" v-if="items?.length">
          ({{ currentIndex + 1 }} / {{ items.length }})
        </span>
      </div>

      <div class="flex items-center space-x-1 sm:space-x-2 shrink-0">
        <!-- Direct Action Buttons (Edit Album & Delete) -->
        <div class="flex items-center space-x-1 border-r border-slate-800 pr-2 mr-1">
          <template v-if="authed">
            <button 
              @click="handleAssignAlbum" 
              class="p-1.5 sm:p-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1"
              title="Edit Album / Rename"
            >
              <span>🏷️</span>
              <span class="hidden md:inline text-xs">Album</span>
            </button>

            <button 
              @click="promptDelete" 
              class="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1"
              title="Delete Asset"
            >
              <span>🗑️</span>
              <span class="hidden md:inline text-xs">Delete</span>
            </button>
          </template>

          <button 
            v-else 
            @click="forceAuth = true" 
            class="px-2 py-1 bg-slate-800/80 text-slate-400 hover:text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Click to override auth state for testing"
          >
            🔒 Read Only
          </button>
        </div>

        <!-- Zoom Controls -->
        <template v-if="!isVideo(currentItem?.filename)">
          <div class="hidden sm:flex items-center space-x-1">
            <button @click="zoomOut" class="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-xs cursor-pointer" title="Zoom Out (-)">➖</button>
            <span class="text-xs text-slate-400 font-mono w-9 text-center">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-xs cursor-pointer" title="Zoom In (+)">➕</button>
            <button @click="resetZoom" class="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-xs cursor-pointer font-bold" title="Reset Zoom (0)">1:1</button>
          </div>
        </template>

        <!-- Fullscreen Toggle -->
        <button 
          @click="toggleFullscreen" 
          class="p-1.5 sm:p-2 text-slate-300 hover:bg-slate-800 rounded-lg text-xs sm:text-sm cursor-pointer"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        >
          {{ isFullscreen ? '🗗' : '⛶' }}
        </button>

        <!-- Toggle Info / Metadata -->
        <button 
          @click="showMetadata = !showMetadata" 
          class="p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer"
          :class="showMetadata ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
          title="Toggle Metadata"
        >
          ℹ️
        </button>

        <!-- Close Button -->
        <button @click="$emit('close')" class="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg text-base sm:text-lg cursor-pointer ml-1">✕</button>
      </div>
    </header>

    <!-- Main Display Stage -->
    <div class="relative flex-1 flex items-center justify-center overflow-hidden min-h-0">
      <button 
        v-if="hasPrev"
        @click="prevMedia" 
        class="hidden sm:block absolute left-3 z-20 p-3 sm:p-4 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white text-lg sm:text-xl backdrop-blur transition-all cursor-pointer"
      >
        ❮
      </button>

      <!-- Media Stage -->
      <div 
        class="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden touch-none"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <video 
          v-if="isVideo(currentItem?.filename)" 
          ref="videoRef"
          controls 
          autoplay 
          @loadedmetadata="onVideoMetadataLoad"
          class="max-w-full max-h-full rounded object-contain shadow-2xl"
        >
          <source :src="currentItem?.url || `/images/${currentItem?.filename}`" />
        </video>

        <div 
          v-else 
          class="relative w-full h-full flex items-center justify-center overflow-hidden"
          :class="zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'"
          @wheel.prevent="handleWheel"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <img 
            ref="mediaImg"
            :src="currentItem?.url || `/images/${currentItem?.filename}`" 
            @load="onImageLoad"
            class="max-w-full max-h-full object-contain transition-transform duration-75 ease-out select-none shadow-2xl"
            :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }"
            draggable="false"
          />
        </div>
      </div>

      <button 
        v-if="hasNext"
        @click="nextMedia" 
        class="hidden sm:block absolute right-3 z-20 p-3 sm:p-4 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white text-lg sm:text-xl backdrop-blur transition-all cursor-pointer"
      >
        ❯
      </button>

      <!-- Mobile Navigation -->
      <div class="sm:hidden absolute bottom-3 inset-x-0 z-20 flex items-center justify-center space-x-6 pointer-events-none">
        <button 
          v-if="hasPrev" 
          @click="prevMedia" 
          class="pointer-events-auto p-3 rounded-full bg-slate-900/80 text-white border border-slate-700/60 backdrop-blur shadow-lg active:scale-95"
        >
          ❮
        </button>
        <button 
          v-if="hasNext" 
          @click="nextMedia" 
          class="pointer-events-auto p-3 rounded-full bg-slate-900/80 text-white border border-slate-700/60 backdrop-blur shadow-lg active:scale-95"
        >
          ❯
        </button>
      </div>

      <!-- Asset Details Sidebar -->
      <aside 
        v-if="showMetadata" 
        class="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#161b26] border-l border-slate-800/80 p-6 z-30 overflow-y-auto text-slate-200 shadow-2xl space-y-6"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <h3 class="font-bold text-lg text-indigo-400">Asset Details</h3>
          <button @click="showMetadata = false" class="text-xs text-slate-400 hover:text-white cursor-pointer">✕</button>
        </div>

        <div class="space-y-5 text-sm">
          <!-- Loading State -->
          <div v-if="loadingExif" class="text-xs text-indigo-400 flex items-center gap-2">
            <span class="animate-spin">🌀</span> Reading EXIF metadata...
          </div>

          <!-- Filename -->
          <div>
            <label class="text-slate-400 text-xs font-medium block mb-1">Filename</label>
            <p class="font-mono break-all text-slate-100 text-xs leading-relaxed">{{ currentItem?.filename || 'N/A' }}</p>
          </div>

          <!-- Format & Resolution -->
          <div>
            <label class="text-slate-400 text-xs font-medium block mb-1">Format & Resolution:</label>
            <p class="text-slate-100 font-semibold text-xs">
              {{ isVideo(currentItem?.filename) ? 'Video' : 'Image' }}
              <span v-if="computedDimensions"> • {{ computedDimensions }}</span>
            </p>
          </div>

          <!-- Date Taken -->
          <div v-if="computedDateTaken">
            <label class="text-slate-400 text-xs font-medium block mb-1">Date Taken:</label>
            <p class="text-indigo-300 font-medium text-xs">{{ computedDateTaken }}</p>
          </div>

          <!-- Camera -->
          <div v-if="computedCamera">
            <label class="text-slate-400 text-xs font-medium block mb-1">Camera:</label>
            <p class="text-slate-100 font-semibold text-xs">{{ computedCamera }}</p>
          </div>

          <!-- Settings -->
          <div v-if="computedSettings">
            <label class="text-slate-400 text-xs font-medium block mb-1">Settings:</label>
            <p class="text-slate-200 font-mono text-xs">{{ computedSettings }}</p>
          </div>

          <!-- Album Tag -->
          <div class="pt-2">
            <label class="text-slate-400 text-xs font-medium block mb-2">Album Tag</label>
            <div class="w-full bg-[#11151f] border border-slate-800/90 rounded-lg p-3 text-slate-100 font-medium text-xs">
              {{ currentItem?.album || currentItem?.album_tag || 'Uncategorized' }}
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Custom Modal Confirmation for Delete -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[#161b26] border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h3 class="text-base font-bold text-white mb-2">Delete Asset</h3>
        <p class="text-xs text-slate-400 mb-6">Are you sure you want to permanently delete <span class="font-mono text-slate-200">{{ currentItem?.filename }}</span>?</p>

        <div class="flex items-center justify-end space-x-3">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="confirmDelete" 
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import exifr from 'exifr'; // Imported exifr module

const props = defineProps({
  media: Object,
  isAuthenticated: { type: [Boolean, String], default: false },
  isAutentcation: { type: [Boolean, String], default: false },
  isAuth: { type: [Boolean, String], default: false },
  items: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'delete', 'assign-album', 'load-more']);

const forceAuth = ref(false);
const authed = computed(() => {
  if (forceAuth.value) return true;
  const propCheck = [props.isAuthenticated, props.isAutentcation, props.isAuth].some(
    v => v === true || v === 'true' || v === '1'
  );
  if (propCheck) return true;
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('auth');
    const loggedIn = localStorage.getItem('isLoggedIn') || localStorage.getItem('authenticated');
    if (token || loggedIn === 'true') return true;
  } catch (e) {}
  return false;
});

const modalContainer = ref(null);
const mediaImg = ref(null);
const videoRef = ref(null);
const loadedWidth = ref(null);
const loadedHeight = ref(null);
const extractedExif = ref({});
const loadingExif = ref(false);

const currentIndex = ref(
  props.items?.length ? props.items.findIndex((i) => i.filename === props.media?.filename) : 0
);
if (currentIndex.value === -1) currentIndex.value = 0;

const currentItem = computed(() => props.items[currentIndex.value] || props.media);

const zoomLevel = ref(1);
const panOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);

const showMetadata = ref(false);
const showDeleteConfirm = ref(false);
const isFullscreen = ref(false);

const hasNext = computed(() => currentIndex.value < props.items.length - 1 || props.hasMore);
const hasPrev = computed(() => currentIndex.value > 0);

const isVideo = (filename) => filename && /\.(mp4|webm|mov|mkv|avi)$/i.test(filename);

// EXIF Reader with exifr
const parseExifData = async () => {
  extractedExif.value = {};
  if (!currentItem.value || isVideo(currentItem.value.filename)) return;

  const url = currentItem.value.url || `/images/${currentItem.value.filename}`;
  loadingExif.value = true;

  try {
    // Parse EXIF tags directly from URL
    const output = await exifr.parse(url, {
      tiff: true,
      exif: true,
      gps: true,
      reviveValues: true
    });
    extractedExif.value = output || {};
  } catch (err) {
    console.warn('Could not extract EXIF data via exifr:', err);
    extractedExif.value = {};
  } finally {
    loadingExif.value = false;
  }
};

const onImageLoad = (e) => {
  if (e.target) {
    loadedWidth.value = e.target.naturalWidth;
    loadedHeight.value = e.target.naturalHeight;
  }
};

const onVideoMetadataLoad = (e) => {
  if (e.target) {
    loadedWidth.value = e.target.videoWidth;
    loadedHeight.value = e.target.videoHeight;
  }
};

// Re-parse EXIF when the active item changes
watch(currentItem, () => {
  loadedWidth.value = null;
  loadedHeight.value = null;
  parseExifData();
}, { immediate: true });

// Flexible property resolver
const getVal = (...keys) => {
  const item = currentItem.value;
  const exif = extractedExif.value;

  for (const k of keys) {
    if (exif && exif[k] !== undefined && exif[k] !== null && exif[k] !== '') return exif[k];
    if (item && item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
  }
  return null;
};

// Computed EXIF properties
const computedDimensions = computed(() => {
  const w = getVal('ImageWidth', 'ExifImageWidth', 'width') || loadedWidth.value;
  const h = getVal('ImageHeight', 'ExifImageHeight', 'height') || loadedHeight.value;
  return w && h ? `${w} x ${h} px` : null;
});

const computedDateTaken = computed(() => {
  const rawDate = getVal('DateTimeOriginal', 'CreateDate', 'date_taken', 'created_at');
  if (!rawDate) return null;

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

const computedCamera = computed(() => {
  const make = getVal('Make', 'make') || '';
  const model = getVal('Model', 'model') || '';
  const full = `${make} ${model}`.trim();
  return full.length ? full : null;
});

const computedSettings = computed(() => {
  const aperture = getVal('FNumber', 'ApertureValue', 'aperture');
  const shutter = getVal('ExposureTime', 'ShutterSpeedValue', 'shutter_speed');
  const iso = getVal('ISO', 'ISOSpeedRatings', 'iso');
  const focal = getVal('FocalLength', 'focal_length');

  const parts = [];
  if (aperture) parts.push(`f/${aperture}`);
  if (shutter) {
    const val = typeof shutter === 'number' && shutter < 1 ? `1/${Math.round(1 / shutter)}` : shutter;
    parts.push(`${val}s`);
  }
  if (iso) parts.push(`ISO ${iso}`);
  if (focal) parts.push(`${focal}mm`);

  return parts.length ? parts.join(' • ') : null;
});

// Event Handlers
const handleTouchStart = (e) => {
  if (zoomLevel.value > 1) return;
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
  if (zoomLevel.value > 1) return;
  touchEndX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (zoomLevel.value > 1 || !touchStartX.value || !touchEndX.value) return;
  const distanceX = touchStartX.value - touchEndX.value;
  if (distanceX > 50 && hasNext.value) nextMedia();
  else if (distanceX < -50 && hasPrev.value) prevMedia();
  touchStartX.value = 0;
  touchEndX.value = 0;
};

const startDrag = (e) => {
  if (zoomLevel.value <= 1) return;
  isDragging.value = true;
  dragStart.value = { x: e.clientX - panOffset.value.x, y: e.clientY - panOffset.value.y };
};

const onDrag = (e) => {
  if (!isDragging.value || zoomLevel.value <= 1) return;
  panOffset.value = { x: e.clientX - dragStart.value.x, y: e.clientY - dragStart.value.y };
};

const endDrag = () => { isDragging.value = false; };

const zoomIn = () => { zoomLevel.value = Math.min(zoomLevel.value + 0.25, 4); };
const zoomOut = () => { 
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 1);
  if (zoomLevel.value === 1) panOffset.value = { x: 0, y: 0 };
};
const resetZoom = () => { zoomLevel.value = 1; panOffset.value = { x: 0, y: 0 }; };

const handleWheel = (e) => {
  if (e.deltaY < 0) zoomIn();
  else zoomOut();
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    modalContainer.value?.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};

const prevMedia = () => { if (hasPrev.value) { currentIndex.value--; resetZoom(); } };
const nextMedia = async () => {
  if (currentIndex.value >= props.items.length - 2 && props.hasMore && !props.loading) {
    emit('load-more');
  }
  if (hasNext.value) { currentIndex.value++; resetZoom(); }
};

const handleAssignAlbum = () => emit('assign-album', currentItem.value.filename);

const promptDelete = () => showDeleteConfirm.value = true;
const confirmDelete = () => {
  showDeleteConfirm.value = false;
  emit('delete', currentItem.value.filename);
  emit('close');
};

const handleKeyDown = (e) => {
  if (showDeleteConfirm.value) return;
  if (e.key === 'ArrowRight') nextMedia();
  if (e.key === 'ArrowLeft') prevMedia();
  if (e.key === 'Escape') emit('close');
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleKeyDown);
});
</script>