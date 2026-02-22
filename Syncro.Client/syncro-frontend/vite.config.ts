import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5232',
          changeOrigin: true,
          secure: env.VITE_USE_HTTPS === 'true',
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
    // Делаем переменные окружения доступными в коде
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT),
      'import.meta.env.VITE_USE_HTTPS': JSON.stringify(env.VITE_USE_HTTPS),
    }
  };
});