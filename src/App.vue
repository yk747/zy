<!-- ============================================================
  App.vue —— 校园二手集市应用外壳
  ① 登录页隐藏导航（meta.hideChrome）
  ② router-view 用 transition 做淡入切换
  ③ provide 全局集市信息：深层组件无需层层传 props 就能 inject 到
  ============================================================ -->
<template>
  <el-config-provider :locale="zhCn">
    <div class="app-shell">
      <AppHeader v-if="!$route.meta.hideChrome" />

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <footer v-if="!$route.meta.hideChrome" class="app-footer">
        <span>校园二手集市 · 闲置流转，变废为宝</span>
        <span class="dot">·</span>
        <span>认证学生 · 校内面交 · 绿色循环</span>
      </footer>
    </div>
  </el-config-provider>
</template>

<script>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: { AppHeader },
  data() {
    return { zhCn }
  },
  // 跨级传值：祖先 provide，后代任意层级 inject（教材 3.7）
  provide() {
    return {
      appInfo: {
        name: '校园二手集市',
        version: 'v1.0.0',
        owner: '闲置流转 · 变废为宝'
      }
    }
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-footer {
  margin-top: auto;
  padding: 20px 16px 28px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.62);
}

.dot {
  margin: 0 6px;
}
</style>
