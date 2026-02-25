import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile()
  ],
  build: {
    minify: false, // <--- 关键：禁止压缩，保持多行格式，否则 // 会注释掉整行代码
    target: 'esnext',
    assetsInlineLimit: 100000000, // 确保所有东西都内联
  }
})