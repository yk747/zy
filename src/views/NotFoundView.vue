<!-- ============================================================
  NotFoundView.vue —— 404 兜底页（路由表最后一条通配符）
  ============================================================ -->
<template>
  <div class="page not-found">
    <div class="lost-card">
      <div class="lost-emoji" aria-hidden="true">🧭</div>
      <p class="code">404</p>
      <h2>这个页面走丢了</h2>
      <p class="muted">
        页面 <code>{{ $route.fullPath }}</code> 不存在，
        可能是链接有误，或该宝贝已下架。
      </p>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/market')">返回闲置集市</el-button>
        <el-button @click="$router.push('/publish')">去发布宝贝</el-button>
      </div>
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
  padding-top: 60px;
}

.lost-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 34px 30px 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #f4fbf8 0%, #ffffff 46%);
  box-shadow: var(--shadow);
}

.lost-emoji {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 36px;
  background: var(--primary-bg);
  box-shadow: 0 12px 26px rgba(0, 181, 120, 0.16);
  animation: lost-float 4s ease-in-out infinite;
}

@keyframes lost-float {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-8px) rotate(4deg);
  }
}

.code {
  font-size: 80px;
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
