<!-- ============================================================
  CenterView.vue —— 个人中心外壳（题目 T3：嵌套路由）
  本身不写业务，只负责：
   ① 顶部问候语 + 统计卡片
   ② 左侧 el-menu（router 模式）切换子页面
   ③ <router-view> 渲染 /center/my-goods 与 /center/my-orders
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>个人中心</h1>
        <p class="sub">{{ name }}，欢迎回来。在这里管理宝贝资产、跟踪订单进度。</p>
      </div>
      <el-button type="primary" @click="$router.push('/publish')">
        <el-icon><CirclePlus /></el-icon>发布宝贝
      </el-button>
    </div>

    <el-row :gutter="14">
      <el-col v-for="item in statCards" :key="item.title" :xs="12" :md="6">
        <StatCard v-bind="item" />
      </el-col>
    </el-row>

    <div class="center-layout">
      <aside class="side-menu">
        <el-menu :default-active="activePath" router>
          <el-menu-item index="/center/my-goods">
            <el-icon><Sell /></el-icon>我的宝贝
          </el-menu-item>
          <el-menu-item index="/center/my-orders">
            <el-icon><Tickets /></el-icon>我的订单
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="center-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import StatCard from '../components/StatCard.vue'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { useOrderStore } from '../store/order'
import { useUserStore } from '../store/user'

export default {
  name: 'CenterView',
  components: { StatCard },
  computed: {
    ...mapState(useUserStore, ['name']),
    ...mapState(useCartStore, { cartCount: 'totalCount' }),
    ...mapState(useFavoriteStore, { favCount: 'count' }),
    ...mapState(useOrderStore, { orderCount: 'orderCount' }),
    activePath() {
      return this.$route.path
    },
    statCards() {
      return [
        { title: '购物车', value: this.cartCount, unit: '件', icon: 'ShoppingCart', tone: 'green' },
        { title: '我的收藏', value: this.favCount, unit: '件', icon: 'Star', tone: 'amber' },
        { title: '订单记录', value: this.orderCount, unit: '笔', icon: 'Tickets', tone: 'orange' },
        { title: '订单状态', value: this.orderCount ? '进行中' : '暂无', icon: 'Bell', tone: 'blue' }
      ]
    }
  },
  async mounted() {
    // 订单仓库唯一数据源：进个人中心就同步一次
    try {
      await useOrderStore().fetchOrders()
    } catch {
      /* 请求失败时 api 层已降级本地数据，这里静默即可 */
    }
  }
}
</script>

<style scoped>
.center-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: start;
  margin-top: 14px;
}

.side-menu {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.side-menu .el-menu {
  border-right: none;
}

.center-body {
  min-width: 0;
}

@media (max-width: 900px) {
  .center-layout {
    grid-template-columns: 1fr;
  }

  .side-menu :deep(.el-menu) {
    display: flex;
  }

  .side-menu :deep(.el-menu-item) {
    flex: 1;
    justify-content: center;
  }
}
</style>
