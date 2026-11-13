<!-- ============================================================
  MyGoodsView.vue —— 我的发布（题目 E6：管理上下架，put）
  知识点：
   ① computed 过滤出 sellerId 等于当前登录同学的发布
   ② 上架/下架走 PUT /goods/:id，删除走 DELETE /goods/:id
   ③ 复用 GoodsFormDialog 做编辑（弹窗 + put）
  ============================================================ -->
<template>
  <div class="my-goods">
    <div v-loading="loading" class="goods-area" element-loading-text="正在加载你的发布…">
      <template v-if="myGoods.length">
        <div v-for="goods in myGoods" :key="goods.id" class="publish-item">
          <div class="cover" :style="{ background: goods.gradient }">{{ goods.emoji }}</div>

          <div class="main">
            <b class="title" @click="goDetail(goods.id)">{{ goods.title }}</b>
            <div class="meta">
              <span class="tag">{{ goods.category }}</span>
              <span class="tag tag--accent">{{ goods.condition }}</span>
              <span class="small muted">编号 {{ goods.id }} · 发布于 {{ goods.createdAt }}</span>
            </div>
          </div>

          <div class="price-col">
            <span class="price">￥{{ Number(goods.price).toFixed(0) }}</span>
            <el-tag :type="goods.status === '在售' ? 'success' : 'info'" size="small" effect="plain">
              {{ goods.status }}
            </el-tag>
          </div>

          <div class="ops">
            <el-button size="small" @click="openEdit(goods)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button
              size="small"
              :type="goods.status === '在售' ? 'warning' : 'success'"
              plain
              :loading="togglingId === goods.id"
              @click="toggleStatus(goods)"
            >
              {{ goods.status === '在售' ? '下架' : '重新上架' }}
            </el-button>
            <el-button size="small" type="danger" plain @click="removeGoods(goods)">删除</el-button>
          </div>
        </div>
      </template>

      <el-empty v-else-if="!loading" description="你还没有发布过闲置，去赚第一桶金吧">
        <el-button type="primary" @click="$router.push('/publish')">发布闲置</el-button>
      </el-empty>
    </div>

    <!-- 编辑弹窗（复用发布表单组件） -->
    <GoodsFormDialog v-model="editVisible" :goods="editingGoods" @saved="load" />
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import GoodsFormDialog from '../components/GoodsFormDialog.vue'
import { fetchGoods, updateGoods, removeGoods as removeGoodsApi } from '../api/goods'
import { useUserStore } from '../store/user'

export default {
  name: 'MyGoodsView',
  components: { GoodsFormDialog },
  data() {
    return {
      goodsList: [],
      loading: true,
      editVisible: false,
      editingGoods: null,
      togglingId: ''
    }
  },
  computed: {
    // 只显示我自己发布的（题目 E6 的"我的发布"）
    myGoods() {
      const me = useUserStore()
      return this.goodsList.filter((goods) => String(goods.sellerId) === String(me.id))
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        this.goodsList = await fetchGoods()
      } finally {
        this.loading = false
      }
    },
    goDetail(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    },
    openEdit(goods) {
      this.editingGoods = goods
      this.editVisible = true
    },
    // 上下架：put 全量字段（json-server 的 put 是整体替换）
    async toggleStatus(goods) {
      const next = goods.status === '在售' ? '下架' : '在售'
      this.togglingId = goods.id
      try {
        await updateGoods(goods.id, { ...goods, status: next })
        goods.status = next
        ElMessage.success(next === '在售' ? '已重新上架' : '已下架，广场不再展示')
      } catch (err) {
        ElMessage.error(err.message || '操作失败，请稍后再试')
      } finally {
        this.togglingId = ''
      }
    },
    async removeGoods(goods) {
      try {
        await ElMessageBox.confirm(
          `确定删除「${goods.title}」吗？删除后不可恢复。`,
          '删除确认',
          { type: 'warning' }
        )
      } catch {
        return
      }
      try {
        await removeGoodsApi(goods.id)
        this.goodsList = this.goodsList.filter((item) => String(item.id) !== String(goods.id))
        ElMessage.success('已删除')
      } catch (err) {
        ElMessage.error(err.message || '删除失败，请稍后再试')
      }
    }
  }
}
</script>

<style scoped>
.goods-area {
  min-height: 220px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 6px 18px 14px;
}

.publish-item {
  display: grid;
  grid-template-columns: 64px 1fr 110px 250px;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--border);
}

.publish-item:last-child {
  border-bottom: none;
}

.cover {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 30px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.title {
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title:hover {
  color: var(--primary-dark);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.price {
  font-size: 18px;
  font-weight: 700;
}

.ops {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 900px) {
  .publish-item {
    grid-template-columns: 52px 1fr;
    grid-template-areas:
      'cover main'
      'price price'
      'ops ops';
    row-gap: 8px;
  }

  .cover {
    grid-area: cover;
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .main {
    grid-area: main;
  }

  .price-col {
    grid-area: price;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .ops {
    grid-area: ops;
    justify-content: flex-start;
  }
}
</style>
