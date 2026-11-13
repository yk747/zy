<!-- ============================================================
  SectionCard.vue —— 通用区块卡片（题目 T2：自封装组件 + 插槽）
  默认插槽放内容，#extra 放标题右侧的操作区（按钮/链接）。
  ============================================================ -->
<template>
  <section class="section-card" :class="{ 'is-plain': plain }">
    <header class="head">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle" class="sub">{{ subtitle }}</p>
      </div>
      <div class="extra"><slot name="extra" /></div>
    </header>
    <div class="body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script>
export default {
  name: 'SectionCard',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    plain: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.section-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 18px 16px;
  margin: 14px 0;
}

.section-card.is-plain {
  border-left-color: var(--border);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.head h2 {
  margin: 0 0 2px;
}

.sub {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.foot {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-size: 12px;
  color: var(--muted);
}
</style>
