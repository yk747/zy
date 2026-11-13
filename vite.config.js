// ============================================================
// vite.config.js —— 构建配置
// ① @vitejs/plugin-vue：让 .vue 单文件组件能被编译
// ② unplugin-vue-components + VantResolver：Vant 组件按需引入
//    （模板里写 <van-button>，编译时自动补 import 与样式，不打包整个 Vant）
// ⚠️ 改完本文件要重启 dev 服务器
// ============================================================
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
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
})
