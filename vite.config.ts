// vite.config.ts
// Builds the options page (index.html + React bundle) and assembles the rest of dist/:
// the browser-specific manifest (version taken from package.json so there is one source of
// truth), the icon, the content stylesheet and the bundled default rules.
// background.js and content.js are built by their own configs because Vite's library mode
// cannot emit two IIFE entries from one config.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const root = __dirname;
const dist = resolve(root, 'dist');

const assembleExtension = () => {
  const browser = process.env.BROWSER === 'chrome' ? 'chrome' : 'firefox';
  const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(root, 'public', `manifest.${browser}.json`), 'utf8'));
  manifest.version = version;

  mkdirSync(resolve(dist, 'icons'), { recursive: true });
  writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  copyFileSync(resolve(root, 'public/icons/icon-48.svg'), resolve(dist, 'icons/icon-48.svg'));
  copyFileSync(resolve(root, 'src/content/injected-styles.css'), resolve(dist, 'injected-styles.css'));
  copyFileSync(resolve(root, 'airedactx_rules.tsv'), resolve(dist, 'airedactx_rules.tsv'));
};

export default defineConfig({
  plugins: [react(), { name: 'assemble-extension', closeBundle: assembleExtension }],
  publicDir: false,
  build: {
    outDir: dist,
    emptyOutDir: true,
    // The preload polyfill adds a fetch() call to the options bundle; the page has one script
    // and no dynamic imports, so it is dead weight and muddies the "no network" claim.
    modulePreload: { polyfill: false },
    rollupOptions: { input: resolve(root, 'index.html') },
  },
});
