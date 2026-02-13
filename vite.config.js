import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react']
        }
      }
    },
    
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})
