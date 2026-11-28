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
            <p class="foot-slogan">把闲置交给同校的人，让好物继续发光。<br />每一次流转，都是一次环保的选择。</p>
          </div>

          <div class="foot-col">
            <h4>交易保障</h4>
            <a @click="go('/market')">校园实名认证</a>
            <a @click="go('/market')">当面验货交付</a>
            <a @click="go('/center/my-credit')">信用评价体系</a>
            <a @click="go('/center/my-messages')">在线咨询服务</a>
          </div>
          <div class="foot-col">
            <h4>逛逛集市</h4>
            <a @click="go('/market')">全部闲置</a>
            <a @click="go('/market')">教材书籍</a>
            <a @click="go('/market')">电子数码</a>
            <a @click="go('/center/my-favorites')">我的收藏</a>
          </div>
          <div class="foot-col">
            <h4>卖家服务</h4>
            <a @click="go('/publish')">发布宝贝</a>
            <a @click="go('/center/my-goods')">管理发布</a>
            <a @click="go('/center/my-orders')">订单管理</a>
            <a @click="go('/center/my-credit')">信用档案</a>
          </div>

          <div class="foot-service">
            <span class="foot-service-badge"><el-icon><CircleCheck /></el-icon>校内认证平台</span>
            <span class="foot-service-badge"><el-icon><Location /></el-icon>支持当面交易</span>
            <span class="foot-service-badge"><el-icon><ChatDotRound /></el-icon>7×12 小时服务</span>
          </div>
        </div>
        <div class="foot-bottom">
          <p class="foot-copy">© 2026 CAMPUS MARKET · 校园闲置交易平台 · 让闲置产生价值</p>
          <span class="foot-status"><i></i>平台运行正常</span>
        </div>
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
  },
  methods: {
    go(path) {
      this.$router.push(path)
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
  max-width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.8fr repeat(3, 1fr) 1.4fr;
  gap: 28px;
  align-items: start;
}

.foot-brand {
  display: grid;
  grid-template-columns: 32px 1fr;
  column-gap: 10px;
  row-gap: 12px;
  align-items: center;
}

.foot-brand .foot-slogan {
  grid-column: 1 / -1;
  margin: 0;
  line-height: 1.9;
  color: var(--muted);
  font-size: 12px;
}

.foot-col {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.foot-col h4 {
  margin: 2px 0 6px;
  font-size: 13px;
  color: var(--text);
  font-weight: 700;
}

.foot-col a {
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease;
  width: fit-content;
}

.foot-col a:hover {
  color: var(--primary-dark);
  transform: translateX(3px);
}

.foot-service {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius-sm);
  background: var(--primary-bg);
}

.foot-service-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--primary-dark);
  font-weight: 500;
}

.foot-bottom {
  max-width: 1800px;
  margin: 22px auto 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.foot-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--muted);
}

.foot-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 181, 120, 0.14);
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
  margin: 0;
  font-size: 11.5px;
  color: #9aa8b0;
  letter-spacing: 0.4px;
}

@media (max-width: 1100px) {
  .foot-inner {
    grid-template-columns: repeat(3, 1fr);
  }

  .foot-brand,
  .foot-service {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .foot-inner {
    grid-template-columns: repeat(2, 1fr);
  }

  .foot-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
