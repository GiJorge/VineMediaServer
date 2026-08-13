<template>
  <div class="flex flex-col lg:flex-row items-center gap-3 mb-6 bg-slate-100 dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
    <!-- Search Input -->
    <div class="relative w-full lg:flex-1 min-w-[200px]">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        v-model="localFilters.search"
        placeholder="Search files..."
        @input="debouncedEmit"
        class="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg pl-10 pr-3.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
      />
    </div>

    <!-- Controls Container -->
    <div class="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end w-full lg:w-auto gap-3">
      <!-- Media Type Pill Toggle Group -->
      <div class="inline-flex p-1 rounded-lg bg-slate-200/80 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm font-medium transition-colors shrink-0">
        <!-- All Media Button -->
        <button
          type="button"
          @click="setMediaType('all')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
            localFilters.media_type === 'all'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>All</span>
        </button>

        <!-- Images Button -->
        <button
          type="button"
          @click="setMediaType('image')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
            localFilters.media_type === 'image'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Images</span>
        </button>

        <!-- Videos Button -->
        <button
          type="button"
          @click="setMediaType('video')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
            localFilters.media_type === 'video'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Videos</span>
        </button>
      </div>

      <!-- Dropdowns Group -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Album Select -->
        <div class="relative">
          <select 
            v-model="localFilters.album" 
            @change="emitChange" 
            class="w-full appearance-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm outline-none cursor-pointer transition-colors"
          >
            <option value="all" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Albums</option>
            <option value="none" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Uncategorized</option>
            <option 
              v-for="a in formattedAlbums" 
              :key="a.value" 
              :value="a.value"
              class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {{ a.label }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Sort Order Select -->
        <div class="relative">
          <select 
            v-model="localFilters.sort" 
            @change="emitChange" 
            class="w-full appearance-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm outline-none cursor-pointer transition-colors"
          >
            <option value="recent" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Newest First</option>
            <option value="oldest" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Oldest First</option>
            <option value="name" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Filename A-Z</option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';

const props = defineProps({
  albums: { type: Array, default: () => [] },
  filters: {
    type: Object,
    default: () => ({ search: '', media_type: 'all', album: 'all', sort: 'recent' })
  }
});

const emit = defineEmits(['update:filters']);

const localFilters = reactive({ ...props.filters });

// Map albums array into predictable object format { label, value }
const formattedAlbums = computed(() => {
  return props.albums.map(album => {
    if (typeof album === 'object' && album !== null) {
      return {
        label: album.name || album.label || album.id,
        value: album.id || album.value || album.name
      };
    }
    return { label: String(album), value: String(album) };
  });
});

watch(() => props.filters, (newVal) => {
  Object.assign(localFilters, newVal);
}, { deep: true });

let debounceTimer = null;

const debouncedEmit = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emitChange();
  }, 300);
};

const setMediaType = (type) => {
  localFilters.media_type = type;
  emitChange();
};

const emitChange = () => {
  emit('update:filters', { ...localFilters });
};
</script>