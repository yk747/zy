// ============================================================
// store/user.js —— Pinia 用户仓库（题目 T6：登录态仓库 + persist 持久化）
// 登录成功后把学号/昵称写进仓库，顶部导航、发布商品、个人中心都从这里取。
// persist: true —— 刷新页面登录态还在；退出登录时清空。
//
// 登录状态（token）单独存，方便路由守卫直接读取：
//   · 勾选「下次自动登录」→ localStorage    → 关掉浏览器 / 重启项目仍然有效
//   · 不勾选            → sessionStorage → 关闭浏览器后需重新登录
// ============================================================
import { defineStore } from 'pinia'

export const TOKEN_KEY = 'campus-market:token'

// 守卫统一从这里读 token，两种存储都认
export function readToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '', // 对应 db.json 里 users 的 id，发布商品时作为 sellerId
    name: '',
    dorm: '',
    phone: ''
  }),
  getters: {
    isLogin: (state) => Boolean(state.id && state.name),
    initial: (state) => (state.name ? state.name.slice(0, 1).toUpperCase() : '客')
  },
  actions: {
    // user 是从接口（db.json 的 users）里查出来的账号对象
    // remember = true：长期保持登录；false：只在本次浏览器会话有效
    login(user, remember = true) {
      this.id = user.id
      this.name = user.name
      this.dorm = user.dorm || ''
      this.phone = user.phone || ''

      clearToken()
      const token = `campus-market-token-${Date.now()}`
      if (remember) localStorage.setItem(TOKEN_KEY, token)
      else sessionStorage.setItem(TOKEN_KEY, token)
    },
    logout() {
      this.id = ''
      this.name = ''
      this.dorm = ''
      this.phone = ''
      clearToken()
    }
  },
  persist: true
})
