import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/web': {
        // target: 'https://d079-152-57-164-91.ngrok-free.app',
        target: 'http://localhost:8080',
        changeOrigin: true,
        // secure: false,
      },
    },
  },
});