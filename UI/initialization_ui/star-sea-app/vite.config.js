import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile' // 引入插件

export default defineConfig({
  plugins:[
    react(),
    tailwindcss(),
    viteSingleFile() // 必须在这里调用！它会把 JS 和 CSS 强行塞进 HTML 里
  ],
})