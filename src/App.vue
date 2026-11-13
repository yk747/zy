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
        <div class="foot-inner">
          <div class="foot-brand">
            <span class="foot-logo">集</span>
            <div class="foot-brand-text">
              <b>校园二手集市</b>
              <span>让闲置资产高效流转</span>
            </div>
          </div>
          <div class="foot-tags">
            <span>实名认证</span>
            <span>当面验货</span>
            <span>绿色循环</span>
          </div>
        </div>
        <p class="foot-copy">© 2026 CAMPUS MARKET · 校园闲置交易平台</p>
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
  padding: 26px 24px 22px;
  color: var(--muted);
  font-size: 12px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
}

.foot-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.foot-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.foot-logo {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(140deg, #22d39b, #04835a);
  box-shadow: 0 6px 14px rgba(0, 181, 120, 0.22);
}

.foot-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.foot-brand-text b {
  font-size: 14px;
  color: var(--text);
  letter-spacing: 0.2px;
}

.foot-brand-text span {
  font-size: 12px;
}

.foot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.foot-tags span {
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-size: 11.5px;
}

.foot-copy {
  max-width: 1200px;
  margin: 16px auto 0;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
  text-align: center;
  font-size: 11.5px;
  color: #9aa8b0;
  letter-spacing: 0.4px;
}
</style>
