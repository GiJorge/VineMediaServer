<template>
  <div class="shrink-0">
    <!-- Desktop Floating Toggle Button (Appears when sidebar is collapsed) -->
    <button 
      v-if="!isOpen"
      @click="isOpen = true"
      class="hidden md:flex fixed top-20 left-4 z-40 items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 backdrop-blur-md shadow-2xl transition-all active:scale-95 cursor-pointer"
      title="Show Sidebar"
    >
      <span class="text-amber-400">📁</span>
      <span>Show Folders</span>
      <span class="text-[10px] text-slate-400">▶</span>
    </button>

    <!-- Mobile Floating Toggle Button -->
    <button 
      @click="isOpen = !isOpen" 
      class="md:hidden fixed bottom-5 left-5 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
      title="Toggle Folders"
    >
      <span class="text-base">{{ isOpen ? '✕' : '📁' }}</span>
    </button>

    <!-- Mobile Backdrop Overlay -->
    <div 
      v-if="isOpen" 
      @click="isOpen = false" 
      class="md:hidden fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
    ></div>

    <!-- Sidebar Panel -->
    <!-- On desktop, this uses relative positioning so it scrolls naturally with the grid page! -->
    <aside 
      v-show="isOpen || isMobile"
      class="fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-64 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col select-none text-slate-800 dark:text-slate-200 shrink-0 min-h-full transition-all duration-200 ease-in-out"
      :class="[
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        !isOpen && 'md:hidden'
      ]"
    >
      <!-- Header with Hide Button -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>📁</span> Folders & Albums
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
            {{ albums.length }}
          </span>
          <button 
            @click="isOpen = false" 
            class="hidden md:block text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
            title="Hide Sidebar"
          >
            ◀
          </button>
        </div>
      </div>

      <!-- Search Filter -->
      <div class="p-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Filter folders..."
          class="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <!-- Folder Navigation List -->
      <nav class="p-2 space-y-1">
        <!-- All Media Option -->
        <button 
          @click="selectFolder('all')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative group"
          :class="isAllActive ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-600 dark:border-blue-500' : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span>🖼️</span>
            <span class="truncate">All Media</span>
          </div>
        </button>

        <div class="my-2 border-t border-slate-200 dark:border-slate-800/60"></div>

        <!-- Dynamic Folder List -->
        <button 
          v-for="album in filteredAlbums" 
          :key="album"
          @click="selectFolder(album)"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative group"
          :class="isAlbumActive(album) ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-600 dark:border-blue-500' : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span :class="isAlbumActive(album) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-500 dark:group-hover:text-amber-400'">📁</span>
            <span class="truncate">{{ album }}</span>
          </div>
        </button>

        <!-- Empty State -->
        <div v-if="filteredAlbums.length === 0" class="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
          No matching folders
        </div>
      </nav>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  albums: { type: Array, default: () => [] },
  activeAlbum: { type: String, default: '' }
});

const emit = defineEmits(['select-album']);

const searchQuery = ref('');
const isOpen = ref(true);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isOpen.value = false;
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const filteredAlbums = computed(() => {
  if (!searchQuery.value.trim()) return props.albums;
  const q = searchQuery.value.toLowerCase();
  return props.albums.filter(a => a.toLowerCase().includes(q));
});

const isAllActive = computed(() => {
  return !props.activeAlbum || props.activeAlbum === 'all';
});

const isAlbumActive = (albumName) => {
  if (!props.activeAlbum || props.activeAlbum === 'all') return false;
  return props.activeAlbum.toLowerCase() === albumName.toLowerCase();
};

const selectFolder = (albumName) => {
  emit('select-album', albumName);
  if (isMobile.value) {
    isOpen.value = false;
  }
};
</script>