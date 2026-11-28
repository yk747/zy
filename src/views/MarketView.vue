<!-- ============================================================
  MarketView.vue —— 商品广场（题目 F2：卡片列表 + 分类 + 关键词搜索）
  知识点：
   ① computed 组合"关键词 + 分类 + 排序"三个筛选条件
   ② 列表页 loading 态（题目 T5）
   ③ 复用 SearchBar / GoodsCard 两个自封装组件（props + emit）
  ============================================================ -->
<template>
  <div class="page market-page">
    <section class="banner">
      <div class="banner-glow"></div>
      <div class="banner-inner">
        <div class="banner-text">
          <span class="banner-pill"><span class="dot"></span>校园严选 · 实名认证 · 当面验货</span>
          <h1>好物流转<br />让闲置产生价值</h1>
          <p class="banner-sub">同校交易，价格透明，当面交付更安心。<br />把闲置交给需要的人，让每一件好物继续发光。</p>
          <div class="banner-actions">
            <el-button type="primary" size="large" round class="cta-btn" @click="$router.push('/publish')">
              <el-icon><CirclePlus /></el-icon>立即发布闲置
            </el-button>
            <el-button size="large" round class="ghost-btn" @click="scrollToGoods">
              <el-icon><Shop /></el-icon>开始逛集市
            </el-button>
          </div>
          <div class="banner-trust">
            <span><b>{{ goodsList.length }}+</b> 件在售好物</span>
            <i></i>
            <span><b>{{ userCount }}+</b> 位实名同学</span>
            <i></i>
            <span><b>100%</b> 当面验货</span>
          </div>
        </div>
        <div class="banner-showcase" aria-hidden="true">
          <div v-for="(item, index) in bannerGoods" :key="item.id" class="show-card" :class="`show-${index + 1}`">
            <GoodsImage :goods="item" emoji-size="34px" />
            <span class="show-info"><b>{{ item.title }}</b><em>￥{{ Number(item.price).toFixed(0) }}</em></span>
          </div>
          <span class="show-badge">校园好物 · 实时上新</span>
        </div>
      </div>
    </section>

    <el-alert
      v-if="serverState.online === false"
      :title="serverState.message"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <div class="market-layout">
      <aside class="side-rail left-rail">
        <div class="rail-card">
          <h3 class="rail-title">快速分类</h3>
          <div class="rail-cats">
            <button
              v-for="item in categoryList"
              :key="item"
              v-ripple
              type="button"
              class="rail-cat"
              :class="{ active: category === item }"
              @click="category = item"
            >
              <span class="rail-cat-ico">{{ categoryIcon(item) }}</span>
              <span>{{ item }}</span>
              <span class="rail-cat-arrow">›</span>
            </button>
          </div>
        </div>

        <div class="rail-card guide-card">
          <h3 class="rail-title">安心逛集市</h3>
          <ol class="guide-list">
            <li v-for="(step, index) in guideSteps" :key="step">
              <b>{{ String(index + 1).padStart(2, '0') }}</b>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>

        <div class="rail-card promise-card">
          <span class="promise-emoji">🛡️</span>
          <div>
            <b>校园实名认证</b>
            <p>当面验货，交易更放心</p>
          </div>
        </div>
      </aside>

      <main class="market-main">
        <div class="stat-grid">
          <StatCard v-for="item in statCards" :key="item.title" v-bind="item" />
        </div>

    <div class="hero card">
      <SearchBar v-model="keyword" />
      <span class="hero-hint">输入关键词，发现属于你的那件好物</span>
    </div>

    <div class="chips">
      <button
        v-for="item in categoryList"
        :key="item"
        v-ripple
        type="button"
        class="chip"
        :class="{ active: category === item }"
        @click="category = item"
      >
        <span class="chip-ico">{{ categoryIcon(item) }}</span>
        <span>{{ item }}</span>
      </button>
    </div>

    <div class="filter-bar">
      <span class="filter-label">价格区间</span>
      <div class="price-chips">
        <button
          v-for="range in priceRanges"
          :key="range.label"
          v-ripple
          type="button"
          class="price-chip"
          :class="{ active: priceRange === range.value }"
          @click="priceRange = range.value"
        >{{ range.label }}</button>
      </div>
      <el-select v-model="sort" size="small" class="sort-select" aria-label="排序方式">
        <el-option label="默认排序" value="default" />
        <el-option label="最新上架" value="new" />
        <el-option label="价格从低到高" value="price-asc" />
        <el-option label="价格从高到低" value="price-desc" />
      </el-select>
    </div>

    <div class="result-bar">
      <span class="result-title">精选好物</span>
      <span class="result-count">共 <b>{{ filtered.length }}</b> 件在售</span>
    </div>

    <div class="goods-area">
      <div v-if="loading" class="goods-grid">
        <SkeletonCard v-for="n in 6" :key="n" />
      </div>
      <div v-else-if="filtered.length" class="goods-grid">
        <GoodsCard
          v-for="goods in filtered"
          :key="goods.id"
          :goods="goods"
          :keyword="keyword"
          :favorite="favoriteIds.has(String(goods.id))"
          :in-cart="cartIds.has(String(goods.id))"
          @view="goDetail"
          @add="addToCart"
          @fav="toggleFavorite"
        />
      </div>
      <el-empty v-else description="暂无相关宝贝，试试其他关键词或筛选条件">
        <el-button type="primary" @click="resetFilter">清空筛选条件</el-button>
      </el-empty>
    </div>

    <div v-if="!loading && !keyword && category === '全部' && priceRange === 'all'" class="hot-section">
      <div class="hot-head">
        <div>
          <span class="hot-badge">HOT</span>
          <h2>人气热卖</h2>
          <p class="small muted">同学们都在看的优质好物，先到先得</p>
        </div>
        <el-button link type="primary" @click="sort = 'price-desc'; scrollToGoods()">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
      </div>
      <div class="hot-grid">
        <div v-for="(item, index) in hotGoods" :key="item.id" v-ripple class="hot-card" @click="goDetail(item)">
          <span class="hot-rank" :class="{ top: index < 2 }">NO.{{ index + 1 }}</span>
          <div class="hot-cover" :style="{ background: item.gradient }">
            <GoodsImage :goods="item" emoji-size="40px" />
          </div>
          <div class="hot-info">
            <b>{{ item.title }}</b>
            <span class="price"><small>￥</small>{{ Number(item.price).toFixed(0) }}</span>
          </div>
        </div>
      </div>
    </div>
      </main>

      <aside class="side-rail right-rail">
        <div class="rail-card">
          <div class="rail-head">
            <h3 class="rail-title">刚刚上架</h3>
            <span class="rail-live">实时</span>
          </div>
          <div class="mini-list">
            <button
              v-for="item in latestGoods"
              :key="item.id"
              v-ripple
              type="button"
              class="mini-goods"
              @click="goDetail(item)"
            >
              <span class="mini-cover" :style="{ background: item.gradient }">
                <GoodsImage :goods="item" emoji-size="20px" />
              </span>
              <span class="mini-info">
                <b>{{ item.title }}</b>
                <em>￥{{ Number(item.price).toFixed(0) }}</em>
              </span>
            </button>
          </div>
        </div>

        <div class="rail-card">
          <h3 class="rail-title">成交小贴士</h3>
          <ul class="tip-list">
            <li v-for="tip in tips" :key="tip.title">
              <span class="tip-emoji">{{ tip.emoji }}</span>
              <div>
                <b>{{ tip.title }}</b>
                <p>{{ tip.desc }}</p>
              </div>
            </li>
          </ul>
        </div>

        <div class="rail-card publish-card">
          <h3 class="rail-title">有闲置要出手？</h3>
          <p>发布宝贝，让好物流转给下一位同学。</p>
          <el-button type="primary" round class="publish-btn" @click="$router.push('/publish')">
            立即发布
          </el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage } from 'element-plus'
import SearchBar from '../components/SearchBar.vue'
import GoodsCard from '../components/GoodsCard.vue'
import GoodsImage from '../components/GoodsImage.vue'
import StatCard from '../components/StatCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { fetchUsers, serverState } from '../api/goods'
import { fetchAllGoods } from '../api/extraGoods'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { CATEGORIES } from '../../shared/goods.js'

export default {
  name: 'MarketView',
  components: { SearchBar, GoodsCard, GoodsImage, StatCard, SkeletonCard },
  data() {
    return {
      serverState,
      goodsList: [],
      users: [],
      loading: true,
      keyword: '',
      category: '全部',
      sort: 'default',
      priceRange: 'all',
      priceRanges: [
        { label: '不限', value: 'all' },
        { label: '￥0-50', value: '0-50' },
        { label: '￥50-200', value: '50-200' },
        { label: '￥200-1000', value: '200-1000' },
        { label: '￥1000+', value: '1000+' }
      ],
      guideSteps: ['看详情，问清成色与配件', '约校内地点当面验货', '确认无误后再交付'],
      tips: [
        { emoji: '🤝', title: '当面验货', desc: '约在宿舍楼或食堂，现场确认成色' },
        { emoji: '💰', title: '价格透明', desc: '一口价挂出，评论区友好议价' },
        { emoji: '🎓', title: '校内交割', desc: '同校认证用户，沟通更放心' }
      ]
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
    // 模板里批量判断卡片状态，用 Set 避免每张卡片都遍历一遍数组
    cartIds() {
      return this.cart.idSet
    },
    favoriteIds() {
      return this.favorite.idSet
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
    // 右栏「刚刚上架」：按上架时间取最新几件，引导用户继续逛
    latestGoods() {
      return [...this.goodsList]
        .filter((item) => item.status === '在售')
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 4)
    },
    // Banner 展示卡片：挑有代表性图的在售好物，撑起首屏商业氛围
    bannerGoods() {
      return [...this.goodsList]
        .filter((item) => item.status === '在售' && item.image)
        .slice(0, 3)
    },
    userCount() {
      return new Set(this.users.map((u) => String(u.id))).size
    },
    // 人气热卖：按价格与成色综合排序，取有图商品的几件做营销位
    hotGoods() {
      return [...this.goodsList]
        .filter((item) => item.status === '在售')
        .sort((a, b) => Number(b.price) - Number(a.price))
        .slice(0, 4)
    },
    // 组合筛选：在售 × 关键词 × 分类 × 排序，computed 自动跟随任一条件变化
    // 已成交（已售）与手动下架的宝贝不再出现在集市列表
    filtered() {
      const word = this.keyword.trim().toLowerCase()
      // 字段缺失或为 null 时按空串处理，避免详情页因脏数据白屏
      const text = (value) => String(value ?? '').toLowerCase()
      let list = this.goodsList.filter((goods) => {
        if (goods.status !== '在售') return false
        const hitWord =
          !word ||
          text(goods.title).includes(word) ||
          text(goods.desc).includes(word) ||
          text(goods.category).includes(word)
        const hitCategory = this.category === '全部' || goods.category === this.category
        const price = Number(goods.price) || 0
        let hitPrice = true
        if (this.priceRange === '0-50') hitPrice = price < 50
        else if (this.priceRange === '50-200') hitPrice = price >= 50 && price < 200
        else if (this.priceRange === '200-1000') hitPrice = price >= 200 && price < 1000
        else if (this.priceRange === '1000+') hitPrice = price >= 1000
        return hitWord && hitCategory && hitPrice
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
  watch: {
    // 顶部导航搜索：在同一页面再次搜索时更新关键词
    '$route.query.q'(value) {
      if (value) {
        this.keyword = String(value)
        this.$nextTick(this.scrollToGoods)
      }
    }
  },
  async mounted() {
    // 顶部导航搜索跳转带 q 参数，回填到搜索框
    if (this.$route.query.q) this.keyword = String(this.$route.query.q)
    try {
      const [goods, users] = await Promise.all([fetchAllGoods(), fetchUsers()])
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
    scrollToGoods() {
      this.$nextTick(() => {
        const el = this.$el.querySelector('.hero') || this.$el.querySelector('.result-bar')
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    categoryIcon(name) {
      const hit = CATEGORIES.find((item) => item.name === name)
      return hit ? hit.icon : '🏷️'
    },
    sellerName(id) {
      const hit = this.users.find((user) => String(user.id) === String(id))
      return hit ? hit.name : '同学'
    },
    resetFilter() {
      this.keyword = ''
      this.category = '全部'
      this.sort = 'default'
      this.priceRange = 'all'
    },
    goDetail(goods) {
      this.$router.push({ name: 'goods-detail', params: { id: goods.id } })
    },
    addToCart(goods) {
      if (goods.status !== '在售') {
        ElMessage.warning('该宝贝已成交或下架，看看其他好物吧')
        return
      }
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
  margin: 0 0 16px;
  border-radius: 12px;
}

/* ---------- 品牌 Banner ---------- */
.banner {
  position: relative;
  margin: 4px 0 18px;
  border-radius: var(--radius-lg);
  background: linear-gradient(118deg, #0aa26f 0%, #0b8a68 46%, #0f7d86 100%);
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(8, 105, 78, 0.28);
}

.banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px 190px at 84% -10%, rgba(255, 255, 255, 0.16), transparent 65%),
    radial-gradient(340px 170px at 4% 108%, rgba(255, 255, 255, 0.1), transparent 62%);
  pointer-events: none;
}

.banner-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 30px 34px;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #eafff5;
  font-size: 12.5px;
  backdrop-filter: blur(4px);
}

.banner-pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8dffc9;
  box-shadow: 0 0 0 4px rgba(141, 255, 201, 0.25);
  animation: pulse 2.2s infinite;
}

.banner h1 {
  color: #fff;
  font-size: 30px;
  margin: 14px 0 6px;
  line-height: 1.28;
}

.banner h1::after {
  width: 46px;
  background: linear-gradient(90deg, #8dffc9, #4fd1c5);
}

.banner-sub {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
}

.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.cta-btn.el-button--primary:not(.is-disabled) {
  background: #fff;
  background-image: none;
  border-color: #fff;
  color: var(--primary-dark);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
}

.cta-btn.el-button--primary:not(.is-disabled):hover {
  background: #f0fff8;
  color: var(--primary-dark);
  transform: translateY(-1px);
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.42);
  color: #fff;
}

.ghost-btn:hover {
  background: rgba(255, 255, 255, 0.26);
  border-color: rgba(255, 255, 255, 0.62);
  color: #fff;
}

.banner-glow {
  position: absolute;
  right: 6%;
  top: -60%;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(141, 255, 201, 0.22), transparent 68%);
  pointer-events: none;
}

.banner-trust {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12.5px;
}

.banner-trust b {
  font-size: 17px;
  font-weight: 800;
  color: #8dffc9;
  margin-right: 3px;
}

.banner-trust i {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.28);
}

.banner-showcase {
  position: relative;
  width: 380px;
  height: 220px;
  flex-shrink: 0;
}

.show-card {
  position: absolute;
  width: 148px;
  padding: 7px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  animation: floaty 7s ease-in-out infinite;
}

.show-card .goods-image,
.show-card :deep(.goods-image) {
  height: 92px;
  border-radius: 10px;
}

.show-card :deep(.goods-image img) {
  width: 100%;
  height: 92px;
  object-fit: cover;
  border-radius: 10px;
}

.show-1 { left: 4px; top: 6px; transform: rotate(-7deg); }
.show-2 { right: 8px; top: 26px; transform: rotate(6deg); animation-delay: 1.4s; }
.show-3 { left: 108px; bottom: 2px; transform: rotate(-2deg); animation-delay: 2.6s; }

.show-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 4px 2px;
}

.show-info b {
  font-size: 11px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-info em {
  font-size: 14px;
  font-weight: 800;
  color: var(--accent);
  font-style: normal;
}

.show-badge {
  position: absolute;
  right: -6px;
  top: -6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--accent-strong);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(232, 84, 31, 0.4);
  z-index: 2;
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 7px rgba(141, 255, 201, 0.08);
  }
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-10px) rotate(6deg);
  }
}

@media (max-width: 860px) {
  .banner-inner {
    padding: 24px 22px;
  }

  .banner-showcase {
    display: none;
  }

  .banner h1 {
    font-size: 25px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .deco,
  .banner-pill .dot {
    animation: none;
  }
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 0;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f3fbf7 100%);
  border: 1px solid #dff0e8;
}

.hero :deep(.search-bar) {
  flex: 1;
  max-width: none;
}

.hero-hint {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.sort-select {
  width: 168px;
}

.chips {
  display: flex;
  gap: 8px;
  margin: 14px 0 0;
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
  margin: 4px 0 4px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: var(--muted);
  flex-shrink: 0;
}

.price-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.price-chip {
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-soft);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.price-chip:hover {
  border-color: var(--primary);
  color: var(--primary-dark);
}

.price-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.sort-select {
  margin-left: auto;
  width: 160px;
}

.hot-section {
  margin: 30px 0 8px;
  padding: 22px;
  border-radius: var(--radius-lg);
  background: linear-gradient(140deg, #fffaf3 0%, #fff6ec 100%);
  border: 1px solid #f6e2cc;
}

.hot-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.hot-head h2 {
  display: inline-block;
  margin: 0 0 2px;
  font-size: 19px;
}

.hot-head p {
  margin: 0;
}

.hot-badge {
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
  padding: 2px 9px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f57224, #e8541f);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

.hot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.hot-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--card);
  border: 1px solid var(--border);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hot-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.hot-rank {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  padding: 1px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #ffe6b8;
  font-size: 10px;
  font-weight: 700;
}

.hot-rank.top {
  background: linear-gradient(135deg, #f57224, #e8541f);
  color: #fff;
}

.hot-cover {
  width: 62px;
  height: 62px;
  border-radius: 10px;
  flex-shrink: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.hot-cover :deep(.goods-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hot-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.hot-info b {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-info .price {
  font-size: 16px;
  color: var(--accent);
  font-weight: 800;
}

@media (max-width: 900px) {
  .hot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

/* ---------- 宽屏三栏：左右补齐留白，中间仍是集市主体 ---------- */
.market-layout {
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr) 232px;
  gap: 16px;
  align-items: start;
}

.market-main {
  min-width: 0;
}

.side-rail {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rail-card {
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.rail-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.rail-title::before {
  content: '';
  width: 3px;
  height: 13px;
  border-radius: 2px;
  background: var(--primary);
}

.rail-cats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rail-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-soft);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.18s;
}

.rail-cat:hover {
  background: var(--primary-bg);
  color: var(--primary-dark);
  transform: translateX(2px);
}

.rail-cat.active {
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-weight: 700;
}

.rail-cat-ico {
  font-size: 15px;
  line-height: 1;
}

.rail-cat-arrow {
  margin-left: auto;
  color: var(--muted);
}

.guide-list,
.tip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-soft);
}

.guide-list b {
  padding-top: 1px;
  color: var(--primary);
  font-size: 11px;
}

.promise-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #f1fbf6, #fff);
}

.promise-emoji {
  font-size: 26px;
}

.promise-card b {
  font-size: 13px;
}

.promise-card p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--muted);
}

.rail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.rail-live {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-size: 10px;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-goods {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 6px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s;
}

.mini-goods:hover {
  background: var(--primary-bg);
  transform: translateX(2px);
}

.mini-cover {
  position: relative;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 20px;
  overflow: hidden;
}

.mini-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.mini-info b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 600;
}

.mini-info em {
  font-style: normal;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.tip-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tip-emoji {
  font-size: 17px;
}

.tip-list b {
  font-size: 12px;
}

.tip-list p {
  margin: 1px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--muted);
}

.publish-card p {
  margin: 0 0 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--muted);
}

.publish-btn {
  width: 100%;
  height: 32px;
  font-size: 12px;
}

@media (max-width: 1440px) {
  .market-layout {
    grid-template-columns: 180px minmax(0, 1fr) 210px;
    gap: 12px;
  }
}

@media (max-width: 1180px) {
  .market-layout {
    grid-template-columns: 156px minmax(0, 1fr) 180px;
    gap: 10px;
  }

  .rail-card {
    padding: 11px;
  }

  .rail-title {
    font-size: 12px;
  }

  .rail-cat {
    padding: 7px 8px;
    font-size: 12px;
  }
}

@media (max-width: 980px) {
  .market-layout {
    grid-template-columns: 1fr;
  }

  .side-rail {
    display: none;
  }
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
