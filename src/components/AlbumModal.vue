<template>
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs" @click.self="$emit('close')">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
      <h3 class="text-base font-bold text-white mb-1">Assign Album</h3>
      <p class="text-xs text-slate-400 font-mono break-all mb-4">{{ filename }}</p>
      
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Select Existing Album:</label>
          <select 
            v-model="selectedAlbum" 
            :disabled="isCreatingNew"
            class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer disabled:opacity-40"
          >
            <option value="">-- No Album (Uncategorized) --</option>
            <option v-for="a in albums" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div class="flex items-center space-x-2 pt-1">
          <input 
            type="checkbox" 
            id="newAlbumToggle" 
            v-model="isCreatingNew" 
            class="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <label for="newAlbumToggle" class="text-xs text-slate-300 cursor-pointer select-none">
            Create new album
          </label>
        </div>

        <div v-if="isCreatingNew">
          <input 
            type="text" 
            v-model="newAlbumName" 
            placeholder="Type new album name..." 
            class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
            ref="newInput"
          />
        </div>
      </div>

      <div class="flex justify-end space-x-2 mt-6">
        <button class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer" @click="$emit('close')">Cancel</button>
        <button class="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  filename: { type: String, required: true },
  currentAlbum: { type: String, default: '' },
  albums: { type: Array, default: () => [] },
  token: { type: String, default: '' }
});

const emit = defineEmits(['close', 'updated']);

const selectedAlbum = ref(props.currentAlbum || '');
const newAlbumName = ref('');
const isCreatingNew = ref(false);
const newInput = ref(null);

// Reset / initialize state whenever currentAlbum or filename changes
watch(
  () => [props.filename, props.currentAlbum],
  ([_, newAlbum]) => {
    selectedAlbum.value = newAlbum || '';
    isCreatingNew.value = false;
    newAlbumName.value = '';
  },
  { immediate: true }
);

watch(isCreatingNew, (val) => {
  if (val) {
    nextTick(() => newInput.value?.focus());
  }
});

const save = async () => {
  const targetAlbum = isCreatingNew.value ? newAlbumName.value.trim() : selectedAlbum.value;

  try {
    const res = await fetch('/api/images/assign_album', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.token}`
      },
      body: JSON.stringify({ filename: props.filename, album: targetAlbum }),
    });

    if (res.ok) {
      emit('updated');
      emit('close');
    } else {
      alert('Failed to assign album');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};
</script>