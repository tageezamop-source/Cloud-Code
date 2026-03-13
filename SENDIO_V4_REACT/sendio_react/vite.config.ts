import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/get-campaigns': 'http://localhost:5000',
      '/upload': 'http://localhost:5000',
      '/campaign': 'http://localhost:5000',
      '/accounts': 'http://localhost:5000',
      '/inbox': 'http://localhost:5000',
      '/analytics': 'http://localhost:5000',
      '/warmup': 'http://localhost:5000',
      '/webhooks': 'http://localhost:5000',
      '/crm': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/unsubscribes': 'http://localhost:5000',
      '/esp-lookup': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/verify-account': 'http://localhost:5000',
      '/delete-campaign': 'http://localhost:5000',
      '/update-campaign': 'http://localhost:5000',
      '/load-campaign': 'http://localhost:5000',
    }
  }
})
