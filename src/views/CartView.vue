<!-- ============================================================
  CartView.vue —— 购物车 + 面交下单（题目 F5 / E7）
  购物车是 Pinia 仓库（persist 刷新不丢），下单走订单仓库：
  校验表单 → POST /orders 生成订单记录 → 清空购物车 → 跳我的订单
  二手闲置是孤品，一件只有一份，所以没有数量加减。
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>购物车</h1>
        <p class="sub">看好的闲置先放进车，约好时间地点一次面交全带走。</p>
      </div>
      <div class="head-actions">
        <el-tag :type="serverState.online === false ? 'warning' : 'success'" effect="plain">
          {{ serverState.online === false ? '离线体验' : '在线服务' }}
        </el-tag>
        <el-button @click="$router.push('/market')">
          <el-icon><Plus /></el-icon>继续逛逛
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="serverState.online === false"
      :title="serverState.message"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <div v-if="isEmpty" class="card card--plain empty-card">
      <el-empty description="购物车还是空的，去广场淘几件闲置吧">
        <el-button type="primary" @click="$router.push('/market')">去逛广场</el-button>
      </el-empty>
    </div>

    <template v-else>
      <div class="cart-layout">
        <div class="card card--plain cart-list">
          <div class="list-head">
            <h2>已选闲置（{{ items.length }} 件）</h2>
            <el-button link type="danger" @click="clearAll">清空购物车</el-button>
          </div>

          <div v-for="item in items" :key="item.id" class="cart-item">
            <div class="item-cover" :style="{ background: item.gradient }" @click="goDetail(item.id)">
              {{ item.emoji }}
            </div>

            <div class="item-main">
              <b class="item-name" @click="goDetail(item.id)">{{ item.title }}</b>
              <span class="small muted">卖家：{{ item.sellerName }} · 孤品一件</span>
            </div>

            <div class="subtotal">￥{{ Number(item.price).toFixed(0) }}</div>

            <el-button link type="danger" @click="remove(item.id)">移除</el-button>
          </div>
        </div>

        <aside class="card summary">
          <h2>交易信息</h2>
          <div class="sum-row"><span>闲置件数</span><b>{{ totalCount }} 件</b></div>
          <div class="sum-row"><span>合计金额</span><b class="price">￥{{ totalPrice.toFixed(0) }}</b></div>
          <div class="sum-row"><span>运费</span><b>面交免运费</b></div>
          <el-button type="primary" size="large" class="checkout-btn" @click="openCheckout">
            约面交下单（{{ totalCount }} 件）
          </el-button>
          <p class="small muted store-tip">
            提交后会生成订单记录，请当面验货后再付款给卖家。
          </p>
        </aside>
      </div>
    </template>

    <!-- 面交信息弹窗：表单校验 -->
    <el-dialog v-model="checkoutVisible" title="确认面交信息" width="540px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="联系方式" prop="contact">
          <el-input v-focus v-model.trim="form.contact" maxlength="11" placeholder="手机号，方便卖家联系你" clearable />
        </el-form-item>
        <el-form-item label="面交地点" prop="place">
          <el-input v-model.trim="form.place" placeholder="如：东区食堂门口 / 图书馆二楼" clearable />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" placeholder="选填，如：今晚 7 点后都可以" />
        </el-form-item>
      </el-form>

      <div class="order-preview">
        <span>共 {{ totalCount }} 件闲置 · 校内面交免运费</span>
        <b>合计 ￥{{ totalPrice.toFixed(0) }}</b>
      </div>

      <template #footer>
        <el-button @click="checkoutVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOrder">提交订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '../store/cart'
import { useUserStore } from '../store/user'
import { useOrderStore } from '../store/order'
import { serverState } from '../api/goods'

export default {
  name: 'CartView',
  data() {
    return {
      serverState,
      checkoutVisible: false,
      submitting: false,
      form: {
        contact: '',
        place: '',
        note: ''
      },
      rules: {
        contact: [
          { required: true, message: '请填写联系方式', trigger: 'blur' },
          { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
        ],
        place: [{ required: true, message: '请填写面交地点', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapState(useCartStore, ['items', 'totalCount', 'totalPrice', 'isEmpty']),
    ...mapState(useUserStore, ['id', 'name', 'phone'])
  },
  methods: {
    goDetail(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    },
    remove(id) {
      useCartStore().remove(id)
      ElMessage.info('已从购物车移除')
    },
    async clearAll() {
      try {
        await ElMessageBox.confirm('确定清空购物车里的全部闲置吗？', '清空确认', { type: 'warning' })
      } catch {
        return
      }
      useCartStore().clear()
    },
    openCheckout() {
      if (!this.form.contact) this.form.contact = this.phone || ''
      if (!this.form.place) this.form.place = '东区食堂门口'
      this.checkoutVisible = true
    },
    submitOrder() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning('请先补全面交信息')
          return
        }
        this.submitting = true
        try {
          // 订单模拟（E7）：items 里带上卖家信息，方便卖家端查"我卖出的"
          const order = await useOrderStore().placeOrder({
            buyerId: this.id,
            buyerName: this.name,
            items: this.items.map((item) => ({ ...item, goodsId: item.id })),
            total: this.totalPrice,
            status: '待面交',
            contact: this.form.contact,
            place: this.form.place,
            note: this.form.note
          })
          useCartStore().clear()
          this.checkoutVisible = false
          ElMessage.success(`下单成功，订单号 ${order.orderNo}，去联系卖家面交吧`)
          this.$router.push('/center/my-orders')
        } catch (err) {
          ElMessage.error(err.message || '下单失败，请稍后再试')
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style scoped>
.head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.offline-alert {
  margin: 12px 0;
}

.empty-card {
  padding: 28px;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}

.cart-list {
  margin: 0;
  padding: 6px 18px 18px;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.list-head h2 {
  margin-bottom: 4px;
}

.cart-item {
  display: grid;
  grid-template-columns: 64px 1fr 88px 52px;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--border);
}

.cart-item:last-child {
  border-bottom: none;
}

.item-cover {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 30px;
  cursor: pointer;
}

.item-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-name:hover {
  color: var(--primary-dark);
}

.subtotal {
  text-align: right;
  font-weight: 700;
  color: var(--primary-dark);
}

.summary {
  margin: 0;
  position: sticky;
  top: 86px;
}

.summary h2 {
  margin-bottom: 10px;
}

.sum-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 13px;
  padding: 5px 0;
  color: var(--muted);
}

.sum-row b {
  color: var(--text);
  font-size: 14px;
}

.checkout-btn {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  font-size: 15px;
}

.store-tip {
  margin-top: 10px;
  font-size: 11px;
}

.order-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary-bg);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--primary-dark);
}

.order-preview b {
  font-size: 18px;
  color: var(--accent);
}

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }
}
</style>
