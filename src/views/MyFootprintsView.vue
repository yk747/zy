<!-- ============================================================
  MyFootprintsView.vue —— 最近浏览足迹
  浏览商品详情时由 GoodsDetailView 写入 localStorage，这里按用户回看。
  ============================================================ -->
<template>
  <div class="footprint-wrap">
    <div class="head-row">
      <div>
        <h2>最近浏览</h2>
        <p class="small muted">记录你最近看过的宝贝，最多保留 30 件</p>
      </div>
      <el-button v-if="list.length" plain size="small" @click="clearAll">清空足迹</el-button>
    </div>

    <div v-if="list.length" class="foot-grid">
      <div v-for="item in list" :key="item.id" v-ripple class="foot-item" @click="goDetail(item.id)">
        <div class="foot-cover" :style="{ background: item.gradient }">
          <GoodsImage :goods="item" emoji-size="34px" />
        </div>
        <div class="foot-main">
          <b>{{ item.title }}</b>
          <span class="price">￥{{ Number(item.price).toFixed(0) }}</span>
          <span class="small muted">{{ item.category }} · {{ shortTime(item.viewedAt) }}</span>
        </div>
      </div>
    </div>
    <el-empty v-else description="还没有浏览记录，去集市逛逛吧" :image-size="80">
      <el-button type="primary" @click="$router.push('/market')">去逛集市</el-button>
    </el-empty>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import GoodsImage from '../components/GoodsImage.vue'
import { getFootprints, clearFootprints } from '../api/community'
import { useUserStore } from '../store/user'

export default {
  name: 'MyFootprintsView',
  components: { GoodsImage },
  computed: {
    list() {
      return getFootprints(useUserStore().id)
    }
  },
  methods: {
    goDetail(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    },
    async clearAll() {
      try {
        await ElMessageBox.confirm('确定清空全部浏览足迹吗？', '清空足迹', {
          type: 'warning',
          confirmButtonText: '确认清空',
          cancelButtonText: '取消'
        })
      } catch {
        return
      }
      clearFootprints(useUserStore().id)
      ElMessage.success('足迹已清空')
    },
    shortTime(value) {
      if (!value) return ''
      const date = new Date(value)
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.head-row h2 {
  font-size: 18px;
  margin: 0 0 4px;
}

.foot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.foot-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.foot-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.foot-cover {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.foot-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.foot-main b {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
