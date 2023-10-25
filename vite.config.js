import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/completion': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
