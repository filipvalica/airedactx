// vite.background.config.ts
// Builds src/background/main.ts into dist/background.js as a single self-contained script.
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: { entry: resolve(__dirname, 'src/background/main.ts'), formats: ['iife'], name: 'airedactxBackground' },
    rollupOptions: { output: { entryFileNames: 'background.js' } },
  },
});
