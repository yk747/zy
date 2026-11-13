<!-- ============================================================
  GoodsDetailView.vue —— 闲置详情（题目 F4：动态路由 :id + 卖家信息）
  知识点：
   ① 动态路由参数：this.$route.params.id
   ② watch '$route.params.id'：详情之间跳转时组件被复用，须重新加载
   ③ 收藏 / 加购直接操作 Pinia 仓库，跨页面共享
  ============================================================ -->
<template>
  <div class="page">
    <el-button link class="back" @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon>返回
    </el-button>

    <div v-if="loading" v-loading="true" class="loading-box" element-loading-text="正在加载宝贝信息…"></div>

    <template v-else-if="goods">
      <div class="detail-grid">
        <div class="gallery">
          <div class="main-cover" :style="{ background: goods.gradient }">
            <span class="big-emoji">{{ goods.emoji }}</span>
            <span class="cover-badge">{{ goods.category }}</span>
            <span v-if="goods.status === '下架'" class="off-shelf">已下架</span>
          </div>
          <div class="thumbs">
            <div v-for="n in 3" :key="n" class="thumb" :style="{ background: goods.gradient }">
              {{ goods.emoji }}
            </div>
            <div class="thumb thumb--more">多角度实拍</div>
          </div>
        </div>

        <div class="info card">
          <h1>{{ goods.title }}</h1>

          <div class="tags">
            <span class="tag">{{ goods.category }}</span>
            <span class="tag tag--accent">{{ goods.condition }}</span>
            <span class="tag" :class="goods.status === '在售' ? '' : 'tag--warn'">{{ goods.status }}</span>
          </div>

          <div class="price-box">
            <span class="price big"><small>￥</small>{{ Number(goods.price).toFixed(0) }}</span>
            <span class="muted small">校园当面交易 · 极速交付</span>
          </div>

          <p class="desc">{{ goods.desc || '卖家暂未填写宝贝描述，具体成色可当面验货确认。' }}</p>

          <div class="meta-row">
            <span>上架时间 <b>{{ goods.createdAt || '—' }}</b></span>
            <span>宝贝编号 <b>{{ goods.id }}</b></span>
          </div>

          <!-- 卖家信息（题目 F4 要求） -->
          <div class="seller">
            <el-avatar :size="42" class="seller-avatar">{{ seller.name?.slice(0, 1) || '同' }}</el-avatar>
            <div class="seller-main">
              <b>{{ seller.name || '同学' }} <el-tag size="small" effect="plain">实名认证</el-tag></b>
              <span class="small muted">校区：{{ seller.dorm || '交付地点可协商' }} · 在售 {{ sellerGoodsCount }} 件</span>
            </div>
            <el-button size="small" round @click="contactSeller">
              <el-icon><ChatDotRound /></el-icon>咨询卖家
            </el-button>
          </div>

          <div class="buy-row">
            <el-button
              type="primary"
              size="large"
              :disabled="goods.status === '下架' || cart.has(goods.id)"
              @click="addToCart"
            >
              <el-icon><ShoppingCart /></el-icon>{{ cart.has(goods.id) ? '已在购物车' : '加入购物车' }}
            </el-button>
            <el-button size="large" :disabled="goods.status === '下架'" @click="buyNow">立即下单</el-button>
            <el-button size="large" :type="favorite.has(goods.id) ? 'warning' : 'default'" plain @click="toggleFavorite">
              <el-icon><Star /></el-icon>{{ favorite.has(goods.id) ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>

      <SectionCard title="同类好物推荐" subtitle="为你精选的同类优质宝贝" plain>
        <div class="related-grid">
          <div v-for="item in related" :key="item.id" class="mini-product" @click="openGoods(item.id)">
            <div class="mini-cover" :style="{ background: item.gradient }">{{ item.emoji }}</div>
            <div class="mini-text">
              <b>{{ item.title }}</b>
              <small class="price">￥{{ Number(item.price).toFixed(0) }}</small>
            </div>
            <el-icon class="mini-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
        <el-empty v-if="!related.length" description="该品类暂无其他在售宝贝" :image-size="70" />
      </SectionCard>
    </template>

    <el-empty v-else description="该宝贝已下架或不存在，看看其他好物吧">
      <el-button type="primary" @click="$router.push('/market')">返回闲置集市</el-button>
    </el-empty>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import SectionCard from '../components/SectionCard.vue'
import { fetchGoods, fetchGoodsById, fetchUsers } from '../api/goods'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'

export default {
  name: 'GoodsDetailView',
  components: { SectionCard },
  data() {
    return {
      goods: null,
      related: [],
      seller: {},
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
    sellerGoodsCount() {
      return this.related.length + 1
    }
  },
  watch: {
    // 详情页之间互相跳转时组件会被复用，必须监听参数重新加载
    '$route.params.id'() {
      this.load()
    }
  },
  async mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      const id = this.$route.params.id
      this.goods = await fetchGoodsById(id)
      if (this.goods) {
        const [all, users] = await Promise.all([fetchGoods(), fetchUsers()])
        this.users = users
        this.seller = users.find((user) => String(user.id) === String(this.goods.sellerId)) || {}
        this.related = all
          .filter(
            (item) =>
              item.category === this.goods.category &&
              String(item.id) !== String(id) &&
              item.status === '在售'
          )
          .slice(0, 3)
      }
      this.loading = false
    },
    addToCart() {
      const ok = this.cart.add(this.goods, this.seller.name || '同学')
      ElMessage[ok ? 'success' : 'warning'](ok ? '已加入购物车' : '该宝贝已在购物车中')
    },
    buyNow() {
      this.cart.add(this.goods, this.seller.name || '同学')
      this.$router.push('/cart')
    },
    toggleFavorite() {
      const added = this.favorite.toggle(this.goods.id)
      ElMessage[added ? 'success' : 'info'](added ? '已收藏' : '已取消收藏')
    },
    contactSeller() {
      ElMessage.info(`可前往「${this.seller.dorm || '校内'}」与 ${this.seller.name || '卖家'} 当面验货交易`)
    },
    openGoods(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    }
  }
}
</script>

<style scoped>
.back {
  margin-bottom: 6px;
}

.loading-box {
  height: 300px;
  border-radius: var(--radius);
  background: #fff;
  border: 1px solid var(--border);
}

.detail-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  margin-top: 8px;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-cover {
  position: relative;
  height: 360px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.main-cover::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  right: -60px;
  bottom: -80px;
}

.big-emoji {
  font-size: 140px;
  filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.22));
}

.cover-badge {
  position: absolute;
  left: 16px;
  top: 16px;
  padding: 2px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--primary-dark);
  font-size: 12px;
}

.off-shelf {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.55);
  color: var(--muted);
  font-size: 16px;
  letter-spacing: 6px;
}

.thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.thumb {
  height: 64px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.thumb--more {
  background: #fbfaf9 !important;
  color: var(--muted);
  font-size: 11px;
  border: 1px dashed var(--border);
  text-align: center;
}

.info {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.info h1 {
  font-size: 24px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.info h1::after {
  width: 48px;
  height: 3px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 12px;
  background: linear-gradient(90deg, #fff1e8, #fff9f4);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
}

.price.big {
  font-size: 32px;
  line-height: 1.1;
}

.desc {
  color: #5f5650;
  background: #fbfaf9;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 0 0 12px;
  line-height: 1.8;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}

.meta-row b {
  color: var(--text);
}

.seller {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #f2fbf7, #ffffff);
}

.seller-avatar {
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.seller-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller-main b {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.buy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mini-product {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.mini-product:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.mini-cover {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 24px;
  flex-shrink: 0;
}

.mini-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mini-text b {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-arrow {
  margin-left: auto;
  color: var(--muted);
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .main-cover {
    height: 260px;
  }

  .big-emoji {
    font-size: 100px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
