// ============================================================
// store/cart.js —— Pinia 购物车仓库（题目 F5 / T6）
//   ① defineStore 一个文件一个仓库，天然模块化
//   ② 改数据一律走 actions（加购 / 移除 / 清空）
//   ③ persist: true —— 刷新页面购物车不丢
// 二手闲置都是孤品，一件商品最多买一次，所以不需要数量增减。
// ============================================================
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    // items: { id, title, price, emoji, gradient, sellerId, sellerName }
    items: []
  }),
  getters: {
    totalCount: (state) => state.items.length,
    totalPrice: (state) =>
      Number(state.items.reduce((sum, item) => sum + Number(item.price || 0), 0).toFixed(2)),
    isEmpty: (state) => state.items.length === 0
  },
  actions: {
    // 加购：已加过（孤品）返回 false，让页面提示"已经在购物车里了"
    add(goods, sellerName = '') {
      if (this.items.some((item) => String(item.id) === String(goods.id))) return false
      this.items.push({
        id: goods.id,
        title: goods.title,
        price: Number(goods.price),
        emoji: goods.emoji || '📦',
        gradient: goods.gradient || 'linear-gradient(135deg, #6ee7b7, #059669)',
        sellerId: goods.sellerId || '',
        sellerName
      })
      return true
    },
    has(id) {
      return this.items.some((item) => String(item.id) === String(id))
    },
    remove(id) {
      this.items = this.items.filter((item) => String(item.id) !== String(id))
    },
    clear() {
      this.items = []
    }
  },
  // pinia-plugin-persistedstate 的配置：默认 key 就是仓库名 cart
  persist: true
})
