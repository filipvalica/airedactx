// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          // Keep index.html at the root, move others to assets
          return assetInfo.name === 'index.html' ? '[name].[ext]' : 'assets/[name].[ext]';
        },
      },
    },
  },
  publicDir: 'public',
});