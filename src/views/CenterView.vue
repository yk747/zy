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

    <div class="stat-grid">
      <StatCard v-for="item in statCards" :key="item.title" v-bind="item" />
    </div>

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
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 4px;
}

.center-layout {
  display: grid;
  grid-template-columns: 208px 1fr;
  gap: 18px;
  align-items: start;
  margin-top: 18px;
}

.side-menu {
  position: sticky;
  top: 84px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  padding: 8px;
}

.side-menu :deep(.el-menu) {
  border-right: none;
}

.side-menu :deep(.el-menu-item) {
  height: 42px;
  line-height: 42px;
  margin: 2px 0;
  border-radius: 10px;
  color: var(--text-soft);
  transition: background 0.18s ease, color 0.18s ease;
}

.side-menu :deep(.el-menu-item:hover) {
  background: var(--primary-bg);
  color: var(--primary-dark);
}

.side-menu :deep(.el-menu-item.is-active) {
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-weight: 600;
}

.center-body {
  min-width: 0;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .center-layout {
    grid-template-columns: 1fr;
  }

  .side-menu {
    position: static;
  }

  .side-menu :deep(.el-menu) {
    display: flex;
  }

  .side-menu :deep(.el-menu-item) {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
