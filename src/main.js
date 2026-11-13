// ============================================================
// main.js —— 应用"插件总线"
// 装插件两步走：① import 拿到货 ② app.use() 装上机器
// 本项目的插件清单：
//   Element Plus（全量）+ 图标库     —— 第 6 章 UI 组件库（桌面端）
//   Pinia + 持久化插件               —— 第 7 章 状态管理（用户/购物车/收藏/订单）
//   Vue Router                      —— 第 5 章 路由与守卫
//   自定义指令插件                    —— 第 4 章 v-focus / v-highlight
// json-server 单独启动：npm run server（3001 端口）
// ============================================================
import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 注意：style.css 必须放在 element-plus 样式之后引入，
// 否则组件库的 :root 主色变量会覆盖掉集市的绿色主题
import './style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import directives from './directives'

const app = createApp(App)

// 图标全局注册：模板里 <el-icon><Sell /></el-icon> 直接可用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.use(router)
app.use(directives)

app.mount('#app')
