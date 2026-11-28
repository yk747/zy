<!-- ============================================================
  GoodsImage.vue —— 商品实拍图（带 emoji 兜底）
  图片来自本地 public/images/goods/，由 goodsImage() 统一匹配。
  加载成功淡入；图片缺失或加载失败时，自动露出原来的 emoji + 渐变底。
  ============================================================ -->
<template>
  <span class="goods-image" :style="{ background: goods.gradient }">
    <span
      class="goods-image-emoji"
      :style="{ fontSize: emojiSize, transform: emojiTransform }"
      aria-hidden="true"
    >
      {{ goods.emoji || '📦' }}
    </span>
    <img
      v-if="src"
      :src="src"
      :alt="alt || goods.title || '商品图片'"
      loading="lazy"
      :style="{ objectFit: fit, objectPosition: position }"
      :class="{ ready }"
      @load="ready = true"
      @error="failed = true"
    />
  </span>
</template>

<script>
import { goodsImage } from '../api/goodsImages'

export default {
  name: 'GoodsImage',
  props: {
    goods: { type: Object, required: true },
    alt: { type: String, default: '' },
    fit: { type: String, default: 'cover' },
    position: { type: String, default: 'center' },
    emojiSize: { type: String, default: '54px' },
    emojiTransform: { type: String, default: '' }
  },
  data() {
    return { failed: false, ready: false }
  },
  computed: {
    src() {
      return this.failed ? '' : goodsImage(this.goods)
    }
  },
  watch: {
    'goods.id'() {
      this.failed = false
      this.ready = false
    }
  }
}
</script>

<style scoped>
.goods-image {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.goods-image-emoji {
  line-height: 1;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.2));
  transition: transform 0.25s ease;
}

.goods-image img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.28s ease;
}

.goods-image img.ready {
  opacity: 1;
}
</style>
