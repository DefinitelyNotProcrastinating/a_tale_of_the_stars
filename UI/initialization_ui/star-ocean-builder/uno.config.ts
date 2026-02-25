import { defineConfig, presetUno, presetIcons, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // 默认 Tailwind 兼容
    presetIcons(), // 图标支持
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Orbitron:400,700', // 科幻字体
        mono: 'Fira Code',
      },
    }),
  ],
  theme: {
    colors: {
      bg: '#050b14',       // 深空黑
      panel: '#0f172a',    // 面板背景
      primary: '#00f0ff',  // 霓虹青
      accent: '#ff0055',   // 警告红
      dim: '#1e293b',      // 边框色
    }
  }
})