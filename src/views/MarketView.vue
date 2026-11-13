<!-- ============================================================
  MarketView.vue —— 商品广场（题目 F2：卡片列表 + 分类 + 关键词搜索）
  知识点：
   ① computed 组合"关键词 + 分类 + 排序"三个筛选条件
   ② 列表页 loading 态（题目 T5）
   ③ 复用 SearchBar / GoodsCard 两个自封装组件（props + emit）
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>闲置集市</h1>
        <p class="sub">平台严选校内优质闲置，价格透明，当面验货更安心。</p>
      </div>
      <el-button type="primary" @click="$router.push('/publish')">
        <el-icon><CirclePlus /></el-icon>发布宝贝
      </el-button>
    </div>

    <el-alert
      v-if="serverState.online === false"
      :title="serverState.message"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <div class="hero card">
      <SearchBar v-model="keyword" @search="onSearch" />
      <el-select v-model="sort" class="sort-select" size="large">
        <el-option label="综合排序" value="default" />
        <el-option label="最新上架" value="new" />
        <el-option label="价格由低到高" value="price-asc" />
        <el-option label="价格由高到低" value="price-desc" />
      </el-select>
    </div>

    <div class="chips">
      <button
        v-for="item in categoryList"
        :key="item"
        type="button"
        class="chip"
        :class="{ active: category === item }"
        @click="category = item"
      >
        {{ categoryIcon(item) }} {{ item }}
      </button>
    </div>

    <el-row :gutter="14">
      <el-col v-for="item in statCards" :key="item.title" :xs="8">
        <StatCard v-bind="item" />
      </el-col>
    </el-row>

    <div v-loading="loading" class="goods-area" element-loading-text="正在集市里翻找…">
      <div v-if="filtered.length" class="goods-grid">
        <GoodsCard
          v-for="goods in filtered"
          :key="goods.id"
          :goods="goods"
          :keyword="keyword"
          :favorite="favorite.has(goods.id)"
          :in-cart="cart.has(goods.id)"
          @view="goDetail"
          @add="addToCart"
          @fav="toggleFavorite"
        />
      </div>
      <el-empty v-else-if="!loading" description="暂无相关宝贝，试试其他关键词或筛选条件">
        <el-button type="primary" @click="resetFilter">清空筛选条件</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage } from 'element-plus'
import SearchBar from '../components/SearchBar.vue'
import GoodsCard from '../components/GoodsCard.vue'
import StatCard from '../components/StatCard.vue'
import { fetchGoods, fetchUsers, serverState } from '../api/goods'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { CATEGORIES } from '../../shared/goods.js'

export default {
  name: 'MarketView',
  components: { SearchBar, GoodsCard, StatCard },
  data() {
    return {
      serverState,
      goodsList: [],
      users: [],
      loading: true,
      keyword: '',
      category: '全部',
      sort: 'default'
    }
  },
  computed: {
    ...mapState(useCartStore, { cartCount: 'totalCount' }),
    ...mapState(useFavoriteStore, { favCount: 'count' }),
    cart() {
      return useCartStore()
    },
    favorite() {
      return useFavoriteStore()
    },
    categoryList() {
      return ['全部', ...CATEGORIES.map((item) => item.name)]
    },
    statCards() {
      const onSale = this.goodsList.filter((item) => item.status === '在售')
      return [
        { title: '在售宝贝', value: onSale.length, unit: '件', icon: 'Shop', tone: 'green' },
        { title: '我的收藏', value: this.favCount, unit: '件', icon: 'Star', tone: 'amber' },
        { title: '购物车', value: this.cartCount, unit: '件', icon: 'ShoppingCart', tone: 'orange' }
      ]
    },
    // 组合筛选：关键词 × 分类 × 排序，computed 自动跟随任一条件变化
    filtered() {
      const word = this.keyword.trim().toLowerCase()
      let list = this.goodsList.filter((goods) => {
        const hitWord =
          !word ||
          goods.title.toLowerCase().includes(word) ||
          goods.desc.toLowerCase().includes(word) ||
          goods.category.toLowerCase().includes(word)
        const hitCategory = this.category === '全部' || goods.category === this.category
        return hitWord && hitCategory
      })

      if (this.sort === 'new') {
        list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      } else if (this.sort === 'price-asc') {
        list = [...list].sort((a, b) => a.price - b.price)
      } else if (this.sort === 'price-desc') {
        list = [...list].sort((a, b) => b.price - a.price)
      }
      return list
    }
  },
  async mounted() {
    try {
      const [goods, users] = await Promise.all([fetchGoods(), fetchUsers()])
      this.goodsList = goods
      this.users = users
    } catch {
      // fetchGoods 内部已有降级兜底，这里再兜一层防止意外报错白屏
      ElMessage.error('加载商品失败，请稍后刷新重试')
    } finally {
      this.loading = false
    }
  },
  methods: {
    categoryIcon(name) {
      const hit = CATEGORIES.find((item) => item.name === name)
      return hit ? hit.icon : '🏷️'
    },
    sellerName(id) {
      const hit = this.users.find((user) => String(user.id) === String(id))
      return hit ? hit.name : '同学'
    },
    onSearch() {
      // 回车/点击搜索时给个轻反馈，实际过滤由 computed 自动完成
      if (this.keyword.trim()) ElMessage.info(`正在搜索「${this.keyword.trim()}」`)
    },
    resetFilter() {
      this.keyword = ''
      this.category = '全部'
      this.sort = 'default'
    },
    goDetail(goods) {
      this.$router.push({ name: 'goods-detail', params: { id: goods.id } })
    },
    addToCart(goods) {
      const ok = this.cart.add(goods, this.sellerName(goods.sellerId))
      ElMessage[ok ? 'success' : 'warning'](
        ok ? `「${goods.title.slice(0, 12)}…」已加入购物车` : '该宝贝已在购物车中'
      )
    },
    toggleFavorite(goods) {
      const added = this.favorite.toggle(goods.id)
      ElMessage[added ? 'success' : 'info'](added ? '已收藏' : '已取消收藏')
    }
  }
}
</script>

<style scoped>
.offline-alert {
  margin: 12px 0;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
}

.sort-select {
  width: 170px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.chip {
  padding: 6px 16px;
  margin: 0;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}

.chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.goods-area {
  min-height: 240px;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
  margin-top: 6px;
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-select {
    width: 100%;
  }
}
</style>
