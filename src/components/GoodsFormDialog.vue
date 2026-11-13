<!-- ============================================================
  GoodsFormDialog.vue —— 发布/编辑闲置弹窗（题目 F3 / E6 复用）
  props：
    · modelValue 控制显隐（组件 v-model）
    · goods      传 null = 新增；传商品对象 = 编辑
  emits：update:modelValue / saved（保存成功后把记录抛给父页面）
  保存动作：新增走 POST /goods，编辑走 PUT /goods/:id（api 层带兜底）
  ============================================================ -->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑闲置信息' : '发布闲置'"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    @open="initForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
      <el-form-item label="标题" prop="title">
        <el-input
          v-focus
          v-model.trim="form.title"
          maxlength="40"
          show-word-limit
          placeholder="一句话描述你的闲置，如：罗技 K380 蓝牙键盘"
        />
      </el-form-item>

      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" style="width: 100%">
          <el-option v-for="item in categories" :key="item.name" :label="`${item.icon} ${item.name}`" :value="item.name" />
        </el-select>
      </el-form-item>

      <el-form-item label="价格" prop="price">
        <el-input-number v-model="form.price" :min="0.5" :max="99999" :precision="0" style="width: 180px" />
        <span class="form-tip">校内面交，免运费</span>
      </el-form-item>

      <el-form-item label="新旧程度" prop="condition">
        <el-radio-group v-model="form.condition">
          <el-radio-button v-for="item in conditions" :key="item" :value="item">{{ item }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="占位图" prop="emoji">
        <div class="pick-row">
          <button
            v-for="item in EMOJIS"
            :key="item"
            type="button"
            class="pick-emoji"
            :class="{ active: form.emoji === item }"
            @click="form.emoji = item"
          >
            {{ item }}
          </button>
          <div class="swatches">
            <button
              v-for="(item, index) in GRADIENTS"
              :key="index"
              type="button"
              class="swatch"
              :class="{ active: form.gradient === item }"
              :style="{ background: item }"
              @click="form.gradient = item"
            ></button>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述" prop="desc">
        <el-input
          v-model.trim="form.desc"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="成色、购买渠道、瑕疵、面交地点等，写清楚更容易卖出"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">
        {{ isEdit ? '保存修改' : '发布到广场' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus'
import { createGoods, updateGoods } from '../api/goods'
import { useUserStore } from '../store/user'
import { CATEGORIES, CONDITION_LEVELS } from '../../shared/goods.js'

const EMOJIS = ['📦', '📚', '📱', '💻', '⌨️', '🎧', '🏀', '🏸', '🛋️', '💡', '🧴', '🚲', '🎸', '🧊']
const GRADIENTS = [
  'linear-gradient(135deg, #6ee7b7, #059669)',
  'linear-gradient(135deg, #60a5fa, #6366f1)',
  'linear-gradient(135deg, #f9a8d4, #f472b6)',
  'linear-gradient(135deg, #fde68a, #f59e0b)',
  'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
  'linear-gradient(135deg, #a5b4fc, #4f46e5)'
]

export default {
  name: 'GoodsFormDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    goods: { type: Object, default: null }
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      categories: CATEGORIES,
      conditions: CONDITION_LEVELS,
      EMOJIS,
      GRADIENTS,
      saving: false,
      form: {
        title: '',
        category: '教材书籍',
        price: 10,
        condition: '九成新',
        emoji: '📦',
        gradient: GRADIENTS[0],
        desc: ''
      },
      rules: {
        title: [
          { required: true, message: '请填写标题', trigger: 'blur' },
          { min: 4, max: 40, message: '标题 4—40 个字符', trigger: 'blur' }
        ],
        category: [{ required: true, message: '请选择分类', trigger: 'change' }],
        price: [{ required: true, message: '请填写价格', trigger: 'blur' }],
        condition: [{ required: true, message: '请选择新旧程度', trigger: 'change' }],
        desc: [{ min: 5, max: 200, message: '描述 5—200 个字符', trigger: 'blur' }]
      }
    }
  },
  computed: {
    isEdit() {
      return Boolean(this.goods && this.goods.id)
    }
  },
  watch: {
    // 带值指令之外的第二种 watch 用法：编辑对象变化时同步表单
    goods() {
      if (this.modelValue) this.initForm()
    }
  },
  methods: {
    initForm() {
      if (this.goods) {
        this.form = {
          title: this.goods.title,
          category: this.goods.category,
          price: Number(this.goods.price),
          condition: this.goods.condition,
          emoji: this.goods.emoji,
          gradient: this.goods.gradient,
          desc: this.goods.desc
        }
      } else {
        this.form = {
          title: '',
          category: '教材书籍',
          price: 10,
          condition: '九成新',
          emoji: '📦',
          gradient: GRADIENTS[0],
          desc: ''
        }
      }
      this.$nextTick(() => this.$refs.formRef?.clearValidate())
    },
    save() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning('请先补全必填信息')
          return
        }
        this.saving = true
        try {
          const user = useUserStore()
          let result
          if (this.isEdit) {
            // PUT：编辑自己的商品
            result = await updateGoods(this.goods.id, { ...this.goods, ...this.form })
            ElMessage.success('修改已保存')
          } else {
            // POST：sellerId 用当前登录同学的 id
            result = await createGoods({ ...this.form, sellerId: user.id })
            ElMessage.success('发布成功，已上架到商品广场')
          }
          this.$emit('update:modelValue', false)
          this.$emit('saved', result)
        } catch (err) {
          ElMessage.error(err.message || '保存失败，请稍后再试')
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>

<style scoped>
.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--muted);
}

.pick-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pick-emoji {
  width: 34px;
  height: 34px;
  padding: 0;
  margin: 0 6px 0 0;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
}

.pick-emoji.active,
.swatch.active {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 26px;
  height: 26px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
</style>
