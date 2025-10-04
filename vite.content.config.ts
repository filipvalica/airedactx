// vite.content.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

// This config is ONLY for building the content script.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    // This build should also NOT empty the dist folder.
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/injector.ts'),
      formats: ['iife'],
      name: 'content',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
      },
    },
  },
});