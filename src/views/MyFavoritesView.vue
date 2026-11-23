<!-- ============================================================
  MyFavoritesView.vue —— 我的收藏（个人中心嵌套路由 /center/my-favorites）
  知识点：
   ① 复用 GoodsCard 组件渲染收藏列表
   ② computed 跟随 favorite 仓库变化：取消收藏后卡片即时消失
   ③ 收藏的宝贝成交（已售）或下架后仍保留记录，但不可再加购
  ============================================================ -->
<template>
  <div class="my-favorites">
    <div class="fav-head">
      <h2>我的收藏</h2>
      <span class="muted small">
        共 {{ favoriteGoods.length }} 件 · 宝贝成交或下架后仍保留记录，可随时取消收藏
      </span>
    </div>

    <div v-if="loading" v-loading="true" class="loading-box" element-loading-text="正在加载收藏…"></div>

    <template v-else>
      <div v-if="favoriteGoods.length" class="fav-grid">
        <GoodsCard
          v-for="goods in favoriteGoods"
          :key="goods.id"
          :goods="goods"
          :favorite="true"
          :in-cart="cartIds.has(String(goods.id))"
          @view="goDetail"
          @add="addToCart"
          @fav="toggleFavorite"
        />
      </div>

      <el-empty v-else description="还没有收藏的宝贝，去闲置集市遇见心仪好物吧">
        <el-button type="primary" @click="$router.push('/market')">去逛集市</el-button>
      </el-empty>
    </template>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import GoodsCard from '../components/GoodsCard.vue'
import { fetchGoods, fetchUsers } from '../api/goods'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'

export default {
  name: 'MyFavoritesView',
  components: { GoodsCard },
  data() {
    return {
      goodsList: [],
      users: [],
      loading: true
    }
  },
  computed: {
    cart() {
      return useCartStore()
    },
    favorite() {
      return useFavoriteStore()
    },
    cartIds() {
      return this.cart.idSet
    },
    // 收藏 id → 商品对象的映射；id 对应的宝贝被删除时自动忽略
    // 在售的排前面，已成交 / 已下架的沉底，浏览动线更自然
    favoriteGoods() {
      const ids = this.favorite.idSet
      const weight = (goods) => (goods.status === '在售' ? 0 : 1)
      return this.goodsList
        .filter((goods) => ids.has(String(goods.id)))
        .sort((a, b) => weight(a) - weight(b))
    }
  },
  async mounted() {
    try {
      const [goods, users] = await Promise.all([fetchGoods(), fetchUsers()])
      this.goodsList = goods
      this.users = users
    } catch {
      ElMessage.error('加载收藏失败，请稍后刷新重试')
    } finally {
      this.loading = false
    }
  },
  methods: {
    sellerName(id) {
      const hit = this.users.find((user) => String(user.id) === String(id))
      return hit ? hit.name : '同学'
    },
    goDetail(goods) {
      this.$router.push({ name: 'goods-detail', params: { id: goods.id } })
    },
    addToCart(goods) {
      if (goods.status === '已售') {
        ElMessage.warning('该宝贝已成交，看看其他好物吧')
        return
      }
      if (goods.status !== '在售') {
        ElMessage.warning('该宝贝已下架，暂时无法购买')
        return
      }
      const ok = this.cart.add(goods, this.sellerName(goods.sellerId))
      ElMessage[ok ? 'success' : 'warning'](ok ? '已加入购物车' : '该宝贝已在购物车中')
    },
    toggleFavorite(goods) {
      const added = this.favorite.toggle(goods.id)
      ElMessage[added ? 'success' : 'info'](added ? '已收藏' : '已取消收藏')
    }
  }
}
</script>

<style scoped>
.fav-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.fav-head h2 {
  margin: 0;
}

.loading-box {
  height: 260px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
  gap: 16px;
}
</style>
