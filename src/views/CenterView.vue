<!-- ============================================================
  CenterView.vue —— 个人中心外壳（题目 T3：嵌套路由）
  本身不写业务，只负责：
   ① 顶部问候语 + 统计卡片
   ② 左侧 el-menu（router 模式）切换子页面
   ③ <router-view> 渲染 /center/my-goods、/center/my-orders 与 /center/my-favorites
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>个人中心</h1>
        <p class="sub">{{ name }}，欢迎回来。在这里管理宝贝资产、跟踪订单进度。</p>
      </div>
      <div class="head-actions">
        <el-button plain @click="editVisible = true">
          <el-icon><Edit /></el-icon>编辑资料
        </el-button>
        <el-button type="primary" @click="$router.push('/publish')">
          <el-icon><CirclePlus /></el-icon>发布宝贝
        </el-button>
      </div>
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
          <el-menu-item index="/center/my-favorites">
            <el-icon><Star /></el-icon>我的收藏
          </el-menu-item>
          <el-menu-item index="/center/my-messages">
            <el-icon><ChatDotRound /></el-icon>消息中心
            <el-badge v-if="messageUnread" :value="messageUnread" class="menu-badge" />
          </el-menu-item>
          <el-menu-item index="/center/my-footprints">
            <el-icon><Clock /></el-icon>我的足迹
          </el-menu-item>
          <el-menu-item index="/center/my-credit">
            <el-icon><Tickets /></el-icon>信用档案
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="center-body">
        <router-view />
      </main>
    </div>

    <ProfileEditDialog v-model="editVisible" @saved="onProfileSaved" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage } from 'element-plus'
import StatCard from '../components/StatCard.vue'
import ProfileEditDialog from '../components/ProfileEditDialog.vue'
import { unreadCount, getConversations } from '../api/community'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { useOrderStore } from '../store/order'
import { useUserStore } from '../store/user'

export default {
  name: 'CenterView',
  components: { StatCard, ProfileEditDialog },
  data() {
    return { editVisible: false, messageUnread: 0 }
  },
  computed: {
    ...mapState(useUserStore, ['id', 'name']),
    ...mapState(useCartStore, { cartCount: 'totalCount' }),
    ...mapState(useFavoriteStore, { favCount: 'count' }),
    activePath() {
      return this.$route.path
    },
    // 统计口径按"我"过滤：订单记录/待面交只算当前登录同学的，不掺别人的订单
    myOrderCount() {
      return useOrderStore().myOrders(this.id).length
    },
    myPendingCount() {
      return useOrderStore()
        .myOrders(this.id)
        .filter((order) => order.status === '待面交').length
    },
    statCards() {
      // 订单状态卡动态化：有待面交订单就显示笔数，否则显示收尾状态
      const orderStatus = this.myPendingCount
        ? { value: this.myPendingCount, unit: '笔待面交' }
        : this.myOrderCount
          ? { value: '全部完成', unit: '' }
          : { value: '暂无', unit: '订单' }
      return [
        { title: '购物车', value: this.cartCount, unit: '件', icon: 'ShoppingCart', tone: 'green' },
        { title: '我的收藏', value: this.favCount, unit: '件', icon: 'Star', tone: 'amber' },
        { title: '订单记录', value: this.myOrderCount, unit: '笔', icon: 'Tickets', tone: 'orange' },
        { title: '订单状态', icon: 'Bell', tone: 'blue', ...orderStatus }
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
    this.refreshUnread()
  },
  methods: {
    refreshUnread() {
      const me = useUserStore()
      this.messageUnread =
        unreadCount(me.id) +
        getConversations(me.id).reduce((sum, c) => sum + (c.unread || 0), 0)
    },
    onProfileSaved() {
      ElMessage.success('个人资料已更新')
      this.refreshUnread()
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

.head-actions {
  display: flex;
  gap: 10px;
}

.menu-badge {
  margin-left: 6px;
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
