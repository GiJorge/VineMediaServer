// src/composables/useTheme.js
import { ref } from 'vue';

const isDark = ref(false); // Default to light first to verify

export function useTheme() {
  const updateHtmlClass = () => {
    const root = document.documentElement;
    
    if (isDark.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    console.log('[Theme Check] isDark:', isDark.value, 'HTML classes:', root.className);
  };

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    updateHtmlClass();
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      isDark.value = savedTheme === 'dark';
    } else {
      isDark.value = false; // Force light default for testing
    }
    updateHtmlClass();
  };

  return { isDark, toggleTheme, initTheme };
}