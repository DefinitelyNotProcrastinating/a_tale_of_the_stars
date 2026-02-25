import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(), // 样式引擎
    viteSingleFile() // 单文件打包核心
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // 强制内联所有资源
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
  }
})