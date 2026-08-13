<template>
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs" @click.self="$emit('close')">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
      <h2 class="text-lg font-bold text-white mb-4">Admin Authentication</h2>
      <form @submit.prevent="login">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Enter master password" 
          class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none mb-3" 
          required 
        />
        <p v-if="error" class="text-xs text-red-400 mb-3">{{ error }}</p>
        <div class="flex justify-end space-x-2">
          <button type="button" class="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium cursor-pointer" @click="$emit('close')">Cancel</button>
          <button type="submit" class="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 cursor-pointer" :disabled="loading">Login</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'authenticated']);
const password = ref('');
const error = ref('');
const loading = ref(false);

const login = async () => {
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    });

    if (res.ok) {
      const data = await res.json();
      emit('authenticated', data.token);
    } else {
      error.value = 'Invalid password';
    }
  } catch (err) {
    error.value = 'Connection error';
  } finally {
    loading.value = false;
  }
};
</script>