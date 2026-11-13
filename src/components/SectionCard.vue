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
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px 22px 20px;
  margin: 14px 0;
  transition: box-shadow 0.2s ease;
}

.section-card:hover {
  box-shadow: var(--shadow-hover);
}

.section-card.is-plain {
  box-shadow: var(--shadow-sm);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f4f1;
}

.head h2 {
  margin: 0 0 2px;
}

.head h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 15px;
  margin-right: 9px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--primary-light), var(--primary-dark));
  vertical-align: -2px;
}

.body {
  padding-top: 14px;
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
