import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible'; // 1. Import this
import packageJson from './package.json' // Import your package.json

export default defineConfig({
  // Path-based deployment support: set VITE_BASE_PATH=/ultracorewood at build time
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(),
  envCompatible()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-slick', 'slick-carousel']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    // 1. Your existing version check (Keep this!)
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),

    // 2. Razorpay Key: prefer environment variable, fall back to the correct test key
    'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_S2DnBwP8ftNfxt"),
    
    // 3. FORCE the API URL here (supports both local and production)
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || "http://localhost:8000"),
  },
  envPrefix: 'REACT_APP_',
  server: {
    port: 3000,
    open: false,
    proxy: {
      // Forward API requests to your backend
      '/api': {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      // Forward Socket.io connections
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        ws: true,
      },
    },
  },
});


