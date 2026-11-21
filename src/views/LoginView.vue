<!-- ============================================================
  LoginView.vue —— 认证中心（路由守卫的拦截目的地，题目 F1）
  商业化重构：验证码 / 密码双模式登录 + 注册 + 找回密码 + 第三方入口
  左侧品牌沉浸区（信任背书）+ 右侧极简登录区；功能逻辑完整可运行。
  知识点：
   · el-form :model + :rules 表单校验（6.2）
   · v-focus 自定义指令自动聚焦（4.5）
   · v-model.trim 修饰符（2.x）
   · el-dialog 弹窗承载注册 / 找回密码
   · 登录成功写 token + Pinia 用户仓库，编程式导航跳回原页面（5.x / 7.x）
  ============================================================ -->
<template>
  <div class="auth-shell">
    <!-- ============ 左侧：品牌沉浸区 ============ -->
    <aside class="brand-side">
      <div class="ambient ambient--1" aria-hidden="true"></div>
      <div class="ambient ambient--2" aria-hidden="true"></div>
      <div class="grid-mesh" aria-hidden="true"></div>
      <div class="orbit" aria-hidden="true"><i></i><i></i><i></i></div>

      <div class="brand-inner">
        <header class="brand-header">
          <div class="mark"><span>集</span></div>
          <div class="brand-copy">
            <strong>校园二手集市</strong>
            <small>CAMPUS MARKETPLACE</small>
          </div>
          <span class="verified"><el-icon><CircleCheck /></el-icon> 官方认证平台</span>
        </header>

        <section class="hero">
          <span class="eyebrow">SMARTER CAMPUS TRADING</span>
          <h1>让闲置好物<br />在校园里<span class="accent-word">继续发光</span></h1>
          <p>实名认证的校园循环交易平台<br />发布、淘货、交易，每一步都安心高效。</p>
        </section>

        <div class="showcase" aria-hidden="true">
          <div
            v-for="(item, i) in showcase"
            :key="item.id"
            class="show-item"
            :class="'show-item--' + (i + 1)"
            :style="{ background: item.gradient }"
          >
            <span class="show-emoji">{{ item.emoji }}</span>
            <div class="show-meta">
              <small>{{ item.title }}</small>
              <b>￥{{ Number(item.price).toFixed(0) }}</b>
            </div>
          </div>
          <span class="show-float show-float--a"><el-icon><CircleCheck /></el-icon> 资金担保</span>
          <span class="show-float show-float--b"><el-icon><Shop /></el-icon> 平台验货</span>
        </div>

        <ul class="values">
          <li>
            <span class="v-icon"><el-icon><Tickets /></el-icon></span>
            <div><b>资金担保</b><small>确认收货后放款</small></div>
          </li>
          <li>
            <span class="v-icon"><el-icon><CircleCheck /></el-icon></span>
            <div><b>平台验货</b><small>成色分级看得见</small></div>
          </li>
          <li>
            <span class="v-icon"><el-icon><Star /></el-icon></span>
            <div><b>信用体系</b><small>履约评分可追溯</small></div>
          </li>
          <li>
            <span class="v-icon"><el-icon><ChatDotRound /></el-icon></span>
            <div><b>售后保障</b><small>纠纷平台先行处理</small></div>
          </li>
        </ul>

        <footer class="brand-bottom">
          <div class="stat"><b>{{ metrics.goods }}</b><span>在售好物</span></div>
          <div class="stat"><b>{{ metrics.categories }}</b><span>覆盖品类</span></div>
          <div class="stat"><b>{{ metrics.users }}</b><span>认证同学</span></div>
          <div class="avatars">
            <span v-for="(emoji, n) in ['🎓', '📚', '🎧', '🏀']" :key="n">{{ emoji }}</span>
            <small>同学们都在用</small>
          </div>
        </footer>
      </div>
    </aside>

    <!-- ============ 右侧：认证区 ============ -->
    <main class="form-side">
      <div class="form-shell">
        <div class="mini-brand">
          <span class="mini-mark">集</span>
          <b>校园二手集市</b>
        </div>

        <div class="form-head">
          <h2>欢迎回来</h2>
          <p>{{ greeting }}，登录继续你的校园淘货之旅</p>
        </div>

        <!-- 登录方式切换 -->
        <div class="mode-tabs" role="tablist" aria-label="登录方式">
          <button
            type="button"
            role="tab"
            :aria-selected="activeMode === 'code'"
            :class="['mode-tab', { active: activeMode === 'code' }]"
            @click="switchMode('code')"
          >
            验证码登录
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMode === 'password'"
            :class="['mode-tab', { active: activeMode === 'password' }]"
            @click="switchMode('password')"
          >
            密码登录
          </button>
        </div>

        <el-form
          ref="formRef"
          class="login-form"
          :model="form"
          :rules="activeRules"
          hide-required-asterisk
          @submit.prevent
        >
          <template v-if="activeMode === 'code'">
            <el-form-item prop="phone">
              <el-input
                v-focus
                v-model.trim="form.phone"
                size="large"
                maxlength="11"
                inputmode="numeric"
                placeholder="请输入手机号"
                aria-label="手机号"
                autocomplete="tel"
                :disabled="loading"
                clearable
                @keyup.enter="submit"
              >
                <template #prefix><el-icon><Iphone /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item prop="code">
              <el-input
                v-model.trim="form.code"
                size="large"
                maxlength="6"
                inputmode="numeric"
                placeholder="请输入验证码"
                aria-label="验证码"
                autocomplete="one-time-code"
                :disabled="loading"
                @keyup.enter="submit"
              >
                <template #prefix><el-icon><Tickets /></el-icon></template>
                <template #suffix>
                  <el-button
                    link
                    type="primary"
                    class="code-btn"
                    :disabled="loading || smsCountdown > 0"
                    @click="sendCode"
                  >
                    {{ smsCountdown > 0 ? smsCountdown + 's 后重发' : '获取验证码' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </template>

          <template v-else>
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
          </template>

          <div class="form-row">
            <el-checkbox v-model="agreed" :disabled="loading">我已阅读并同意用户协议与隐私政策</el-checkbox>
            <el-button link type="primary" size="small" @click="openReset">忘记密码？</el-button>
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

        <!-- 第三方登录占位 -->
        <div class="divider"><span>或使用以下方式</span></div>
        <div class="third-party" aria-label="第三方登录">
          <button type="button" class="tp tp--wechat" @click="thirdPartyTip('微信')">微</button>
          <button type="button" class="tp tp--qq" @click="thirdPartyTip('QQ')">Q</button>
          <button type="button" class="tp tp--alipay" @click="thirdPartyTip('支付宝')">支</button>
        </div>

        <!-- 注册 / 一键登录为次要入口 -->
        <div class="form-links">
          <el-button link type="primary" @click="openRegister">没有账号？免费注册</el-button>
          <span class="dot">·</span>
          <el-button link @click="quickLogin">一键登录</el-button>
        </div>

        <p class="legal">
          登录即表示同意 <a href="#" @click.prevent="showAgreement('terms')">《用户协议》</a>
          与 <a href="#" @click.prevent="showAgreement('privacy')">《隐私政策》</a>
        </p>
      </div>

      <footer class="form-foot">© 2026 校园二手集市 · 让闲置更有价值</footer>
    </main>

    <!-- ============ 注册弹窗 ============ -->
    <el-dialog v-model="registerVisible" title="创建校园账号" width="440px" class="auth-dialog" align-center>
      <el-form ref="regFormRef" :model="regForm" :rules="regRules" label-position="top" hide-required-asterisk>
        <el-form-item label="昵称" prop="name">
          <el-input v-model.trim="regForm.name" maxlength="12" placeholder="2—12 个字符，作为平台显示名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="regForm.phone" maxlength="11" inputmode="numeric" placeholder="用于验证码登录与账号找回" />
        </el-form-item>
        <el-form-item label="宿舍（选填）" prop="dorm">
          <el-input v-model.trim="regForm.dorm" maxlength="30" placeholder="如：东区 8 号楼 502" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="regForm.password" type="password" show-password maxlength="20" placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="regForm.confirm" type="password" show-password maxlength="20" placeholder="再输入一次密码" />
        </el-form-item>
        <el-form-item prop="agreed">
          <el-checkbox v-model="regForm.agreed">我已阅读并同意用户协议与隐私政策</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="doRegister">注册并登录</el-button>
      </template>
    </el-dialog>

    <!-- ============ 找回密码弹窗 ============ -->
    <el-dialog v-model="resetVisible" title="重置密码" width="420px" class="auth-dialog" align-center>
      <p class="reset-hint">输入注册时使用的手机号，设置新密码后即可登录。</p>
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-position="top" hide-required-asterisk>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="resetForm.phone" maxlength="11" inputmode="numeric" placeholder="请输入注册手机号" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" type="password" show-password maxlength="20" placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm">
          <el-input v-model="resetForm.confirm" type="password" show-password maxlength="20" placeholder="再输入一次新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="doReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import {
  fetchUsers,
  findUserByPhone,
  registerUser,
  resetPassword,
  sendVerifyCode,
  VERIFY_CODE
} from '../api/goods'
import { GOODS_SEED, CATEGORIES, QUICK_ACCOUNT } from '../../shared/goods.js'

const LOGIN_OPTS_KEY = 'campus-market:login-opts'
const PHONE_RE = /^1\d{10}$/

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
    // 箭头函数捕获实例 this，供 async-validator 回调读取当前表单值
    const checkRegConfirm = (_rule, value, callback) => {
      if (!value) return callback(new Error('请再输入一次密码'))
      if (value !== this.regForm.password) return callback(new Error('两次输入的密码不一致'))
      callback()
    }
    const checkResetConfirm = (_rule, value, callback) => {
      if (!value) return callback(new Error('请再输入一次新密码'))
      if (value !== this.resetForm.password) return callback(new Error('两次输入的密码不一致'))
      callback()
    }
    return {
      activeMode: 'code',
      form: { phone: '', code: '', username: '', password: '' },
      ...readLoginOpts(),
      agreed: false,
      loading: false,
      smsCountdown: 0,
      timers: [],
      showcase: [GOODS_SEED[1], GOODS_SEED[5], GOODS_SEED[10]].filter(Boolean),
      // 平台级展示口径，真实项目应来自运营数据接口
      metrics: { goods: '12,600+', categories: CATEGORIES.length, users: '8,600+' },
      codeRules: {
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: PHONE_RE, message: '请输入 11 位手机号', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { len: 6, message: '验证码为 6 位数字', trigger: 'blur' }
        ]
      },
      passwordRules: {
        username: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 12, message: '昵称长度 2—12 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ]
      },
      registerVisible: false,
      registering: false,
      regForm: { name: '', phone: '', dorm: '', password: '', confirm: '', agreed: false },
      regRules: {
        name: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 12, message: '昵称长度 2—12 个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: PHONE_RE, message: '请输入 11 位手机号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请设置密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        confirm: [{ validator: checkRegConfirm, trigger: 'blur' }],
        agreed: [
          {
            validator: (_r, v, cb) => (v ? cb() : cb(new Error('请先同意用户协议与隐私政策'))),
            trigger: 'change'
          }
        ]
      },
      resetVisible: false,
      resetting: false,
      resetForm: { phone: '', password: '', confirm: '' },
      resetRules: {
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: PHONE_RE, message: '请输入 11 位手机号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        confirm: [{ validator: checkResetConfirm, trigger: 'blur' }]
      }
    }
  },
  computed: {
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了，同学'
      if (hour < 12) return '早上好，同学'
      if (hour < 14) return '午安，同学'
      if (hour < 18) return '下午好，同学'
      return '晚上好，同学'
    },
    activeRules() {
      return this.activeMode === 'code' ? this.codeRules : this.passwordRules
    }
  },
  watch: {
    autoLogin() {
      this.saveLoginOpts()
    }
  },
  beforeUnmount() {
    this.timers.forEach((t) => clearInterval(t))
  },
  methods: {
    saveLoginOpts() {
      localStorage.setItem(LOGIN_OPTS_KEY, JSON.stringify({ autoLogin: this.autoLogin }))
    },
    switchMode(mode) {
      if (this.loading || this.activeMode === mode) return
      this.activeMode = mode
      this.agreed = false
      this.$nextTick(() => this.$refs.formRef?.clearValidate())
    },
    thirdPartyTip(name) {
      ElMessage.info(`${name}授权登录即将开放，请使用手机号或密码登录`)
    },
    startCountdown() {
      this.smsCountdown = 60
      const timer = setInterval(() => {
        if (--this.smsCountdown <= 0) {
          clearInterval(timer)
          this.smsCountdown = 0
          this.timers = this.timers.filter((t) => t !== timer)
        }
      }, 1000)
      this.timers.push(timer)
    },
    async sendCode() {
      if (!PHONE_RE.test(this.form.phone)) {
        ElMessage.warning('请先输入正确的 11 位手机号')
        return
      }
      await sendVerifyCode(this.form.phone)
      ElMessage.success(`验证码已发送：${VERIFY_CODE}（60 秒内有效）`)
      this.startCountdown()
    },
    async quickLogin() {
      if (this.loading) return
      this.loading = true
      try {
        const user = await findUserByPhone(QUICK_ACCOUNT.phone)
        if (user) this.finishLogin(user, `登录成功，欢迎回来，${user.name}`)
        else ElMessage.warning('快捷登录暂不可用，请使用手机号或密码登录')
      } catch (err) {
        ElMessage.error(err.message || '登录失败，请稍后再试')
      } finally {
        this.loading = false
      }
    },
    showAgreement(type) {
      const privacy = type === 'privacy'
      ElMessageBox.alert(
        privacy
          ? '我们仅收集完成交易必需的账号与订单信息，不会向第三方出售你的个人数据。'
          : '用户需实名认证后使用平台服务，文明交易、当面验货，共同维护校园社区氛围。',
        privacy ? '隐私政策' : '用户协议',
        { confirmButtonText: '我知道了', type: 'info' }
      )
    },
    openRegister() {
      this.regForm = { name: '', phone: '', dorm: '', password: '', confirm: '', agreed: false }
      this.registerVisible = true
      this.$nextTick(() => this.$refs.regFormRef?.clearValidate())
    },
    async doRegister() {
      const valid = await this.$refs.regFormRef.validate().catch(() => false)
      if (!valid) return
      this.registering = true
      try {
        const user = await registerUser(this.regForm)
        this.registerVisible = false
        this.finishLogin(user, `注册成功，欢迎加入，${user.name}`)
      } catch (err) {
        ElMessage.error(err.message || '注册失败，请稍后再试')
      } finally {
        this.registering = false
      }
    },
    openReset() {
      this.resetForm = { phone: '', password: '', confirm: '' }
      this.resetVisible = true
      this.$nextTick(() => this.$refs.resetFormRef?.clearValidate())
    },
    async doReset() {
      const valid = await this.$refs.resetFormRef.validate().catch(() => false)
      if (!valid) return
      this.resetting = true
      try {
        await resetPassword(this.resetForm.phone, this.resetForm.password)
        this.resetVisible = false
        ElMessage.success('密码已重置，请用新密码登录')
        this.switchMode('password')
      } catch (err) {
        ElMessage.error(err.message || '重置失败，请稍后再试')
      } finally {
        this.resetting = false
      }
    },
    submit() {
      if (this.loading) return
      if (!this.agreed) {
        ElMessage.warning('请先阅读并同意用户协议与隐私政策')
        return
      }
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        this.loading = true
        try {
          const matched =
            this.activeMode === 'code'
              ? await this.loginByCode()
              : await this.loginByPassword()
          if (matched) this.finishLogin(matched, `登录成功，欢迎回来，${matched.name}`)
        } catch (err) {
          ElMessage.error(err.message || '登录失败，请稍后再试')
        } finally {
          this.loading = false
        }
      })
    },
    async loginByCode() {
      if (this.form.code !== VERIFY_CODE) {
        ElMessage.error('验证码不正确，请检查后重试')
        return null
      }
      const user = await findUserByPhone(this.form.phone)
      if (!user) {
        ElMessage.warning('该手机号尚未注册，请先创建账号')
        return null
      }
      return user
    },
    async loginByPassword() {
      const users = await fetchUsers()
      const matched = users.find((user) => user.name === this.form.username)
      if (!matched) {
        ElMessage.error('账号不存在，请核对昵称或点击下方免费注册')
        return null
      }
      if (matched.password !== this.form.password) {
        ElMessage.error('密码不正确，请重新输入')
        return null
      }
      return matched
    },
    finishLogin(user, message) {
      const store = useUserStore()
      store.login(user, this.autoLogin)
      ElMessage.success(message)
      const redirect = this.$route.query.redirect
      const target =
        typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login')
          ? redirect
          : '/market'
      this.$router.replace(target)
    }
  }
}
</script>

<style scoped>
/* ================= 外壳：左右分栏 ================= */
.auth-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
  min-height: 100vh;
}

/* ================= 左侧：品牌沉浸区 ================= */
.brand-side {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 52px 7%;
  color: #fff;
  background:
    radial-gradient(880px 520px at 80% 6%, rgba(45, 205, 145, 0.26), transparent 62%),
    radial-gradient(720px 520px at 2% 96%, rgba(12, 110, 78, 0.42), transparent 60%),
    linear-gradient(155deg, #061c15 0%, #0a3226 52%, #0d4031 100%);
}

.brand-side::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

.ambient--1 {
  width: 420px;
  height: 420px;
  right: -140px;
  top: -160px;
  background: radial-gradient(circle, rgba(80, 230, 170, 0.2), transparent 68%);
}

.ambient--2 {
  width: 300px;
  height: 300px;
  left: -110px;
  bottom: -120px;
  background: radial-gradient(circle, rgba(120, 220, 180, 0.14), transparent 70%);
}

.grid-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: linear-gradient(130deg, #000 12%, transparent 78%);
  -webkit-mask-image: linear-gradient(130deg, #000 12%, transparent 78%);
  pointer-events: none;
}

.orbit {
  position: absolute;
  width: 480px;
  height: 480px;
  right: -180px;
  bottom: -170px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 50%;
  pointer-events: none;
}

.orbit i {
  position: absolute;
  inset: 48px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
}

.orbit i:nth-child(2) {
  inset: 100px;
}

.orbit i:nth-child(3) {
  inset: 150px;
  background: radial-gradient(circle, rgba(90, 230, 170, 0.1), transparent 70%);
  border-color: rgba(255, 255, 255, 0.1);
}

.brand-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: rise-in 0.6s ease both;
}

.mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #065f46;
  background: linear-gradient(145deg, #ffffff, #d9f7e9);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

.mark span {
  font-size: 22px;
  font-weight: 800;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand-copy strong {
  font-size: 17px;
  letter-spacing: 0.5px;
}

.brand-copy small {
  font-size: 9.5px;
  letter-spacing: 2.6px;
  color: rgba(255, 255, 255, 0.5);
}

.verified {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.09);
  font-size: 11px;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.hero {
  margin-top: 40px;
  animation: rise-in 0.6s 0.08s ease both;
}

.eyebrow {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #e7d09a;
}

.hero h1 {
  margin: 14px 0 14px;
  font-size: clamp(34px, 3.6vw, 48px);
  font-weight: 800;
  line-height: 1.24;
  letter-spacing: -1px;
  color: #fff;
}

.hero h1::after {
  display: none;
}

.accent-word {
  background: linear-gradient(100deg, #8ff0c4, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}

.hero p {
  margin: 0;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.62);
}

.showcase {
  position: relative;
  height: 176px;
  margin: 18px 0 26px;
  animation: rise-in 0.6s 0.16s ease both;
}

.show-item {
  position: absolute;
  top: 8px;
  width: 150px;
  height: 148px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.show-item--1 {
  left: 6%;
  transform: rotate(-9deg);
}

.show-item--2 {
  left: 50%;
  top: 0;
  transform: translateX(-50%) scale(1.08);
  z-index: 2;
  box-shadow: 0 24px 44px rgba(0, 0, 0, 0.34), inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

.show-item--3 {
  right: 6%;
  transform: rotate(9deg);
}

.show-emoji {
  font-size: 42px;
  line-height: 1;
  text-align: center;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2));
}

.show-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 9px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(6px);
}

.show-meta small {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-meta b {
  font-size: 15px;
  color: #fff;
}

.show-float {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  font-size: 11px;
  z-index: 3;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}

.show-float--a {
  left: 2%;
  bottom: 2px;
}

.show-float--b {
  right: 2%;
  top: 10px;
}

.values {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 18px;
  animation: rise-in 0.6s 0.24s ease both;
}

.values li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.v-icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 16px;
  color: #a9f0cd;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.values b {
  display: block;
  font-size: 13px;
  margin-bottom: 2px;
}

.values small {
  display: block;
  font-size: 11px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.58);
}

.brand-bottom {
  display: flex;
  align-items: center;
  gap: 26px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  animation: rise-in 0.6s 0.3s ease both;
}

.stat {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.stat b {
  font-size: 22px;
  font-weight: 800;
}

.stat span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
}

.avatars {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.avatars span {
  width: 30px;
  height: 30px;
  margin-left: -8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 2px solid #0d4031;
}

.avatars span:first-child {
  margin-left: 0;
}

.avatars small {
  margin-left: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
  white-space: nowrap;
}

/* ================= 右侧：认证区 ================= */
.form-side {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 40px 6%;
  background: #fff;
}

.form-shell {
  width: 100%;
  max-width: 396px;
  margin: auto;
  padding: 20px 0;
}

.mini-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  animation: rise-in 0.6s ease both;
}

.mini-mark {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(145deg, var(--primary-light), var(--primary-dark));
  box-shadow: 0 6px 14px rgba(0, 181, 120, 0.26);
}

.mini-brand b {
  font-size: 15px;
  letter-spacing: 0.3px;
}

.form-head {
  margin-bottom: 22px;
  animation: rise-in 0.6s 0.06s ease both;
}

.form-head h2 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.6px;
  color: var(--text);
}

.form-head h2::after {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  margin-top: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

.form-head p {
  margin: 12px 0 0;
  font-size: 13.5px;
  color: var(--muted);
}

/* 登录方式 Tab */
.mode-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 22px;
  border-radius: 12px;
  background: #f3f6f4;
  animation: rise-in 0.6s 0.1s ease both;
}

.mode-tab {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-soft);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, box-shadow 0.18s;
}

.mode-tab:hover {
  color: var(--primary-dark);
}

.mode-tab.active {
  color: var(--primary-dark);
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 45, 34, 0.08);
  font-weight: 700;
}

.login-form {
  animation: rise-in 0.6s 0.14s ease both;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 2px 14px;
  border-radius: 12px;
  background: #f8faf9;
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
  height: 46px;
  font-size: 14px;
}

.login-form :deep(.el-input__prefix) {
  color: var(--muted);
  font-size: 16px;
}

.code-btn {
  font-size: 13px;
  white-space: nowrap;
  height: auto;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: -2px 0 22px;
}

.form-row :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
}

.form-row :deep(.el-checkbox__label) {
  font-size: 12px;
  white-space: normal;
  line-height: 1.4;
}

.submit {
  width: 100%;
  height: 50px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-light), var(--primary-dark));
  box-shadow: 0 10px 22px rgba(0, 181, 120, 0.26);
  transition: transform 0.16s, box-shadow 0.16s;
}

.submit:not(.is-disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0, 181, 120, 0.32);
}

.submit:not(.is-disabled):active {
  transform: translateY(0);
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 16px;
  color: var(--muted);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}

.third-party {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.tp {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s, box-shadow 0.16s, color 0.16s;
}

.tp:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(16, 45, 34, 0.12);
}

.tp--wechat {
  color: #09bb07;
}

.tp--qq {
  color: #12b7f5;
}

.tp--alipay {
  color: #1677ff;
}

.form-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 13px;
}

.form-links .dot {
  color: var(--border);
}

.legal {
  margin: 14px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

.legal a {
  color: var(--primary-dark);
  text-decoration: none;
}

.legal a:hover {
  text-decoration: underline;
}

.form-foot {
  margin-top: auto;
  padding-top: 24px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.3px;
  color: var(--muted);
}

/* 弹窗内表单 */
.auth-dialog :deep(.el-dialog__header) {
  padding-bottom: 6px;
}

.auth-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}

.auth-dialog :deep(.el-form-item__label) {
  font-size: 13px;
  padding-bottom: 2px;
}

.reset-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--muted);
}

@keyframes rise-in {
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
  .brand-header,
  .hero,
  .showcase,
  .values,
  .brand-bottom,
  .mini-brand,
  .form-head,
  .mode-tabs,
  .login-form {
    animation: none;
  }
}

/* ================= 响应式 ================= */
@media (max-width: 1180px) {
  .show-item {
    width: 132px;
    height: 132px;
  }

  .show-emoji {
    font-size: 36px;
  }

  .values {
    gap: 12px;
  }

  .brand-bottom {
    gap: 18px;
  }
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .brand-side {
    min-height: auto;
    padding: 30px 6% 34px;
  }

  .brand-inner {
    max-width: 620px;
  }

  .hero {
    margin-top: 24px;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero h1 br {
    display: none;
  }

  .showcase,
  .values {
    display: none;
  }

  .brand-bottom {
    margin-top: 22px;
    padding-top: 16px;
  }

  .form-side {
    min-height: auto;
    padding: 34px 6% 28px;
  }

  .mini-brand {
    margin-bottom: 26px;
  }

  .form-shell {
    margin: 0 auto;
    padding: 0;
  }

  .form-foot {
    margin-top: 32px;
  }
}

@media (max-width: 520px) {
  .brand-side {
    padding: 24px 20px 26px;
  }

  .verified {
    display: none;
  }

  .hero h1 {
    font-size: 27px;
    letter-spacing: -0.3px;
  }

  .hero p {
    font-size: 13px;
  }

  .stat b {
    font-size: 19px;
  }

  .avatars small {
    display: none;
  }

  .form-side {
    padding: 30px 20px 24px;
  }

  .form-head h2 {
    font-size: 28px;
  }

  .submit {
    letter-spacing: 3px;
  }

  .form-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
