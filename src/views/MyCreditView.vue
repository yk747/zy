<!-- ============================================================
  MyCreditView.vue —— 信用档案 + 交易数据看板
  评分来自 community.js 的评价数据；交易数据按当前用户订单统计。
  ============================================================ -->
<template>
  <div class="credit-wrap">
    <div class="credit-hero">
      <el-avatar :size="64" class="hero-avatar">{{ me.name?.slice(0, 1) || '同' }}</el-avatar>
      <div class="hero-main">
        <h2>{{ me.name || '同学' }} <el-tag v-if="me.verified !== false" type="success" size="small" effect="plain"><el-icon><CircleCheck /></el-icon>实名认证</el-tag></h2>
        <p class="small muted">{{ me.signature || '这个人很懒，还没有写签名～' }}</p>
        <p class="small muted">{{ me.dorm || '校内当面交付' }}</p>
      </div>
      <div class="hero-score">
        <div class="score-num">{{ rating.score }}</div>
        <el-rate :model-value="Number(rating.score)" disabled size="small" />
        <div class="small muted">{{ rating.count }} 条评价</div>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric" v-for="m in metrics" :key="m.label">
        <div class="metric-value">{{ m.value }}</div>
        <div class="metric-label">{{ m.label }}</div>
      </div>
    </div>

    <h3 class="section-title">交易数据看板</h3>
    <div class="board-grid">
      <div class="board card">
        <div class="board-head"><span>买入与卖出</span><span class="small muted">累计成交金额</span></div>
        <div class="board-row">
          <div class="board-cell">
            <span class="small muted">买入支出</span>
            <b class="price buy">￥{{ buyAmount.toFixed(0) }}</b>
            <span class="small muted">{{ boughtDone.length }} 笔已完成订单</span>
          </div>
          <div class="board-cell">
            <span class="small muted">卖出收入</span>
            <b class="price sell">￥{{ sellAmount.toFixed(0) }}</b>
            <span class="small muted">{{ soldDone.length }} 笔已完成订单</span>
          </div>
        </div>
        <div class="bar">
          <div class="bar-buy" :style="{ width: buyPercent + '%' }"></div>
          <div class="bar-sell" :style="{ width: (100 - buyPercent) + '%' }"></div>
        </div>
        <div class="bar-legend"><span>买入 {{ buyPercent }}%</span><span>卖出 {{ 100 - buyPercent }}%</span></div>
      </div>

      <div class="board card">
        <div class="board-head"><span>成交效率</span><span class="small muted">我的订单</span></div>
        <div class="eff-row">
          <div class="eff-item"><b>{{ myOrders.length }}</b><span class="small muted">全部订单</span></div>
          <div class="eff-item"><b>{{ doneOrders.length }}</b><span class="small muted">已完成</span></div>
          <div class="eff-item"><b>{{ pendingOrders.length }}</b><span class="small muted">待面交</span></div>
          <div class="eff-item"><b>{{ doneRate }}%</b><span class="small muted">完成率</span></div>
        </div>
      </div>
    </div>

    <h3 class="section-title">收到的评价</h3>
    <div v-if="reviews.length" class="review-list">
      <div v-for="item in reviews" :key="item.id" class="review-item">
        <div class="review-top">
          <b>{{ reviewFrom(item) }}</b>
          <el-rate :model-value="item.rating" disabled size="small" />
          <span class="small muted">{{ shortTime(item.createdAt) }}</span>
        </div>
        <p>{{ item.content }}</p>
      </div>
    </div>
    <el-empty v-else description="还没有收到评价，完成交易后邀请对方评价吧" :image-size="70" />
  </div>
</template>

<script>
import { getRating, getReviews } from '../api/community'
import { useUserStore } from '../store/user'
import { useOrderStore } from '../store/order'

export default {
  name: 'MyCreditView',
  computed: {
    me() {
      return useUserStore()
    },
    orderStore() {
      return useOrderStore()
    },
    myOrders() {
      return this.orderStore.myOrders(this.me.id)
    },
    soldOrders() {
      return this.orderStore.mySoldOrders(this.me.id)
    },
    doneOrders() {
      return this.myOrders.filter((o) => o.status === '已完成')
    },
    pendingOrders() {
      return this.myOrders.filter((o) => o.status === '待面交')
    },
    boughtDone() {
      return this.doneOrders
    },
    soldDone() {
      return this.soldOrders.filter((o) => o.status === '已完成')
    },
    buyAmount() {
      return this.boughtDone.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    },
    sellAmount() {
      return this.soldDone.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    },
    buyPercent() {
      const total = this.buyAmount + this.sellAmount
      return total ? Math.round((this.buyAmount / total) * 100) : 50
    },
    doneRate() {
      return this.myOrders.length ? Math.round((this.doneOrders.length / this.myOrders.length) * 100) : 0
    },
    rating() {
      return getRating(this.me.id)
    },
    reviews() {
      return getReviews(this.me.id)
    },
    metrics() {
      return [
        { label: '好评率', value: this.rating.goodRate + '%' },
        { label: '评价数', value: this.rating.count },
        { label: '完成订单', value: this.doneOrders.length },
        { label: '售出宝贝', value: this.soldDone.length }
      ]
    }
  },
  async mounted() {
    try {
      await this.orderStore.fetchOrders()
    } catch {
      /* api 层已降级 */
    }
  },
  methods: {
    reviewFrom(item) {
      return item.role === 'seller' ? '买家' : '卖家' + (item.fromId ? ` (${item.fromId})` : '')
    },
    shortTime(value) {
      if (!value) return ''
      const date = new Date(value)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.credit-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.hero-avatar {
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-size: 22px;
  font-weight: 600;
}

.hero-main {
  flex: 1;
  min-width: 0;
}

.hero-main h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  margin: 0 0 6px;
}

.hero-main p {
  margin: 2px 0;
}

.hero-score {
  text-align: center;
}

.score-num {
  font-size: 34px;
  font-weight: 700;
  color: var(--primary-dark, #0f6e56);
  line-height: 1;
  margin-bottom: 4px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.metric {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-dark, #0f6e56);
}

.metric-label {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.section-title {
  font-size: 15px;
  margin: 18px 0 10px;
}

.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.board {
  padding: 16px 18px;
}

.board-head {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
  margin-bottom: 14px;
}

.board-row {
  display: flex;
  gap: 20px;
}

.board-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-cell .price {
  font-size: 22px;
}

.price.buy {
  color: #d97706;
}

.price.sell {
  color: var(--primary-dark, #0f6e56);
}

.bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 16px;
  background: var(--border);
}

.bar-buy {
  background: #f59e0b;
}

.bar-sell {
  background: var(--primary, #10b981);
}

.bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
}

.eff-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
}

.eff-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eff-item b {
  font-size: 22px;
  color: var(--text);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
}

.review-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.review-top .small {
  margin-left: auto;
}

.review-item p {
  margin: 0;
  font-size: 13px;
  color: var(--text-soft);
}

@media (max-width: 900px) {
  .metric-grid,
  .board-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .metric-grid,
  .board-grid {
    grid-template-columns: 1fr;
  }
}
</style>
