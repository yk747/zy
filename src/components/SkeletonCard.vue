<!-- ============================================================
  SkeletonCard.vue —— 商品卡片骨架屏
  加载数据时先用同尺寸占位块撑住布局，避免"转圈 → 内容突然跳出来"的抖动。
  结构尺寸与 GoodsCard 保持一致，替换时页面不会发生位移。
  ============================================================ -->
<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="sk-cover shimmer"></div>
    <div class="sk-body">
      <div class="sk-line shimmer"></div>
      <div class="sk-line sk-line--short shimmer"></div>
      <div class="sk-meta"><span class="sk-chip shimmer"></span></div>
      <div class="sk-foot">
        <span class="sk-price shimmer"></span>
        <span class="sk-btn shimmer"></span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonCard'
}
</script>

<style scoped>
.skeleton-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sk-cover {
  height: 148px;
  flex-shrink: 0;
}

.sk-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.sk-line {
  height: 14px;
  border-radius: 6px;
}

.sk-line--short {
  width: 62%;
}

.sk-meta {
  height: 20px;
}

.sk-chip {
  display: inline-block;
  width: 68px;
  height: 20px;
  border-radius: 999px;
}

.sk-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sk-price {
  width: 74px;
  height: 22px;
  border-radius: 6px;
}

.sk-btn {
  width: 88px;
  height: 32px;
  border-radius: 999px;
}
</style>
