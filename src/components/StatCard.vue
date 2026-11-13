<!-- ============================================================
  StatCard.vue —— 统计卡片（教材 3.5 props）
  纯展示组件：数据全部由父组件通过 props 传入，自己不改任何东西。
  props 里的 icon 传字符串，配合 <component :is="icon"> 动态渲染全局图标。
  ============================================================ -->
<template>
  <div class="stat-card" :class="`tone-${tone}`">
    <div class="stat-icon">
      <el-icon :size="20"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-body">
      <p class="stat-title">{{ title }}</p>
      <p class="stat-value">
        {{ value }}<small v-if="unit">{{ unit }}</small>
      </p>
      <p v-if="hint" class="stat-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    title: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    unit: { type: String, default: '' },
    icon: { type: String, default: 'Reading' },
    tone: { type: String, default: 'green' }, // green | blue | amber | violet
    hint: { type: String, default: '' }
  }
}
</script>

<style scoped>
.stat-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px 18px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.stat-body {
  min-width: 0;
}

.stat-title {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.stat-value {
  margin: 2px 0 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.stat-value small {
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
  margin-left: 4px;
}

.stat-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.tone-green .stat-icon {
  background: var(--primary-bg);
  color: var(--primary-dark);
}

.tone-orange .stat-icon {
  background: linear-gradient(135deg, #fff1ea, #ffe3d6);
  color: var(--accent);
}

.tone-blue .stat-icon {
  background: var(--accent-bg);
  color: var(--accent);
}

.tone-amber .stat-icon {
  background: var(--warn-bg);
  color: var(--warn);
}

.tone-violet .stat-icon {
  background: #f3eefe;
  color: #7a4fd0;
}
</style>
