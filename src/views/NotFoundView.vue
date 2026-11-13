<!-- ============================================================
  NotFoundView.vue —— 404 兜底页（路由表最后一条通配符）
  ============================================================ -->
<template>
  <div class="page not-found">
    <p class="code">404</p>
    <h2>这个页面走丢了</h2>
    <p class="muted">
      没有找到 <code>{{ $route.fullPath }}</code> 对应的页面，
      可能是地址拼错了，或者这件闲置已经下架。
    </p>
    <div class="actions">
      <el-button type="primary" @click="$router.push('/market')">回商品广场</el-button>
      <el-button @click="$router.push('/publish')">去发布闲置</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>

<style scoped>
.not-found {
  text-align: center;
  padding-top: 80px;
}

.code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  margin: 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.not-found h2 {
  font-size: 22px;
}

.actions {
  margin-top: 20px;
}
</style>
