// ============================================================
// store/favorite.js —— Pinia 收藏仓库（题目 F5：跨页面共享 + persist）
// 只存商品 id 列表，广场卡片、详情页、个人中心共用同一份收藏状态。
// ============================================================
import { defineStore } from 'pinia'

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    ids: []
  }),
  getters: {
    count: (state) => state.ids.length
  },
  actions: {
    has(id) {
      return this.ids.some((item) => String(item) === String(id))
    },
    // 切换收藏：返回 true 表示已收藏，false 表示已取消
    toggle(id) {
      const key = String(id)
      if (this.has(key)) {
        this.ids = this.ids.filter((item) => String(item) !== key)
        return false
      }
      this.ids.push(key)
      return true
    },
    remove(id) {
      this.ids = this.ids.filter((item) => String(item) !== String(id))
    },
    clear() {
      this.ids = []
    }
  },
  persist: true
})
