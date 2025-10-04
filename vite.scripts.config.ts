// vite.scripts.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

// This config is ONLY for building the background and content scripts.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    // Do not empty the dist folder here, as the main build will handle it.
    emptyOutDir: false, 
    lib: {
      // Define the entry points for the scripts
      entry: {
        background: resolve(__dirname, 'src/background/main.ts'),
        content: resolve(__dirname, 'src/content/injector.ts'),
      },
      // Output format is 'iife' for browser compatibility
      formats: ['iife'],
      // The name for the global variable (required for iife format)
      name: '[name]',
    },
    rollupOptions: {
      output: {
        // Ensure the output file names are just 'background.js' and 'content.js'
        entryFileNames: '[name].js',
      },
    },
  },
});