<template>
  <div class="space-y-8">
    <!-- Responsive Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <div 
        v-for="(item, index) in items" 
        :key="item.filename" 
        class="group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex flex-col hover:border-slate-700 transition-all shadow-md"
      >
        <div 
          class="relative w-full aspect-square bg-slate-950 cursor-pointer overflow-hidden" 
          @click="$emit('select', item, index)"
        >
          <img 
            :src="`/thumb/${getThumbName(item.filename)}`" 
            loading="lazy" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <span v-if="isVideo(item.filename)" class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
            ▶ Video
          </span>

          <!-- Album Badge -->
          <span 
            v-if="item.album" 
            class="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/90 hover:bg-blue-500 text-white truncate max-w-[80%] cursor-pointer transition-colors"
            :title="`View '${item.album}' album`"
            @click.stop="navigateToAlbum(item.album)"
          >
            📁 {{ item.album }}
          </span>
        </div>

        <div class="p-2 sm:p-2.5 flex items-center justify-between text-xs text-slate-300 bg-slate-900 border-t border-slate-800/60">
          <span class="truncate font-medium text-slate-300" :title="item.filename">
            {{ item.filename }}
          </span>
          
          <!-- Actions Container (Only visible when authenticated) -->
          <div class="flex items-center space-x-1 shrink-0 ml-1" v-if="isAuthenticated">
            <button 
              @click.stop="handleAssignAlbum(item.filename)" 
              class="p-1.5 sm:p-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1"
              title="Edit Album / Rename"
            >
              <span>🏷️</span>
              <span class="hidden md:inline text-xs">Album</span>
            </button>
            <button 
              class="p-1 rounded hover:bg-slate-800 text-red-400 hover:text-red-300 transition-colors cursor-pointer" 
              title="Delete" 
              @click.stop="openDeleteModal(item.filename)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Infinite Scroll Sentinel & Fallback Load More Button -->
    <div class="text-center pt-4 pb-8 flex flex-col items-center justify-center min-h-[60px]">
      <div ref="sentinel" class="w-full h-4"></div>
      
      <button 
        v-if="hasMore"
        class="px-6 py-2.5 rounded-lg font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer text-xs sm:text-sm" 
        :disabled="loading" 
        @click="$emit('load-more')"
      >
        {{ loading ? 'Loading Assets...' : 'Load More' }}
      </button>
    </div>

    <!-- Custom Delete Confirmation Modal -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="fileToDelete" 
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        @click.self="fileToDelete = null"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-slate-200 space-y-4">
          <div class="flex items-center gap-3 text-red-400">
            <span class="text-2xl">⚠️</span>
            <h3 class="text-lg font-bold text-white">Confirm Delete</h3>
          </div>
          
          <p class="text-sm text-slate-300">
            Are you sure you want to delete <span class="font-mono text-white font-semibold break-all">{{ fileToDelete }}</span>?
          </p>
          <p class="text-xs text-slate-500">This action cannot be undone.</p>

          <div class="flex justify-end space-x-2 pt-2">
            <button 
              class="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
              @click="fileToDelete = null"
            >
              Cancel
            </button>
            <button 
              class="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white font-medium transition-colors cursor-pointer"
              @click="confirmDelete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  items: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  isAuthenticated: { type: Boolean, default: false }
});

const emit = defineEmits(['filter-by-album', 'load-more', 'assign-album', 'select', 'rename-album', 'delete']);

const navigateToAlbum = (albumName) => {
  if (albumName) {
    emit('filter-by-album', albumName);
  }
};

const router = useRouter();
const sentinel = ref(null);
const fileToDelete = ref(null);
let observer = null;

const isVideo = (filename) => /\.(mp4|webm|mov|mkv|avi)$/i.test(filename);

const getThumbName = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return `${filename}.jpg`;
  return `${filename.substring(0, lastDot)}.jpg`;
};

// Mirroring the MediaModal assign album emitter logic
const handleAssignAlbum = (filename) => {
  emit('assign-album', filename);
};

const openDeleteModal = (filename) => {
  fileToDelete.value = filename;
};

const confirmDelete = () => {
  if (fileToDelete.value) {
    emit('delete', fileToDelete.value);
    fileToDelete.value = null;
  }
};

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loading) {
        emit('load-more');
      }
    },
    { rootMargin: '300px' }
  );

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>