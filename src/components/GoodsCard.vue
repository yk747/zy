<!-- ============================================================
  GoodsCard.vue —— 通用闲置卡片（题目 T2：props + emit，商品广场/详情复用）
  props：goods 商品对象、favorite 是否已收藏、inCart 是否已在购物车、keyword 高亮词
  emits：view 点卡片看详情 / add 加购 / fav 收藏切换
  商品图用"占位色块"：gradient 渐变 + emoji（题目 F3 允许占位图）
  ============================================================ -->
<template>
  <div class="goods-card" @click="$emit('view', goods)">
    <div class="cover" :style="{ background: goods.gradient }">
      <span class="emoji">{{ goods.emoji }}</span>
      <span class="condition-tag">{{ goods.condition }}</span>
      <button class="fav-btn" :class="{ on: favorite }" type="button" @click.stop="$emit('fav', goods)">
        <el-icon><Star /></el-icon>
      </button>
      <span v-if="goods.status === '下架'" class="off-shelf">已下架</span>
    </div>

    <div class="body">
      <p class="title">
        <span v-highlight="keyword">{{ goods.title }}</span>
      </p>
      <div class="meta">
        <span class="tag">{{ goods.category }}</span>
        <span class="muted small">{{ goods.createdAt }}</span>
      </div>
      <div class="foot">
        <span class="price"><small>￥</small>{{ Number(goods.price).toFixed(0) }}</span>
        <el-button
          size="small"
          type="primary"
          round
          :disabled="goods.status === '下架' || inCart"
          @click.stop="$emit('add', goods)"
        >
          {{ inCart ? '已加购' : '加入购物车' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoodsCard',
  props: {
    goods: { type: Object, required: true },
    favorite: { type: Boolean, default: false },
    inCart: { type: Boolean, default: false },
    keyword: { type: String, default: '' }
  },
  emits: ['view', 'add', 'fav']
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
  height: 118px;
  display: grid;
  place-items: center;
}

.emoji {
  font-size: 46px;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.18));
}

.condition-tag {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 1px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--primary-dark);
  font-size: 11px;
}

.fav-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 30px;
  height: 30px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.86);
  color: var(--muted);
  cursor: pointer;
}

.fav-btn.on {
  color: #f59e0b;
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
}

.price {
  font-size: 20px;
  color: var(--accent);
  font-weight: 700;
}

.price small {
  font-size: 12px;
}
</style>
