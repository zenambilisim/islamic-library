import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Tüm network interface'lerinden erişimi aç
    port: 5173, // Port numarası
  },
})
