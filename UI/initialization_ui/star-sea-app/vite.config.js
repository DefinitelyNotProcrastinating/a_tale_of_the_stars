import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins:[
    react(),
    tailwindcss(),
    viteSingleFile() // 核心：将所有 CSS 和 JS 内联到单个 index.html 中
  ],
})