<!-- ============================================================
  PublishView.vue —— 发布闲置（题目 F3：表单 post，占位图）
  表单本体封装在 GoodsFormDialog 组件里（发布/编辑两处复用），
  本页面负责：卖点介绍、发布说明、成功后的引导。
  ============================================================ -->
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>发布闲置</h1>
        <p class="sub">填几句描述，拍照不如选个 emoji 占位图，买家面交时再看实物。</p>
      </div>
      <el-tag effect="plain">发布即上架到商品广场</el-tag>
    </div>

    <el-row :gutter="18">
      <el-col :xs="24" :md="14">
        <div class="card publish-card">
          <h2>闲置信息</h2>
          <p class="muted small">带 * 为必填项；标题写清品牌型号，更容易被搜索到。</p>

          <GoodsFormDialog ref="publishDialogRef" v-model="dialogVisible" :goods="null" @saved="onSaved" />

          <el-button type="primary" size="large" class="open-btn" @click="dialogVisible = true">
            <el-icon><CirclePlus /></el-icon>打开发布表单
          </el-button>

          <div v-if="lastSaved" class="saved-tip">
            <el-icon><CircleCheck /></el-icon>
            <div>
              <b>「{{ lastSaved.title }}」已发布成功</b>
              <span class="small muted">编号 {{ lastSaved.id }} · 分类 {{ lastSaved.category }} · ￥{{ lastSaved.price }}</span>
            </div>
            <el-button size="small" type="primary" plain @click="$router.push('/center/my-goods')">查看我的发布</el-button>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <SectionCard title="发布小贴士" subtitle="好描述 = 快成交">
          <ul class="tips">
            <li>标题写清「品牌 + 型号 + 成色」，比如「罗技 K380 粉色 九成新」；</li>
            <li>价格参考新品价打 3—6 折，孤品好物可以写清「不刀」；</li>
            <li>瑕疵要如实描述（划痕、缺配件），面交看货时不尴尬；</li>
            <li>约定面交地点建议选食堂、快递柜等人多的公共区域。</li>
          </ul>
          <template #footer>
            交易双方均为本校认证学生 · 平台仅提供信息展示，请当面验货
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
