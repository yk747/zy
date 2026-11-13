<!-- ============================================================
  MyOrdersView.vue —— 我的订单（题目 E7：订单模拟的查看端）
  ① computed 按 buyerId 过滤"我买到的"，按 items.sellerId 找"我卖出的"
  ② "确认完成"走 PUT /orders/:id 把状态从 待面交 → 已完成
  ============================================================ -->
<template>
  <div class="my-orders">
    <el-tabs v-model="tab">
      <el-tab-pane label="我买到的" name="bought" />
      <el-tab-pane label="我卖出的" name="sold" />
    </el-tabs>

    <div v-loading="loading" class="orders-area" element-loading-text="正在加载订单…">
      <template v-if="currentOrders.length">
        <div v-for="order in currentOrders" :key="order.id" class="order-item">
          <div class="head">
            <span class="order-no">订单号 <b>{{ order.orderNo }}</b></span>
            <span class="small muted">{{ formatTime(order.createdAt) }}</span>
            <el-tag :type="order.status === '已完成' ? 'success' : 'warning'" size="small">
              {{ order.status }}
            </el-tag>
          </div>

          <div v-for="item in order.items" :key="item.goodsId" class="order-goods" @click="goDetail(item.goodsId)">
            <div class="cover" :style="{ background: item.gradient }">{{ item.emoji }}</div>
            <div class="goods-main">
              <b>{{ item.title }}</b>
              <span class="small muted">
                {{ tab === 'bought' ? `卖家：${item.sellerName}` : `买家：${order.buyerName}` }}
              </span>
            </div>
            <span class="price">￥{{ Number(item.price).toFixed(0) }}</span>
          </div>

          <div class="foot">
            <span class="small muted">
              <el-icon><Location /></el-icon>
              面交地点：{{ order.place }} · 联系方式：{{ order.contact }}
              <template v-if="order.note"> · 备注：{{ order.note }}</template>
            </span>
            <span class="total">
              合计 <b class="price">￥{{ Number(order.total).toFixed(0) }}</b>
              <el-button
                v-if="tab === 'bought' && order.status === '待面交'"
                type="primary"
                size="small"
                :loading="confirmingId === order.id"
                @click="confirmOrder(order)"
              >
                确认完成
              </el-button>
            </span>
          </div>
        </div>
      </template>

      <el-empty v-else-if="!loading" :description="tab === 'bought' ? '还没有买到闲置，先去广场逛逛' : '还没有同学买你的闲置，多发布几件试试'">
        <el-button type="primary" @click="$router.push(tab === 'bought' ? '/market' : '/publish')">
          {{ tab === 'bought' ? '去逛广场' : '去发布闲置' }}
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../store/order'
import { useUserStore } from '../store/user'

export default {
  name: 'MyOrdersView',
  data() {
    return {
      tab: 'bought',
      loading: false,
      confirmingId: ''
    }
  },
  computed: {
    me() {
      return useUserStore()
    },
    boughtOrders() {
      return useOrderStore().myOrders(this.me.id)
    },
    soldOrders() {
      return useOrderStore().mySoldOrders(this.me.id)
    },
    currentOrders() {
      return this.tab === 'bought' ? this.boughtOrders : this.soldOrders
    }
  },
  async mounted() {
    this.loading = true
    try {
      await useOrderStore().fetchOrders()
    } catch {
      ElMessage.error('订单加载失败，请稍后刷新重试')
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatTime(value) {
      if (!value) return '—'
      const date = new Date(value)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    goDetail(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    },
    // 面交完成：PUT 修改状态（订单状态流转 待面交 → 已完成）
    async confirmOrder(order) {
      this.confirmingId = order.id
      try {
        await useOrderStore().completeOrder(order.id)
        ElMessage.success('订单已完成，记得给卖家一个好评')
      } catch (err) {
        ElMessage.error(err.message || '操作失败，请稍后再试')
      } finally {
        this.confirmingId = ''
      }
    }
  }
}
</script>

<style scoped>
.orders-area {
  min-height: 220px;
}

.order-item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 18px;
  margin-bottom: 12px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border);
}

.order-no {
  font-size: 13px;
  color: var(--muted);
}

.order-no b {
  color: var(--text);
  margin-left: 4px;
}

.order-no,
.head .small {
  margin-right: auto;
}

.order-goods {
  display: grid;
  grid-template-columns: 56px 1fr 80px;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
}

.cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 26px;
}

.goods-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.goods-main b {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.foot .small {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.total {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
