<!-- ============================================================
  MyOrdersView.vue —— 我的订单（题目 E7：订单模拟的查看端）
  ① computed 按 buyerId 过滤"我买到的"，按 items.sellerId 找"我卖出的"
  ② "确认完成"走 PUT /orders/:id 把状态从 待面交 → 已完成
  ============================================================ -->
<template>
  <div class="my-orders">
    <el-tabs v-model="tab">
      <el-tab-pane label="我购买的" name="bought" />
      <el-tab-pane label="我售出的" name="sold" />
    </el-tabs>

    <div v-loading="loading" class="orders-area" element-loading-text="正在加载订单数据…">
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
            <div class="cover cover-art" :style="{ background: item.gradient }">
              <GoodsImage :goods="item" emoji-size="26px" />
            </div>
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
              交付地点：{{ order.place }} · 联系电话：{{ order.contact }}
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
                确认收货
              </el-button>
              <template v-if="order.status === '已完成'">
                <el-button
                  v-if="!hasReviewed(order.id, me.id, tab === 'bought' ? 'buyer' : 'seller')"
                  type="success"
                  plain
                  size="small"
                  @click="openReview(order)"
                >
                  <el-icon><Star /></el-icon>评价
                </el-button>
                <el-tag v-else size="small" type="info" effect="plain">已评价</el-tag>
                <el-button
                  type="danger"
                  plain
                  size="small"
                  :loading="deletingId === order.id"
                  @click="deleteOrder(order)"
                >
                  删除订单
                </el-button>
              </template>
            </span>
          </div>
        </div>
      </template>

      <el-empty v-else-if="!loading" :description="tab === 'bought' ? '暂无购买记录，去集市挑选心动好物' : '暂无售出记录，丰富宝贝信息可提升曝光'">
        <el-button type="primary" @click="$router.push(tab === 'bought' ? '/market' : '/publish')">
          {{ tab === 'bought' ? '去逛集市' : '去发布宝贝' }}
        </el-button>
      </el-empty>
    </div>

    <!-- 交易评价弹窗 -->
    <ReviewDialog
      v-model="reviewVisible"
      :order="reviewOrder"
      :goods="reviewGoods"
      :target-id="reviewTarget.id"
      :target-name="reviewTarget.name"
      :from-id="me.id"
      :role="tab === 'bought' ? 'buyer' : 'seller'"
      @submitted="onReviewed"
    />
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import GoodsImage from '../components/GoodsImage.vue'
import ReviewDialog from '../components/ReviewDialog.vue'
import { hasReviewed, addNotification } from '../api/community'
import { useOrderStore } from '../store/order'
import { useUserStore } from '../store/user'

export default {
  name: 'MyOrdersView',
  components: { GoodsImage, ReviewDialog },
  data() {
    return {
      tab: 'bought',
      loading: false,
      confirmingId: '',
      deletingId: '',
      reviewVisible: false,
      reviewOrder: {},
      reviewGoods: {},
      reviewTarget: {}
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
    hasReviewed,
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
        ElMessage.success('已确认收货，交易完成，感谢您的信任')
      } catch (err) {
        ElMessage.error(err.message || '操作失败，请稍后再试')
      } finally {
        this.confirmingId = ''
      }
    },
    // 打开评价弹窗：根据"我买到的/我售出的"确定评价对象
    openReview(order) {
      const item = (order.items || [])[0] || {}
      this.reviewOrder = order
      this.reviewGoods = item
      if (this.tab === 'bought') {
        // 我买到的 → 评价卖家（取订单项里的 sellerId/sellerName）
        this.reviewTarget = { id: item.sellerId, name: item.sellerName }
      } else {
        // 我售出的 → 评价买家
        this.reviewTarget = { id: order.buyerId, name: order.buyerName }
      }
      this.reviewVisible = true
    },
    onReviewed() {
      // 评价成功后给对方生成一条通知（本地）
      const targetId = this.reviewTarget.id
      addNotification(targetId, {
        type: 'review',
        title: '收到一条新评价',
        content: `${this.me.name} 评价了你们的交易，快去信用档案看看吧`
      })
    },
    // 已成交订单：二次确认后删除，记录从列表中移除
    async deleteOrder(order) {
      try {
        await ElMessageBox.confirm(
          `确定删除订单 ${order.orderNo} 吗？该订单的成交记录将被移除且无法恢复。`,
          '删除订单',
          { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
        )
      } catch {
        return
      }
      this.deletingId = order.id
      try {
        await useOrderStore().removeOrder(order.id)
        ElMessage.success('订单已删除')
      } catch (err) {
        ElMessage.error(err.message || '删除失败，请稍后再试')
      } finally {
        this.deletingId = ''
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
  padding: 16px 20px;
  margin-bottom: 14px;
  transition: box-shadow 0.2s ease;
}

.order-item:hover {
  box-shadow: var(--shadow-hover);
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 4px;
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
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 26px;
  overflow: hidden;
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
  .head {
    flex-wrap: wrap;
    gap: 6px 10px;
  }

  .order-no,
  .head .small {
    margin-right: 0;
  }

  .order-no {
    flex: 1;
  }

  /* 时间单独一行，避免订单号 / 时间 / 状态标签三者挤在一行溢出 */
  .head .small {
    order: 3;
    flex-basis: 100%;
  }

  .foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .total {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
