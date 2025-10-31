import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'trpc': ['@trpc/client'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})

