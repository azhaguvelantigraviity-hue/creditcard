import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Exposes the server to your local network
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.10.100.222:5000',
        changeOrigin: true,
      }
    }
  }
})
