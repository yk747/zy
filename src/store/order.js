// ============================================================
// store/order.js —— Pinia 订单仓库（题目 E7：订单模拟，改数据走 actions）
// 订单数据在 json-server 的 orders 里，action 里发请求再落到 state，
// 顶部角标、个人中心"我的订单"读的都是同一份 state。
// ============================================================
import { defineStore } from 'pinia'
import {
  fetchOrders as fetchOrdersApi,
  createOrder as createOrderApi,
  updateOrder as updateOrderApi
} from '../api/goods'

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    loading: false
  }),
  getters: {
    orderCount: (state) => state.orders.length,
    // 我买到的订单
    myOrders: (state) => (buyerId) =>
      state.orders.filter((order) => String(order.buyerId) === String(buyerId)),
    // 我卖出的订单（订单项里 sellerId 等于我）
    mySoldOrders: (state) => (sellerId) =>
      state.orders.filter((order) =>
        order.items.some((item) => String(item.sellerId) === String(sellerId))
      ),
    // 待面交订单数（顶部角标）
    pendingCount: (state) => state.orders.filter((order) => order.status === '待面交').length
  },
  actions: {
    // 拉取订单：async action 里 await 请求再写进 state
    async fetchOrders() {
      this.loading = true
      try {
        this.orders = await fetchOrdersApi()
        return this.orders
      } finally {
        this.loading = false
      }
    },
    // 下单：POST 到 json-server，服务器返回带 id/orderNo 的完整订单
    async placeOrder(payload) {
      const order = await createOrderApi(payload)
      this.orders.unshift(order)
      return order
    },
    // 面交完成：PUT 修改订单状态
    async completeOrder(id) {
      const hit = this.orders.find((order) => String(order.id) === String(id))
      if (!hit) return null
      const updated = await updateOrderApi(id, { ...hit, status: '已完成' })
      const index = this.orders.findIndex((order) => String(order.id) === String(id))
      if (index !== -1) this.orders.splice(index, 1, updated)
      return updated
    }
  }
})
