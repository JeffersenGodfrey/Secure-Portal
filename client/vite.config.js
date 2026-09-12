import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // pdfjs-dist is a big dependency; silence the default size warning.
    chunkSizeWarningLimit: 2000,
  },
});