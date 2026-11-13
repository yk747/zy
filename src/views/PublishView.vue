<!-- ============================================================
  PublishView.vue —— 发布闲置（题目 F3：表单 post，占位图）
  表单本体封装在 GoodsFormDialog 组件里（发布/编辑两处复用），
  本页面负责：卖点介绍、发布说明、成功后的引导。
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>发布宝贝</h1>
        <p class="sub">完善宝贝信息，信息越完整，曝光与成交率越高。</p>
      </div>
      <el-tag effect="plain">提交后即刻上架 · 全程免费</el-tag>
    </div>

    <el-row :gutter="18">
      <el-col :xs="24" :md="14">
        <div class="card publish-card">
          <h2>宝贝信息</h2>
          <p class="muted small">带 * 为必填项；标题注明品牌与型号，更容易被买家搜索到。</p>

          <GoodsFormDialog ref="publishDialogRef" v-model="dialogVisible" :goods="null" @saved="onSaved" />

          <el-button type="primary" size="large" class="open-btn" @click="dialogVisible = true">
            <el-icon><CirclePlus /></el-icon>完善宝贝信息
          </el-button>

          <div v-if="lastSaved" class="saved-tip">
            <el-icon><CircleCheck /></el-icon>
            <div>
              <b>「{{ lastSaved.title }}」已成功上架</b>
              <span class="small muted">编号 {{ lastSaved.id }} · 分类 {{ lastSaved.category }} · ￥{{ lastSaved.price }}</span>
            </div>
            <el-button size="small" type="primary" plain @click="$router.push('/center/my-goods')">管理我发布的宝贝</el-button>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <SectionCard title="发布建议" subtitle="高质量描述助力快速成交">
          <ul class="tips">
            <li>标题建议包含「品牌 + 型号 + 成色」，如「罗技 K380 键盘 九成新」，命中率更高；</li>
            <li>定价可参考新品价 3—6 折，稀缺款可标注「谢绝还价」，减少沟通成本；</li>
            <li>瑕疵如实告知（划痕、缺件），提升买家信任度与成交效率；</li>
            <li>交付地点建议选择食堂、快递驿站等公共区域，安全便捷。</li>
          </ul>
          <template #footer>
            交易双方均为实名认证用户 · 平台提供信息撮合服务，请当面验货后再付款
          </template>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import GoodsFormDialog from '../components/GoodsFormDialog.vue'
import SectionCard from '../components/SectionCard.vue'

export default {
  name: 'PublishView',
  components: { GoodsFormDialog, SectionCard },
  data() {
    return {
      dialogVisible: false,
      lastSaved: null
    }
  },
  methods: {
    onSaved(goods) {
      this.lastSaved = goods
    }
  }
}
</script>

<style scoped>
.publish-card {
  min-height: 320px;
}

.publish-card h2 {
  margin-top: 0;
}

.open-btn {
  margin-top: 16px;
}

.saved-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--primary-bg);
  border: 1px solid var(--border);
  color: var(--primary-dark);
}

.saved-tip > div {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tips {
  margin: 0;
  padding-left: 18px;
  color: #5f5650;
  font-size: 13.5px;
  line-height: 2;
}
</style>
