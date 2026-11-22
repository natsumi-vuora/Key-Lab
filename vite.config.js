import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 設為相對路徑，部署到 GitHub Pages 的任何 repo 名稱下都能運作
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
