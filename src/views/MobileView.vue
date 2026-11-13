<!-- ============================================================
  MobileView.vue —— 移动端集市（Vant 4，题目 G3 移动端场景）
  "整个买家端就是移动端形态"：商品广场 + 详情 + 加购。
  要点：
   ① van-nav-bar / van-search / van-card / van-tag / van-submit-bar
      直接写标签，vite 插件按需引入，不打包整个 Vant
   ② 手机壳（.phone）在 PC 里模拟 375px 屏幕
   ③ 与桌面端共享同一份 Pinia 购物车 / 收藏仓库
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>移动端集市</h1>
        <p class="sub">手机逛集市，加购与电脑端实时同步，随时随地淘闲置。</p>
      </div>
      <el-tag effect="plain">移动端 · 随时随地淘</el-tag>
    </div>

    <el-row :gutter="18">
      <el-col :xs="24" :md="14">
        <div class="phone">
          <div class="phone-bar"></div>

          <!-- 列表态：商品广场 -->
          <template v-if="!current">
            <van-nav-bar title="校园二手集市" left-text="刷新" left-arrow @click-left="refresh" />

            <van-search v-model="keyword" placeholder="搜索闲置，如：键盘、教材" shape="round" />

            <div class="cat-scroll">
              <button
                v-for="item in categoryList"
                :key="item"
                type="button"
                class="cat-chip"
                :class="{ active: category === item }"
                @click="category = item"
              >
                {{ item }}
              </button>
            </div>

            <div v-loading="loading" class="mobile-list">
              <van-card
                v-for="goods in filtered"
                :key="goods.id"
                :price="Number(goods.price).toFixed(0)"
                :title="goods.title"
                :desc="goods.desc"
                currency="￥"
                @click="openDetail(goods)"
              >
                <template #thumb>
                  <div class="m-cover" :style="{ background: goods.gradient }">{{ goods.emoji }}</div>
                </template>
                <template #tags>
                  <van-tag plain type="primary" class="m-tag">{{ goods.category }}</van-tag>
                  <van-tag plain type="success" class="m-tag">{{ goods.condition }}</van-tag>
                </template>
                <template #footer>
                  <van-button size="mini" round type="primary" @click.stop="addToCart(goods)">
                    {{ cart.has(goods.id) ? '已加购' : '加购' }}
                  </van-button>
                  <van-button size="mini" round :type="favorite.has(goods.id) ? 'warning' : 'default'" @click.stop="toggleFavorite(goods)">
                    {{ favorite.has(goods.id) ? '已收藏' : '收藏' }}
                  </van-button>
                </template>
              </van-card>

              <van-empty v-if="!filtered.length && !loading" description="没有找到闲置，换个关键词试试" />
            </div>
          </template>

          <!-- 详情态：宝贝详情 + 提交栏 -->
          <template v-else>
            <van-nav-bar :title="current.category" left-text="返回" left-arrow @click-left="current = null" />

            <div class="detail-cover" :style="{ background: current.gradient }">
              <span class="detail-emoji">{{ current.emoji }}</span>
              <van-tag round type="primary" class="detail-condition">{{ current.condition }}</van-tag>
            </div>

            <div class="detail-body">
              <p class="price-big">￥{{ Number(current.price).toFixed(0) }} <small>校内面交 · 免运费</small></p>
              <h3>{{ current.title }}</h3>
              <p class="desc">{{ current.desc }}</p>
              <p class="seller small muted">
                <el-icon><User /></el-icon>
                卖家 {{ sellerName(current.sellerId) }} · 编号 {{ current.id }}
              </p>
            </div>

            <!-- van-submit-bar：移动端下单栏 -->
            <van-submit-bar
              :price="Math.round(Number(current.price) * 100)"
              button-text="立即购买"
              label="合计："
              @submit="buyNow"
            >
              <template #tip>
                <div class="submit-tip">
                  <van-button size="small" round :disabled="cart.has(current.id)" type="primary" plain @click="addToCart(current)">
                    {{ cart.has(current.id) ? '已在购物车' : '加入购物车' }}
                  </van-button>
                  <span>先面交验货，再确认付款</span>
                </div>
              </template>
            </van-submit-bar>
          </template>

          <van-tabbar v-model="tab" :fixed="false" active-color="#00b578">
            <van-tabbar-item icon="shop-o" @click="goMarket">广场</van-tabbar-item>
            <van-tabbar-item icon="star-o" :badge="favCount || ''" @click="goMarket">收藏</van-tabbar-item>
            <van-tabbar-item icon="shopping-cart-o" :badge="totalCount || ''" @click="$router.push('/cart')">购物车</van-tabbar-item>
            <van-tabbar-item icon="user-o" @click="$router.push('/center')">我的</van-tabbar-item>
          </van-tabbar>
        </div>

        <p class="small muted center">↑ 点卡片看详情，详情里可以加购或立即购买</p>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="card">
          <h2>我的购物车</h2>
          <p class="muted">手机上加购的闲置会与电脑端同步，选好就约面交。</p>
          <div class="stats">
            <div class="stat">
              <span>购物车</span>
              <b>{{ totalCount }} 件</b>
            </div>
            <div class="stat">
              <span>合计</span>
              <b>￥{{ totalPrice.toFixed(0) }}</b>
            </div>
          </div>
          <el-button type="primary" @click="$router.push('/cart')">去购物车约面交</el-button>
        </div>

        <div class="card card--accent">
          <h2>使用说明</h2>
          <p class="muted small">
            这是题目 G3 的移动端买家场景：商品广场（van-card 列表 + van-search 搜索 +
            van-tag 标签）→ 宝贝详情（van-submit-bar 提交栏）。购物车、收藏与桌面端
            共用同一份 Pinia 仓库并持久化到 localStorage，刷新不丢。
          </p>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ElMessage } from 'element-plus'
import { fetchGoods, fetchUsers } from '../api/goods'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { CATEGORIES } from '../../shared/goods.js'

export default {
  name: 'MobileView',
  data() {
    return {
      goodsList: [],
      users: [],
      keyword: '',
      category: '全部',
      tab: 0,
      current: null, // 详情态：当前查看的商品
      loading: true
    }
  },
  computed: {
    ...mapState(useCartStore, ['totalCount', 'totalPrice']),
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
    // computed 组合筛选：关键词 × 分类
    filtered() {
      const word = this.keyword.trim().toLowerCase()
      return this.goodsList
        .filter((goods) => goods.status === '在售')
        .filter((goods) => {
          const hitWord =
            !word ||
            goods.title.toLowerCase().includes(word) ||
            goods.desc.toLowerCase().includes(word)
          const hitCategory = this.category === '全部' || goods.category === this.category
          return hitWord && hitCategory
        })
    }
  },
  async mounted() {
    await this.refresh()
  },
  methods: {
    async refresh() {
      this.loading = true
      try {
        const [goods, users] = await Promise.all([fetchGoods(), fetchUsers()])
        this.goodsList = goods
        this.users = users
      } catch {
        ElMessage.error('加载失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    sellerName(id) {
      const hit = this.users.find((user) => String(user.id) === String(id))
      return hit ? hit.name : '同学'
    },
    openDetail(goods) {
      this.current = goods
    },
    addToCart(goods) {
      const ok = this.cart.add(goods, this.sellerName(goods.sellerId))
      ElMessage[ok ? 'success' : 'warning'](
        ok ? '已加入购物车' : '这件宝贝已经在购物车里啦'
      )
    },
    toggleFavorite(goods) {
      const added = this.favorite.toggle(goods.id)
      ElMessage[added ? 'success' : 'info'](added ? '已收藏' : '已取消收藏')
    },
    buyNow() {
      this.cart.add(this.current, this.sellerName(this.current.sellerId))
      this.$router.push('/cart')
    },
    goMarket() {
      this.current = null
    }
  }
}
</script>

<style scoped>
.phone {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
}

.cat-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 10px 10px;
  scrollbar-width: none;
}

.cat-scroll::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  flex-shrink: 0;
  padding: 4px 12px;
  margin: 0;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}

.cat-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.mobile-list {
  min-height: 320px;
  max-height: 360px;
  overflow-y: auto;
  padding: 0 10px 10px;
}

.m-cover {
  width: 84px;
  height: 84px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 36px;
}

.m-tag {
  margin-right: 6px;
}

/* 详情态 */
.detail-cover {
  height: 210px;
  display: grid;
  place-items: center;
  position: relative;
}

.detail-emoji {
  font-size: 86px;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.2));
}

.detail-condition {
  position: absolute;
  left: 14px;
  top: 14px;
}

.detail-body {
  padding: 12px 14px 16px;
}

.price-big {
  color: var(--accent);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
}

.price-big small {
  font-size: 12px;
  color: var(--muted);
  font-weight: 400;
  margin-left: 8px;
}

.detail-body h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.desc {
  margin: 0 0 10px;
  font-size: 13px;
  color: #5f5650;
  line-height: 1.8;
  background: #f7faf8;
  border-radius: 8px;
  padding: 8px 12px;
}

.seller {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}

.submit-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--muted);
}

.center {
  text-align: center;
}

.stats {
  display: flex;
  gap: 12px;
  margin: 12px 0 16px;
}

.stat {
  flex: 1;
  background: var(--primary-bg);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}

.stat span {
  font-size: 12px;
  color: var(--muted);
}

.stat b {
  font-size: 20px;
  color: var(--primary-dark);
}

@media (max-width: 992px) {
  :deep(.el-col) {
    margin-bottom: 14px;
  }
}
</style>
