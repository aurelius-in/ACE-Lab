import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use default port (5173). Uncomment to customize.
  // server: { port: 5147, strictPort: true, host: true },
})
