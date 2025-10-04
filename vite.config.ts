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
          copyFileSync(
            resolve(__dirname, 'public/icons/icon-48.svg'),
            resolve(iconsDir, 'icon-48.svg')
          );
        } catch (e) {
          console.warn('Icon file not found.');
        }

        // *** CRITICAL FIX: COPY THE CSS FILE ***
        try {
          copyFileSync(
            resolve(__dirname, 'src/content/injected-styles.css'),
            resolve(distDir, 'injected-styles.css') // Copy it to the root of dist
          );
        } catch (e) {
          console.error('Failed to copy injected-styles.css', e);
        }
      }
    }
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true, 
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  publicDir: false,
});