// vite.content.config.ts
// Builds src/content/injector.ts into dist/content.js as a single self-contained script.
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: { entry: resolve(__dirname, 'src/content/injector.ts'), formats: ['iife'], name: 'airedactxContent' },
    rollupOptions: { output: { entryFileNames: 'content.js' } },
  },
});
