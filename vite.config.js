import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend origin the dev server proxies to. Override with VITE_PROXY_TARGET.
const backend = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // FE-3: proxy the API and the WebSocket through the Vite origin so the SPA and
  // backend look same-origin in dev. This lets the HttpOnly auth cookie use
  // SameSite=Strict (proper CSRF protection) and flow on every request — no
  // SameSite=None;Secure workaround needed for cross-port localhost.
  server: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/ws': { target: backend, changeOrigin: true, ws: true },
    },
  },
})
