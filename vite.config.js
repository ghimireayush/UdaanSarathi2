import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://dev.kaha.com.np',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/job-portal')
      }
    }
  }
})