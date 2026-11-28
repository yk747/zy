<!-- ============================================================
  ReviewDialog.vue —— 交易评价弹窗
  订单完成后，买家给卖家、卖家给买家双向评分（1-5 星 + 文字）。
  通过 v-model 控制显隐，提交后 emit submitted 让父组件刷新信用数据。
  ============================================================ -->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="`评价 ${targetName || '交易伙伴'}`"
    width="min(460px, 92vw)"
    align-center
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="review-head">
      <el-avatar :size="46" class="review-avatar">{{ (targetName || '同').slice(0, 1) }}</el-avatar>
      <div>
        <b>{{ targetName || '交易伙伴' }}</b>
        <div class="small muted">{{ role === 'buyer' ? '感谢卖家的宝贝与耐心' : '感谢买家的准时与爽快' }}</div>
      </div>
    </div>

    <div class="rate-row">
      <span>总体评分</span>
      <el-rate v-model="rating" :colors="['#f5c4b3', '#ef9f27', '#1d9e75']" />
      <span class="rate-text">{{ ratingText }}</span>
    </div>

    <el-input
      v-model="content"
      type="textarea"
      :rows="3"
      maxlength="120"
      show-word-limit
      :placeholder="role === 'buyer' ? '说说宝贝成色、卖家态度…' : '说说买家是否准时、沟通是否顺畅…'"
    />

    <div class="quick-tags">
      <button v-for="tag in quickTags" :key="tag" v-ripple type="button" class="quick-tag" @click="appendTag(tag)">
        {{ tag }}
      </button>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">稍后再说</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交评价</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus'
import { addReview } from '../api/community'

export default {
  name: 'ReviewDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    order: { type: Object, default: () => ({}) },
    goods: { type: Object, default: () => ({}) },
    targetId: { type: [String, Number], default: '' },
    targetName: { type: String, default: '' },
    fromId: { type: [String, Number], default: '' },
    role: { type: String, default: 'buyer' } // buyer=我评价卖家，seller=我评价买家
  },
  emits: ['update:modelValue', 'submitted'],
  data() {
    return {
      rating: 5,
      content: '',
      submitting: false,
      quickTags: ['发货迅速', '成色如实', '沟通顺畅', '准时面交', '态度很好']
    }
  },
  computed: {
    ratingText() {
      return ['', '很不满意', '不太满意', '一般', '比较满意', '非常满意'][this.rating] || ''
    }
  },
  watch: {
    modelValue(open) {
      if (open) {
        this.rating = 5
        this.content = ''
      }
    }
  },
  methods: {
    appendTag(tag) {
      const text = this.content.trim()
      this.content = text ? `${text} ${tag}` : tag
      if (this.content.length > 120) this.content = this.content.slice(0, 120)
    },
    async submit() {
      this.submitting = true
      try {
        addReview({
          orderId: this.order.orderNo || this.order.id,
          goodsId: this.goods.goodsId || this.goods.id,
          targetId: this.targetId,
          fromId: this.fromId,
          role: this.role,
          rating: this.rating,
          content: this.content
        })
        ElMessage.success('评价已提交，信用档案已更新')
        this.$emit('submitted')
        this.$emit('update:modelValue', false)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.review-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.review-avatar {
  background: var(--primary-bg, #e8f7f0);
  color: var(--primary-dark, #0f6e56);
  font-weight: 600;
}

.rate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 14px;
}

.rate-text {
  color: var(--muted, #6b7280);
  font-size: 13px;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-tag {
  border: 1px solid var(--border, #e5e7eb);
  background: var(--card, #fff);
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 12px;
  color: var(--text-soft, #4b5563);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.quick-tag:hover {
  background: var(--primary-bg, #e8f7f0);
  border-color: var(--primary, #10b981);
  color: var(--primary-dark, #0f6e56);
}
</style>
