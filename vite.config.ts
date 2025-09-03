import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/dog_blog/' : '/',
})
