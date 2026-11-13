<!-- ============================================================
  LoginView.vue —— 登录页（路由守卫的拦截目的地，题目 F1）
  ① 左侧品牌深色面板 + 热门闲置预览，右侧白色登录卡，视觉更聚焦
  ② 一键体验入口 + 密码回填，降低首次使用成本
  ③ 账号从 users 数据校验（接口或本地兜底），密码错会提示
  知识点：
   · el-form :model + :rules 表单校验（6.2）
   · v-focus 自定义指令自动聚焦（4.5）
   · v-model.trim 修饰符（2.x）
   · 登录成功写 token + Pinia 用户仓库，再编程式导航跳回原页面（5.x / 7.x）
  ============================================================ -->
<template>
  <div class="login-page">
    <div class="bg-grid"></div>
    <div class="blob blob--1"></div>
    <div class="blob blob--2"></div>

    <div class="login-box">
      <!-- 左侧：品牌与卖点 -->
      <section class="intro">
        <div class="float-deco" aria-hidden="true">
          <span class="deco deco--1">📚</span>
          <span class="deco deco--2">🎧</span>
          <span class="deco deco--3">🏀</span>
          <span class="deco deco--4">🚲</span>
        </div>

        <div class="brand-row">
          <span class="logo">集</span>
          <div class="brand-text">
            <b>校园二手集市</b>
            <small>CAMPUS MARKET</small>
          </div>
          <span class="brand-pill">校园严选 · 极速成交</span>
        </div>

        <h1>让校园闲置<br />高效流转起来</h1>

        <ul class="feature-list">
          <li>
            <span class="feature-icon"><el-icon><Shop /></el-icon></span>
            智能分类精准匹配，所需好物一搜即达
          </li>
          <li>
            <span class="feature-icon"><el-icon><CirclePlus /></el-icon></span>
            60 秒极速发布，宝贝状态实时可控
          </li>
          <li>
            <span class="feature-icon"><el-icon><ShoppingCart /></el-icon></span>
            收藏与购物车状态留存，进度不丢失
          </li>
          <li>
            <span class="feature-icon"><el-icon><Iphone /></el-icon></span>
            移动端全渠道覆盖，订单进度随行可查
          </li>
        </ul>

        <div class="metric-row">
          <div><b>{{ metrics.goods }}</b><span>在售宝贝</span></div>
          <div><b>{{ metrics.categories }}</b><span>品类覆盖</span></div>
          <div><b>{{ metrics.users }}</b><span>认证用户</span></div>
        </div>

        <div class="showcase">
          <div
            v-for="item in showcase"
            :key="item.id"
            class="mini-card"
            :style="{ background: item.gradient }"
          >
            <span class="mini-emoji">{{ item.emoji }}</span>
            <small>￥{{ Number(item.price).toFixed(0) }}</small>
          </div>
          <div class="showcase-label">
            <span class="pulse"></span>
            平台严选 · 当面验货更安心
          </div>
        </div>
      </section>

      <!-- 右侧：登录卡 -->
      <section class="form-card">
        <div class="card-head">
          <span class="hello-chip">{{ greeting }}</span>
          <h2>欢迎来到校园二手集市</h2>
          <p class="muted">登录后可发布宝贝、管理收藏并跟踪订单进度</p>
        </div>

        <el-form
          ref="formRef"
          class="login-form"
          :model="form"
          :rules="rules"
          hide-required-asterisk
          @submit.prevent
        >
          <el-form-item prop="username">
            <el-input
              v-focus
              v-model.trim="form.username"
              size="large"
              maxlength="12"
              placeholder="请输入昵称"
              aria-label="昵称"
              autocomplete="username"
              :disabled="loading"
              clearable
              @keyup.enter="submit"
            >
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              placeholder="请输入密码"
              aria-label="密码"
              autocomplete="current-password"
              show-password
              :disabled="loading"
              @keyup.enter="submit"
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <div class="form-row">
            <el-tooltip content="勾选后下次打开集市无需重新登录" placement="top">
              <el-checkbox v-model="autoLogin" :disabled="loading">七天内自动登录</el-checkbox>
            </el-tooltip>
            <el-button link type="primary" size="small" @click="showPasswordTip">忘记密码？</el-button>
          </div>

          <el-button
            type="primary"
            size="large"
            class="submit"
            :loading="loading"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? '正在进入集市…' : '登 录' }}
          </el-button>
        </el-form>

        <div class="divider"><span>或</span></div>

        <el-button class="quick" size="large" :disabled="loading" @click="quickLogin">
          <el-icon><MagicStick /></el-icon>
          免费体验（演示账号）
        </el-button>
      </section>
    </div>

    <footer class="foot">实名认证 · 当面验货 · 全程保障</footer>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import { fetchUsers } from '../api/goods'
import { GOODS_SEED, USER_SEED, CATEGORIES, DEMO_ACCOUNT } from '../../shared/goods.js'

const LOGIN_OPTS_KEY = 'campus-market:login-opts'

// 读取「下次自动登录」勾选偏好，默认勾上
function readLoginOpts() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOGIN_OPTS_KEY) || '{}')
    return { autoLogin: saved.autoLogin !== false }
  } catch (e) {
    return { autoLogin: true }
  }
}

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      ...readLoginOpts(),
      loading: false,
      showcase: [GOODS_SEED[1], GOODS_SEED[5], GOODS_SEED[10]].filter(Boolean),
      metrics: {
        goods: GOODS_SEED.length,
        categories: CATEGORIES.length,
        users: USER_SEED.length
      },
      rules: {
        username: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 12, message: '昵称长度 2—12 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    // 按当前时段问候，登录卡更有温度
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了，同学'
      if (hour < 12) return '早上好，同学'
      if (hour < 14) return '午安，同学'
      if (hour < 18) return '下午好，同学'
      return '晚上好，同学'
    },
  },
  watch: {
    // 勾选状态变化立即保存，下次进入登录页自动恢复
    autoLogin() {
      this.saveLoginOpts()
    }
  },
  methods: {
    saveLoginOpts() {
      localStorage.setItem(
        LOGIN_OPTS_KEY,
        JSON.stringify({ autoLogin: this.autoLogin })
      )
    },
    // 一键体验：以体验同学身份直接进入集市
    quickLogin() {
      if (this.loading) return
      this.form.username = DEMO_ACCOUNT.username
      this.form.password = DEMO_ACCOUNT.password
      this.$nextTick(() => this.submit())
    },
    showPasswordTip() {
      ElMessageBox.alert(
        '集市账号为学校认证账号，密码由本人设置。如需重置密码，请携带学生证前往信息中心，或联系班级管理员协助处理。',
        '忘记密码',
        {
          confirmButtonText: '知道了',
          type: 'info'
        }
      )
    },
    submit() {
      if (this.loading) return

      this.$refs.formRef.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning('请先补全昵称和密码')
          return
        }
        this.loading = true
        try {
          // 账号来自 json-server 的 users（接口没启动会自动用本地体验数据）
          const users = await fetchUsers()
          const matched = users.find((user) => user.name === this.form.username)

          if (!matched) {
            ElMessage.error('账号不存在，请核对昵称或使用演示账号体验')
            return
          }
          if (matched.password !== this.form.password) {
            ElMessage.error('密码不正确，请重新输入')
            return
          }

          const user = useUserStore()
          // 勾选自动登录 → token 写入 localStorage，重启项目仍然有效
          user.login(matched, this.autoLogin)
          ElMessage.success(`登录成功，欢迎回来，${matched.name}`)

          // redirect 只接受站内路径，避免跳到非法地址
          const redirect = this.$route.query.redirect
          const target =
            typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login')
              ? redirect
              : '/market'
          this.$router.replace(target)
        } catch {
          ElMessage.error('登录失败，请稍后再试')
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 36px 20px 18px;
  overflow: hidden;
  background:
    radial-gradient(760px 340px at 12% 0%, rgba(0, 181, 120, 0.16), transparent 68%),
    radial-gradient(720px 320px at 92% 100%, rgba(5, 150, 105, 0.14), transparent 70%),
    var(--bg);
}

/* 背景细网格，弱化处理 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(6, 95, 70, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 95, 70, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(700px 480px at 50% 30%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(700px 480px at 50% 30%, #000 20%, transparent 75%);
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  opacity: 0.5;
  pointer-events: none;
}

.blob--1 {
  width: 220px;
  height: 220px;
  background: #c9f0dd;
  left: -70px;
  bottom: -60px;
}

.blob--2 {
  width: 160px;
  height: 160px;
  background: #d6f5e6;
  right: 8%;
  top: -50px;
}

.blob--1 {
  animation: drift 12s ease-in-out infinite alternate;
}

.blob--2 {
  animation: drift 15s 2s ease-in-out infinite alternate-reverse;
}

@keyframes drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(26px, -18px) scale(1.08);
  }
}

/* ---------- 左板漂浮装饰 emoji ---------- */
.float-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco {
  position: absolute;
  font-size: 26px;
  opacity: 0.32;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18));
  animation: floaty 7s ease-in-out infinite;
}

.deco--1 {
  right: 44px;
  top: 108px;
  animation-delay: 0s;
}

.deco--2 {
  right: 118px;
  top: 220px;
  font-size: 22px;
  animation-delay: 1.6s;
}

.deco--3 {
  left: 40px;
  top: 210px;
  font-size: 20px;
  animation-delay: 3s;
}

.deco--4 {
  right: 70px;
  bottom: 150px;
  animation-delay: 4.4s;
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg);
  }
  50% {
    transform: translateY(-14px) rotate(8deg);
  }
}

.login-box {
  position: relative;
  z-index: 1;
  width: min(1060px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 22px;
  align-items: stretch;
}

/* ---------- 左侧品牌面板 ---------- */
.intro {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 32px 34px 28px;
  border-radius: 22px;
  color: #fff;
  background: linear-gradient(155deg, #065f46 0%, #047857 46%, #059669 100%);
  box-shadow: 0 20px 44px rgba(6, 95, 70, 0.28);
  animation: rise 0.55s ease both;
}

.intro::before {
  content: '';
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  right: -110px;
  top: -120px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.26), transparent 70%);
}

.intro::after {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  left: -90px;
  bottom: -120px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
}

.intro > * {
  position: relative;
  z-index: 1;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 19px;
  color: #047857;
  background: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text b {
  font-size: 16px;
  letter-spacing: 0.5px;
}

.brand-text small {
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.62);
}

.brand-pill {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.intro h1 {
  font-size: 38px;
  line-height: 1.28;
  margin: 26px 0 12px;
  color: #fff;
  letter-spacing: 1px;
}

.intro h1::after {
  width: 74px;
  height: 4px;
  margin-top: 12px;
  border-radius: 2px;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.25));
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 22px;
  display: grid;
  gap: 9px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.9);
  opacity: 0;
  animation: rise 0.5s ease both;
}

/* 卖点逐条错峰浮现 */
.feature-list li:nth-child(1) { animation-delay: 0.15s; }
.feature-list li:nth-child(2) { animation-delay: 0.25s; }
.feature-list li:nth-child(3) { animation-delay: 0.35s; }
.feature-list li:nth-child(4) { animation-delay: 0.45s; }

.feature-list li:hover {
  color: #fff;
  transform: translateX(4px);
  transition: transform 0.2s;
}

.feature-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 13px;
  flex-shrink: 0;
}

.metric-row {
  display: flex;
  gap: 28px;
  padding: 14px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.metric-row > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-row b {
  font-size: 24px;
  line-height: 1.1;
}

.metric-row span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}

.showcase {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 20px;
}

.mini-card {
  width: 66px;
  height: 66px;
  border-radius: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  transition: transform 0.2s;
}

.mini-card:hover {
  transform: translateY(-4px) rotate(-2deg);
}

.mini-emoji {
  font-size: 26px;
  line-height: 1;
}

.mini-card small {
  font-size: 10px;
  color: #fff;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 15px;
}

.showcase-label {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
  text-align: right;
}

.pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7bdba0;
  box-shadow: 0 0 0 4px rgba(123, 219, 160, 0.22);
}

/* ---------- 右侧登录卡 ---------- */
.form-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 30px 24px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card);
  box-shadow: 0 20px 46px rgba(6, 78, 59, 0.12);
  animation: rise 0.55s 0.08s ease both;
}

.hello-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: var(--primary-bg);
  border: 1px solid #bfe8d4;
  color: var(--primary-dark);
  font-size: 12px;
}

.card-head h2 {
  margin: 0 0 4px;
  font-size: 23px;
  letter-spacing: 0.5px;
}

.card-head h2::after {
  width: 34px;
  height: 3px;
  margin-top: 8px;
}

.card-head .muted {
  margin: 6px 0 0;
  font-size: 13px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 2px 12px;
  border-radius: 10px;
  background: #fafcfa;
  box-shadow: 0 0 0 1px var(--border) inset;
  transition: box-shadow 0.18s, background 0.18s;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #a7d9c3 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: 0 0 0 1px var(--primary) inset, 0 0 0 4px rgba(0, 181, 120, 0.12);
}

.login-form :deep(.el-input__inner) {
  height: 42px;
  font-size: 14px;
}

.login-form :deep(.el-input__prefix) {
  color: var(--muted);
  font-size: 15px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: -2px 0 16px;
}

.form-row :deep(.el-checkbox) {
  margin-right: 0;
}

.submit {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 46px;
  font-size: 15px;
  letter-spacing: 6px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #00c185, #009260);
  box-shadow: 0 8px 20px rgba(0, 181, 120, 0.28);
  transition: transform 0.15s, box-shadow 0.15s;
}

/* 登录按钮扫光效果 */
.submit::after {
  content: '';
  position: absolute;
  top: 0;
  left: -80%;
  width: 50%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-20deg);
  animation: shine 3.2s 1s ease-in-out infinite;
}

@keyframes shine {
  0% {
    left: -80%;
  }
  55%,
  100% {
    left: 130%;
  }
}

.submit:not(.is-disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 181, 120, 0.34);
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 14px;
  color: var(--muted);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px dashed var(--border);
}

.quick {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--primary-dark);
  border-color: #bfe8d4;
  background: #f2fbf7;
}

.quick:not(.is-disabled):hover {
  color: #fff;
  border-color: var(--primary);
  background: var(--primary);
}

.foot {
  position: relative;
  z-index: 1;
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: var(--muted);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro,
  .form-card,
  .feature-list li {
    animation: none;
  }

  .feature-list li {
    opacity: 1;
  }

  .blob--1,
  .blob--2,
  .deco,
  .submit::after {
    animation: none;
  }

  .mini-card {
    transition: none;
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .login-page {
    padding: 22px 16px 16px;
    justify-content: flex-start;
  }

  .login-box {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .intro {
    padding: 22px 22px 20px;
    border-radius: 18px;
  }

  .intro h1 {
    font-size: 27px;
    margin: 16px 0 8px;
  }

  .feature-list,
  .metric-row,
  .showcase {
    display: none;
  }

  .form-card {
    padding: 24px 20px 20px;
    border-radius: 18px;
  }

  .foot {
    margin-top: 16px;
  }
}

@media (max-width: 420px) {
  .brand-pill {
    display: none;
  }

  .card-head h2 {
    font-size: 21px;
  }

  .submit {
    letter-spacing: 4px;
  }
}
</style>
