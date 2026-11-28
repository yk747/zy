<!-- ============================================================
  ProfileEditDialog.vue —— 个人资料编辑弹窗
  修改昵称 / 宿舍 / 个性签名，保存到 community.js 并同步 Pinia 用户仓库。
  ============================================================ -->
<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑个人资料"
    width="min(440px, 92vw)"
    align-center
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-position="top" @submit.prevent>
      <el-form-item label="昵称">
        <el-input v-model="form.name" maxlength="12" placeholder="你的校园昵称" />
      </el-form-item>
      <el-form-item label="宿舍 / 常用交付地点">
        <el-input v-model="form.dorm" maxlength="30" placeholder="如：东区 8 号楼 502" />
      </el-form-item>
      <el-form-item label="个性签名">
        <el-input v-model="form.signature" type="textarea" :rows="3" maxlength="60" show-word-limit placeholder="一句话介绍自己" />
      </el-form-item>
      <el-form-item label="实名认证状态">
        <el-switch v-model="form.verified" active-text="已认证" inactive-text="未认证" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存资料</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'

export default {
  name: 'ProfileEditDialog',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      form: { name: '', dorm: '', signature: '', verified: true },
      saving: false
    }
  },
  watch: {
    modelValue(open) {
      if (open) {
        const me = useUserStore()
        this.form = {
          name: me.name,
          dorm: me.dorm,
          signature: me.signature || '',
          verified: me.verified !== false
        }
      }
    }
  },
  methods: {
    save() {
      if (!this.form.name.trim()) {
        ElMessage.warning('昵称不能为空')
        return
      }
      this.saving = true
      try {
        useUserStore().updateProfile({
          name: this.form.name.trim(),
          dorm: this.form.dorm.trim(),
          signature: this.form.signature.trim(),
          verified: this.form.verified
        })
        ElMessage.success('资料已更新')
        this.$emit('saved')
        this.$emit('update:modelValue', false)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
