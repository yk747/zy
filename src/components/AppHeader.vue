<!-- ============================================================
  AppHeader.vue —— 校园二手集市顶部导航
  ① el-menu 开启 router 模式：index 就是路由地址（题目 T4：Menu 布局）
  ② el-badge 读 Pinia 购物车 totalCount / 收藏 count，任何页面变化角标立刻变
  ③ 下拉菜单退出登录：清 token + 清用户仓库 → 守卫下次就拦
  ============================================================ -->
<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="brand" @click="$router.push('/market')">
        <span class="logo">集</span>
        <span class="brand-text">
          <b>校园二手集市</b>
          <small>CAMPUS MARKET</small>
        </span>
      </div>

      <el-menu
        class="nav"
        mode="horizontal"
        :default-active="activePath"
        :ellipsis="false"
        router
      >
        <el-menu-item index="/market">
          <el-icon><Shop /></el-icon>闲置集市
        </el-menu-item>
        <el-menu-item index="/publish">
          <el-icon><CirclePlus /></el-icon>发布宝贝
        </el-menu-item>
        <el-menu-item index="/cart">
          <el-icon><ShoppingCart /></el-icon>购物车
          <el-badge v-if="totalCount" :value="totalCount" :max="99" class="nav-badge" />
        </el-menu-item>
        <el-menu-item index="/center">
          <el-icon><User /></el-icon>个人中心
        </el-menu-item>
        <el-menu-item index="/mobile">
          <el-icon><Iphone /></el-icon>移动端
        </el-menu-item>
      </el-menu>

      <div class="user-area">
        <el-dropdown trigger="click" @command="onCommand">
          <span class="user-trigger">
            <el-avatar :size="30" class="avatar">{{ initial }}</el-avatar>
            <span class="user-name">{{ name || '未登录' }}</span>
            <el-icon class="arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>欢迎回来：{{ name }}（{{ dorm || '校内当面交付' }}）</el-dropdown-item>
              <el-dropdown-item divided command="goods">我发布的宝贝</el-dropdown-item>
              <el-dropdown-item command="orders">我的订单</el-dropdown-item>
              <el-dropdown-item command="cart">购物车</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../store/cart'
import { useUserStore } from '../store/user'

export default {
  name: 'AppHeader',
  computed: {
    // pinia 的 mapState：state 与 getters 都能"抄"成组件的计算属性
    ...mapState(useCartStore, ['totalCount']),
    ...mapState(useUserStore, ['name', 'initial', 'dorm']),
    activePath() {
      const path = this.$route.path
      if (path.startsWith('/goods')) return '/market'
      if (path.startsWith('/center')) return '/center'
      return path
    }
  },
  methods: {
    onCommand(command) {
      if (command === 'goods') {
        this.$router.push('/center/my-goods')
        return
      }
      if (command === 'orders') {
        this.$router.push('/center/my-orders')
        return
      }
      if (command === 'cart') {
        this.$router.push('/cart')
        return
      }
      if (command === 'logout') {
        const user = useUserStore()
        user.logout()
        ElMessage.success('已退出登录')
        this.$router.push({ name: 'login' })
      }
    }
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  font-weight: 700;
  display: grid;
  place-items: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 181, 120, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text b {
  font-size: 15px;
}

.brand-text small {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1.5px;
}

.nav {
  flex: 1;
  border-bottom: none;
  min-width: 0;
}

.nav :deep(.el-menu-item) {
  font-size: 14px;
}

.nav-badge {
  margin-left: 6px;
  line-height: 1;
}

.nav-badge :deep(.el-badge__content) {
  transform: translateY(-8px);
}

.user-area {
  flex-shrink: 0;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text);
  outline: none;
}

.avatar {
  background: var(--primary);
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 980px) {
  .brand-text,
  .user-name {
    display: none;
  }

  .header-inner {
    padding: 0 10px;
    gap: 6px;
  }

  .nav :deep(.el-menu-item) {
    padding: 0 8px;
    font-size: 13px;
  }

  .nav :deep(.el-icon) {
    margin-right: 2px;
  }
}

@media (max-width: 720px) {
  .nav :deep(.el-menu-item) {
    padding: 0 6px;
    font-size: 12px;
  }

  .nav :deep(.el-menu-item .el-icon) {
    display: none;
  }
}
</style>
