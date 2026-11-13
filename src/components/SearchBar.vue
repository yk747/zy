<!-- ============================================================
  SearchBar.vue —— 自封装通用搜索栏（题目 T2：props + emit）
  父组件：
    · props.modelValue 传初始关键词（v-model 双向绑定）
    · 子组件 emit('update:modelValue') 回传输入、emit('search') 通知搜索
  ============================================================ -->
<template>
  <el-input
    class="search-bar"
    :model-value="modelValue"
    :placeholder="placeholder"
    size="large"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
    @keyup.enter="$emit('search', $event.target.value)"
    @clear="$emit('search', '')"
  >
    <template #prefix><el-icon><Search /></el-icon></template>
    <template #append>
      <el-button @click="$emit('search', modelValue)">搜索</el-button>
    </template>
  </el-input>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '搜索闲置好物，如：键盘、教材' }
  },
  emits: ['update:modelValue', 'search']
}
</script>

<style scoped>
.search-bar {
  max-width: 460px;
}

.search-bar :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--border) inset;
  background: var(--card);
}

.search-bar :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset, 0 0 0 4px rgba(0, 181, 120, 0.12);
}

.search-bar :deep(.el-input-group__append) {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 0 999px 999px 0;
}
</style>
