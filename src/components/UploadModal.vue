<template>
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs" @click.self="emit('close')">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-slate-200 relative overflow-hidden">
      
      <h2 class="text-lg font-bold text-white mb-4">Upload Media</h2>
      
      <!-- Drag & Drop Zone -->
      <div 
        class="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-lg p-6 text-center cursor-pointer my-4 transition-colors"
        :class="{ 'border-blue-500 bg-blue-500/10': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <p class="text-sm text-slate-400">📁 Drag & Drop files here or click to select</p>
        <input type="file" ref="fileInput" multiple @change="handleFileSelect" class="hidden" />
      </div>

      <!-- File List Preview -->
      <div v-if="files.length" class="max-h-24 overflow-y-auto text-xs text-slate-400 mb-4 bg-slate-950 p-3 rounded border border-slate-800">
        <p class="font-semibold text-slate-300 mb-1">Selected ({{ files.length }}):</p>
        <ul class="space-y-1">
          <li v-for="f in files" :key="f.name" class="truncate font-mono">{{ f.name }}</li>
        </ul>
      </div>

      <!-- Album Selection & Creation (Mandatory) -->
      <div class="mb-6 space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">
            Assign Album <span class="text-red-400">*</span>
          </label>
          <select 
            v-model="selectedAlbum" 
            class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
          >
            <!-- Existing Albums -->
            <option v-for="alb in albums" :key="alb" :value="alb">
              📁 {{ alb }}
            </option>
            <!-- Option to Create New Album -->
            <option value="__NEW__" class="font-semibold text-blue-400">
              ➕ + Create New Album
            </option>
          </select>
        </div>

        <!-- Conditional Input for New Album Name -->
        <div v-if="selectedAlbum === '__NEW__'">
          <label class="block text-xs font-semibold text-blue-400 mb-1">New Album Name <span class="text-red-400">*</span></label>
          <input 
            type="text" 
            v-model="customAlbum" 
            placeholder="e.g. Summer Vacation" 
            class="w-full bg-slate-950 border border-blue-500/50 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" 
            ref="customInput"
          />
        </div>
      </div>

      <!-- Modal Action Buttons -->
      <div class="flex justify-end space-x-2">
        <button 
          class="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium cursor-pointer" 
          @click="emit('close')"
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed" 
          :disabled="!files.length || !isAlbumValid" 
          @click="startUpload"
        >
          Start Upload
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';

const props = defineProps({
  albums: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'start-upload']);

const files = ref([]);
// Default to the first existing album if available, otherwise force "__NEW__"
const selectedAlbum = ref(props.albums.length > 0 ? props.albums[0] : '__NEW__');
const customAlbum = ref('');
const isDragging = ref(false);
const fileInput = ref(null);
const customInput = ref(null);

const triggerFileInput = () => fileInput.value.click();

const handleFileSelect = (e) => {
  files.value = Array.from(e.target.files);
};

const handleDrop = (e) => {
  isDragging.value = false;
  files.value = Array.from(e.dataTransfer.files);
};

// Validate that an album name is selected/entered
const isAlbumValid = computed(() => {
  if (selectedAlbum.value === '__NEW__') {
    return customAlbum.value.trim().length > 0;
  }
  return selectedAlbum.value !== '';
});

// Focus custom input automatically when choosing "+ Create New Album"
watch(selectedAlbum, (val) => {
  if (val === '__NEW__') {
    nextTick(() => {
      customInput.value?.focus();
    });
  }
});

const startUpload = () => {
  if (!files.value.length || !isAlbumValid.value) return;

  // Resolve target album string
  const finalAlbum = selectedAlbum.value === '__NEW__' 
    ? customAlbum.value.trim() 
    : selectedAlbum.value;

  emit('start-upload', { files: files.value, album: finalAlbum });
  emit('close');
};
</script>