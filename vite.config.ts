// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

// Get the current directory for ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'background/main': resolve(__dirname, 'src/background/main.ts'),
        'content/injector': resolve(__dirname, 'src/content/injector.ts'),
        'index': resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'assets/js/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  publicDir: 'public',
});