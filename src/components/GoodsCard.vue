<!-- ============================================================
  GoodsCard.vue —— 通用闲置卡片（题目 T2：props + emit，商品广场/详情复用）
  props：goods 商品对象、favorite 是否已收藏、inCart 是否已在购物车、keyword 高亮词
  emits：view 点卡片看详情 / add 加购 / fav 收藏切换
  商品图用"占位色块"：gradient 渐变 + emoji（题目 F3 允许占位图）
  ============================================================ -->
<template>
  <div v-ripple class="goods-card" @click="$emit('view', goods)">
    <div class="cover cover-art" :style="{ background: goods.gradient }">
      <GoodsImage :goods="goods" emoji-size="54px" />
      <span class="condition-tag">{{ goods.condition }}</span>
      <button class="fav-btn" :class="{ on: favorite }" type="button" @click.stop="$emit('fav', goods)">
        <el-icon><Star /></el-icon>
      </button>
      <span v-if="goods.status && goods.status !== '在售'" class="off-shelf">
        {{ goods.status === '已售' ? '已成交' : '已下架' }}
      </span>
    </div>

    <div class="body">
      <p class="title">
        <span v-highlight="keyword">{{ goods.title }}</span>
      </p>
      <div class="verified-line">
        <span class="verified-badge"><el-icon><CircleCheck /></el-icon>实名卖家</span>
        <span class="heat"><el-icon><Star /></el-icon>{{ wants }} 人想要</span>
      </div>
      <div class="meta">
        <span class="tag">{{ goods.category }}</span>
        <span class="muted small">{{ goods.createdAt }}</span>
      </div>
      <div class="foot">
        <div class="price-box">
          <span class="price"><small>￥</small>{{ Number(goods.price).toFixed(0) }}</span>
          <span v-if="originalPrice > goods.price" class="original">￥{{ originalPrice }}</span>
          <span v-if="discount" class="discount">{{ discount }}折</span>
        </div>
        <el-button
          size="small"
          type="primary"
          round
          :disabled="goods.status !== '在售' || inCart"
          @click.stop="$emit('add', goods)"
        >
          {{ inCart ? '已加购' : goods.status === '已售' ? '已成交' : '加入购物车' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import GoodsImage from './GoodsImage.vue'

export default {
  name: 'GoodsCard',
  components: { GoodsImage },
  props: {
    goods: { type: Object, required: true },
    favorite: { type: Boolean, default: false },
    inCart: { type: Boolean, default: false },
    keyword: { type: String, default: '' }
  },
  emits: ['view', 'add', 'fav'],
  computed: {
    // 热度：基于 id 的稳定哈希，刷新不跳变，纯展示用
    wants() {
      const id = String(this.goods.id || '')
      let hash = 0
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997
      return 12 + (hash % 180)
    },
    originalPrice() {
      // 八成新及以下给出参考原价，营造折扣感
      const price = Number(this.goods.price) || 0
      const discounted = /七成新|八成新/.test(this.goods.condition || '')
      return discounted ? Math.round(price * 1.25) : price
    },
    discount() {
      if (this.originalPrice <= Number(this.goods.price)) return ''
      return (Number(this.goods.price) / this.originalPrice * 10).toFixed(1)
    }
  }
}
</script>

<style scoped>
.goods-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}

.goods-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.cover {
  position: relative;
  height: 148px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, 0.35), transparent 62%);
  pointer-events: none;
}

.emoji {
  font-size: 54px;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.2));
  transition: transform 0.25s ease;
}

.goods-card:hover .emoji,
.goods-card:hover :deep(.goods-image-emoji) {
  transform: scale(1.09) rotate(-4deg);
}

.goods-card :deep(.goods-image img) {
  transition: opacity 0.28s ease, transform 0.3s ease;
}

.goods-card:hover :deep(.goods-image img) {
  transform: scale(1.06);
}

.condition-tag {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 1;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  color: var(--primary-dark);
  font-size: 11px;
  font-weight: 500;
}

.fav-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 1;
  width: 30px;
  height: 30px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(4px);
  color: var(--muted);
  cursor: pointer;
  transition: transform 0.18s, background 0.18s, color 0.18s;
}

.fav-btn:hover {
  transform: scale(1.08);
  background: #fff;
  color: #f59e0b;
}

.fav-btn.on {
  color: #f59e0b;
  animation: fav-pop 0.32s ease;
}

@keyframes fav-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.off-shelf {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.55);
  color: var(--muted);
  font-size: 14px;
  letter-spacing: 4px;
}

.body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.45;
  min-height: 39px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.verified-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--gold-bg);
  color: var(--gold);
  font-size: 10.5px;
  font-weight: 600;
}

.heat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--muted);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.price {
  font-size: 22px;
  color: var(--accent);
  font-weight: 800;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.original {
  font-size: 11px;
  color: var(--muted);
  text-decoration: line-through;
}

.discount {
  padding: 1px 5px;
  border-radius: 5px;
  background: #fff0e9;
  color: var(--accent-strong);
  font-size: 10px;
  font-weight: 700;
}

.price small {
  font-size: 12px;
}
</style>
