<template>
  <header class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 pt-2 border-b border-slate-200 dark:border-slate-800">
    <!-- Title & Active Album Tag -->
    <div class="flex items-center space-x-2">
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
        <!-- Camera Icon -->
        <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Vine Media Server
        
      </h1>

      <!-- Active Album Indicator Tag -->
      <span 
        v-if="currentUrlAlbum" 
        class="ml-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5"
      >
        <!-- Folder Icon -->
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        {{ currentUrlAlbum }}
        <button 
          @click="$emit('clear-album')" 
          class="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ml-0.5" 
          title="Clear album filter"
        >
          <!-- Close Icon -->
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>

    <!-- Actions Toolbar -->
    <div class="flex items-center space-x-2 sm:space-x-3 pt-3">
      <!-- Upload Button -->
    <button 
  v-if="token" 
  class="p-2 sm:px-3.5 sm:py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" 
  @click="$emit('open-upload')"
  title="Upload"
>
  <!-- Plus / Upload SVG Icon (Always Visible) -->
  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>

  <!-- Text (Hidden on mobile, visible on sm screens and up) -->
  <span class="hidden sm:inline">Upload</span>
</button>

      <!-- Scan Disk Button -->
      <button 
        v-if="token" 
        class="px-3.5 py-2 rounded-lg text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5" 
        :disabled="isScanning"
        @click="$emit('trigger-scan')"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': isScanning }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Scan 
        <span class="hidden sm:inline">    Disk</span>
      </button>

      <!-- Theme Switcher Button -->
      <button
        @click="$emit('toggle-theme')"
        class="p-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <!-- Sun Icon (Light Mode) -->
        <svg v-if="isDark" class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <!-- Moon Icon (Dark Mode) -->
        <svg v-else class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Auth Login / Logout Buttons -->
      <button 
        v-if="!token" 
        class="px-3.5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm" 
        @click="$emit('open-auth')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        
           <span class="hidden sm:inline">  Admin Login</span>
      </button>

      <button 
        v-else 
        class="px-3.5 py-2 rounded-lg text-sm font-semibold bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer flex items-center gap-1.5" 
        @click="$emit('logout')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
         <span class="hidden sm:inline"> Logout</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  token: { type: String, default: '' },
  currentUrlAlbum: { type: String, default: '' },
  isScanning: { type: Boolean, default: false },
  isDark: { type: Boolean, default: true },
});

defineEmits([
  'clear-album',
  'open-upload',
  'trigger-scan',
  'toggle-theme',
  'open-auth',
  'logout',
]);
</script>