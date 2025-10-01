// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Determine which manifest to use (default to Firefox for dev)
        const browser = process.env.BROWSER || 'firefox';
        const manifestSource = browser === 'chrome' 
          ? 'public/manifest.chrome.json' 
          : 'public/manifest.firefox.json';
        
        console.log(`Building for ${browser}, using ${manifestSource}`);
        
        // Copy the appropriate manifest
        copyFileSync(
          resolve(__dirname, manifestSource),
          resolve(__dirname, 'dist/manifest.json')
        );
        
        // Ensure icons directory exists
        const iconsDir = resolve(__dirname, 'dist/icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        
        // Copy icons if they exist
        try {
          copyFileSync(
            resolve(__dirname, 'public/icons/icon-48.png'),
            resolve(__dirname, 'dist/icons/icon-48.png')
          );
        } catch (e) {
          console.warn('Icon file not found, creating placeholder...');
          // Create a simple placeholder if icon doesn't exist
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/main.ts'),
        content: resolve(__dirname, 'src/content/injector.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep background.js and content.js at root level
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep index.html at root
          if (assetInfo.name === 'index.html') {
            return '[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
  publicDir: false, // Don't auto-copy public dir, we do it manually
});
