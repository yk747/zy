// ============================================================
// main.js —— 应用"插件总线"
// 装插件两步走：① import 拿到货 ② app.use() 装上机器
// 本项目的插件清单：
//   Element Plus（按需）+ 图标库     —— 第 6 章 UI 组件库，vite 插件自动引入
//   Pinia + 持久化插件               —— 第 7 章 状态管理（用户/购物车/收藏/订单）
//   Vue Router                      —— 第 5 章 路由与守卫
//   自定义指令插件                    —— 第 4 章 v-focus / v-highlight
//
// 性能说明：Element Plus 组件由 vite.config.js 的 ElementPlusResolver 按需引入，
// 这里只补插件照顾不到的部分——用到的图标、v-loading 指令、函数式 API 样式。
// ============================================================
import { createApp } from 'vue'

import { ElLoading, messageDefaults } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// 全局消息提示停留时长：默认 3000ms 偏长，加购 / 移除等操作提示一闪而过更清爽
messageDefaults.duration = 1600
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'
// 只引入项目实际用到的图标（StatCard 的动态 :is 也按这些名字渲染）
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChatDotRound,
  CircleCheck,
  CirclePlus,
  Clock,
  Edit,
  Iphone,
  Location,
  Lock,
  MagicStick,
  Message,
  Plus,
  Reading,
  Search,
  Sell,
  Shop,
  ShoppingCart,
  Star,
  Tickets,
  TrendCharts,
  User
} from '@element-plus/icons-vue'

// 注意：style.css 必须放在 element-plus 样式之后引入，
// 否则组件库的 :root 主色变量会覆盖掉集市的绿色主题
import './style.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import directives from './directives'

const app = createApp(App)

const icons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChatDotRound,
  CircleCheck,
  CirclePlus,
  Clock,
  Edit,
  Iphone,
  Location,
  Lock,
  MagicStick,
  Message,
  Plus,
  Reading,
  Search,
  Sell,
  Shop,
  ShoppingCart,
  Star,
  Tickets,
  TrendCharts,
  User
}
for (const [key, component] of Object.entries(icons)) {
  app.component(key, component)
}

// v-loading 是指令而非组件，按需引入插件不会处理，这里手动注册
app.directive('loading', ElLoading.directive)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.use(router)
app.use(directives)

app.mount('#app')
