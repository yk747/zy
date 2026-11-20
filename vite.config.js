// ============================================================
// vite.config.js —— 构建配置
// ① @vitejs/plugin-vue：让 .vue 单文件组件能被编译
// ② unplugin-vue-components + ElementPlusResolver / VantResolver：
//    Element Plus 与 Vant 都按需引入（模板写标签，编译时自动补 import 与样式）
// ⚠️ 改完本文件要重启 dev 服务器
// ============================================================
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver, VantResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages 项目站点在 /zy/ 子路径下，构建时必须带 base，否则资源 404；
  // 本地 dev 仍用根路径，避免开发时访问要带 /zy/ 前缀；
  // preview 读的是 dist（路径已带 /zy/），base 必须同步，否则 JS 会被当 HTML 返回导致白屏。
  base: command === 'build' || isPreview ? '/zy/' : '/',
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver(), ElementPlusResolver({ importStyle: 'css' })]
    })
  ],
  server: {
    open: true,
    port: 5173,
    // 端口固定：端口一旦漂移（5174、5175…），浏览器会把新端口当成新站点，
    // localStorage 里的登录状态就读不到了，表现为"每次运行都要重新登录"
    strictPort: true
  },
  preview: {
    port: 4173,
    strictPort: true
  }
}))
