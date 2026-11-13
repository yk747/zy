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
        <div class="title-row">
          <h1>闲置集市</h1>
          <el-tooltip
            v-if="serverState.online === false"
            content="未连接本地接口，数据仅保存在当前浏览器"
            placement="right"
          >
            <el-tag type="info" effect="plain" size="small" round>演示模式</el-tag>
          </el-tooltip>
          <el-tag v-else-if="serverState.online" type="success" effect="plain" size="small" round>
            在线服务
          </el-tag>
        </div>
        <p class="sub">平台严选校内优质闲置，价格透明，当面验货更安心。</p>
      </div>
      <el-button type="primary" @click="$router.push('/publish')">
        <el-icon><CirclePlus /></el-icon>发布宝贝
      </el-button>
    </div>

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
        <span class="chip-ico">{{ categoryIcon(item) }}</span>
        <span>{{ item }}</span>
      </button>
    </div>

    <div class="stat-grid">
      <StatCard v-for="item in statCards" :key="item.title" v-bind="item" />
    </div>

    <div class="result-bar">
      <span class="result-title">精选好物</span>
      <span class="result-count">共 <b>{{ filtered.length }}</b> 件在售</span>
    </div>

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
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-row h1 {
  margin: 0;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f3fbf7 100%);
  border: 1px solid #dff0e8;
}

.hero :deep(.search-bar) {
  flex: 1;
  max-width: none;
}

.sort-select {
  width: 168px;
}

.chips {
  display: flex;
  gap: 8px;
  margin: 16px 0 4px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 7px 16px;
  margin: 0;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.18s, border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s;
}

.chip:hover {
  color: var(--primary-dark);
  border-color: #bfe8d4;
  background: #f4fbf8;
  transform: translateY(-1px);
}

.chip-ico {
  font-size: 14px;
  line-height: 1;
}

.chip.active {
  background: linear-gradient(135deg, #00c185, #009260);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 181, 120, 0.24);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 8px;
}

.result-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 18px 0 10px;
  padding-left: 12px;
  border-left: 3px solid var(--primary);
}

.result-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.result-count {
  font-size: 13px;
  color: var(--muted);
}

.result-count b {
  color: var(--primary-dark);
  font-size: 15px;
}

.goods-area {
  min-height: 240px;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-select {
    width: 100%;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
