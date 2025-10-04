// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// This config is now ONLY for the popup UI and manifest/icon copying.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        const browser = process.env.BROWSER || 'firefox';
        const manifestSource = resolve(__dirname, 'public', `manifest.${browser}.json`);
        const distDir = resolve(__dirname, 'dist');

        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        copyFileSync(manifestSource, resolve(distDir, 'manifest.json'));
        
        // Handle icons
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        try {
          // Update the filename to copy the new SVG icon
          copyFileSync(
            resolve(__dirname, 'public/icons/icon-48.svg'),
            resolve(iconsDir, 'icon-48.svg')
          );
        } catch (e) {
          console.warn('Icon file not found.');
        }
      }
    }
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    // This main build will clear the directory.
    emptyOutDir: true, 
    rollupOptions: {
      // The only input for this build is the popup HTML.
      input: resolve(__dirname, 'index.html'),
    },
  },
  publicDir: false,
});