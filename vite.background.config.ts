// vite.background.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

// This config is ONLY for building the background script.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    // This build should NOT empty the dist folder.
    emptyOutDir: false, 
    lib: {
      // The entry point for our background script
      entry: resolve(__dirname, 'src/background/main.ts'),
      // The output format is 'iife' (Immediately Invoked Function Expression)
      formats: ['iife'],
      // This is required for the 'iife' format
      name: 'background',
    },
    rollupOptions: {
      output: {
        // The output filename will be 'background.js'
        entryFileNames: 'background.js',
      },
    },
  },
});