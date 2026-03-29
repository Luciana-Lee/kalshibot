import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/kalshi-api': {
        target: 'https://trading-api.kalshi.com/trade-api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
      '/noaa-api': {
        target: 'https://api.weather.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/noaa-api/, ''),
      },
    },
  },
})
