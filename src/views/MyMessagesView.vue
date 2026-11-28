<!-- ============================================================
  MyMessagesView.vue —— 消息中心
  ① 咨询会话收件箱：与详情页共用 localStorage 会话数据
  ② 订单状态通知：下单 / 完成 / 收到评价时生成
  ③ 系统公告：平台 fixed 公告
  ============================================================ -->
<template>
  <div class="messages-wrap">
    <el-tabs v-model="tab">
      <el-tab-pane :label="`咨询消息${unread ? ` (${unread})` : ''}`" name="chats" />
      <el-tab-pane :label="`通知${noticeUnread ? ` (${noticeUnread})` : ''}`" name="notices" />
      <el-tab-pane label="系统公告" name="announcements" />
    </el-tabs>

    <!-- 咨询会话 -->
    <div v-if="tab === 'chats'" class="chat-layout">
      <div class="conv-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          v-ripple
          class="conv-item"
          :class="{ active: activeId === conv.id }"
          @click="openConv(conv)"
        >
          <el-avatar :size="38">{{ (conv.peerName || '卖').slice(0, 1) }}</el-avatar>
          <div class="conv-main">
            <div class="conv-line">
              <b>{{ conv.peerName || '卖家' }}</b>
              <span class="small muted">{{ shortTime(conv.updatedAt) }}</span>
              <el-badge v-if="conv.unread" :value="conv.unread" />
            </div>
            <div class="conv-goods">{{ conv.goodsTitle }}</div>
            <div class="conv-last">{{ lastMessage(conv) }}</div>
          </div>
        </div>
        <el-empty v-if="!conversations.length" description="还没有咨询记录，去集市看看心动的宝贝吧" :image-size="70">
          <el-button type="primary" @click="$router.push('/market')">去逛集市</el-button>
        </el-empty>
      </div>

      <div class="chat-panel">
        <template v-if="activeConv">
          <div class="panel-head">
            <b>{{ activeConv.peerName || '卖家' }}</b>
            <span class="small muted">关于「{{ activeConv.goodsTitle }}」</span>
            <el-button link type="primary" size="small" @click="goGoods(activeConv.goodsId)">查看宝贝</el-button>
          </div>
          <div ref="panelBox" class="panel-msgs">
            <div
              v-for="(msg, index) in activeConv.messages"
              :key="index"
              class="msg"
              :class="msg.from === 'me' ? 'msg--me' : 'msg--seller'"
            >
              <span class="bubble">{{ msg.text }}</span>
            </div>
          </div>
          <div class="panel-input">
            <el-input v-model="replyText" placeholder="继续咨询…" maxlength="120" @keyup.enter="sendReply" />
            <el-button type="primary" :disabled="!replyText.trim()" @click="sendReply">发送</el-button>
          </div>
        </template>
        <el-empty v-else description="左侧选择一条会话开始查看" :image-size="80" />
      </div>
    </div>

    <!-- 通知 -->
    <div v-else-if="tab === 'notices'" class="notice-list">
      <div class="notice-head">
        <span class="small muted">共 {{ notifications.length }} 条通知</span>
        <el-button v-if="noticeUnread" link type="primary" size="small" @click="readAll">全部标为已读</el-button>
      </div>
      <div
        v-for="notice in notifications"
        :key="notice.id"
        v-ripple
        class="notice-item"
        :class="{ unread: !notice.read }"
      >
        <div class="notice-icon" :class="`notice-icon--${notice.type}`">
          <el-icon><Bell /></el-icon>
        </div>
        <div class="notice-main">
          <b>{{ notice.title }}</b>
          <p>{{ notice.content }}</p>
          <span class="small muted">{{ shortTime(notice.createdAt) }}</span>
        </div>
      </div>
      <el-empty v-if="!notifications.length" description="暂无通知，交易动态会在这里提醒你" :image-size="70" />
    </div>

    <!-- 系统公告 -->
    <div v-else class="notice-list">
      <div
        v-for="item in announcements"
        :key="item.id"
        class="notice-item"
      >
        <div class="notice-icon notice-icon--system">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="notice-main">
          <b>{{ item.title }}</b>
          <p>{{ item.content }}</p>
          <span class="small muted">{{ item.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import {
  getConversations,
  markConversationRead,
  appendMessage,
  getNotifications,
  unreadCount,
  markAllNotificationsRead,
  ANNOUNCEMENTS
} from '../api/community'
import { useUserStore } from '../store/user'

export default {
  name: 'MyMessagesView',
  data() {
    return {
      tab: 'chats',
      conversations: [],
      notifications: [],
      activeId: '',
      replyText: '',
      announcements: ANNOUNCEMENTS
    }
  },
  computed: {
    me() {
      return useUserStore()
    },
    activeConv() {
      return this.conversations.find((c) => c.id === this.activeId) || null
    },
    unread() {
      return this.conversations.reduce((sum, c) => sum + (c.unread || 0), 0)
    },
    noticeUnread() {
      return unreadCount(this.me.id)
    }
  },
  watch: {
    tab(value) {
      if (value === 'notices') this.refresh()
    }
  },
  async mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.conversations = getConversations(this.me.id)
      this.notifications = getNotifications(this.me.id)
      if (!this.activeId && this.conversations.length) this.activeId = this.conversations[0].id
    },
    openConv(conv) {
      this.activeId = conv.id
      markConversationRead(conv.id)
      conv.unread = 0
      this.$nextTick(() => this.$refs.panelBox?.scrollTo({ top: 9999 }))
    },
    sendReply() {
      const text = this.replyText.trim()
      const conv = this.activeConv
      if (!text || !conv) return
      appendMessage({
        userId: this.me.id,
        peerId: conv.peerId,
        peerName: conv.peerName,
        goodsId: conv.goodsId,
        goodsTitle: conv.goodsTitle,
        from: 'me',
        text
      })
      this.replyText = ''
      this.refresh()
      this.activeId = conv.id
      this.$nextTick(() => this.$refs.panelBox?.scrollTo({ top: 9999, behavior: 'smooth' }))
      ElMessage.success('消息已发送')
    },
    readAll() {
      markAllNotificationsRead(this.me.id)
      this.refresh()
    },
    goGoods(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    },
    lastMessage(conv) {
      const list = conv.messages || []
      return list.length ? list[list.length - 1].text : '暂无消息'
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
.chat-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: 420px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.conv-list {
  border-right: 1px solid var(--border);
  overflow-y: auto;
  max-height: 520px;
}

.conv-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.conv-item:hover,
.conv-item.active {
  background: var(--primary-bg);
}

.conv-main {
  flex: 1;
  min-width: 0;
}

.conv-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.conv-line .small {
  margin-left: auto;
}

.conv-goods,
.conv-last {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-head .el-button {
  margin-left: auto;
}

.panel-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-soft, #fafbfc);
  min-height: 300px;
  max-height: 420px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg--me {
  justify-content: flex-end;
}

.bubble {
  max-width: 76%;
  padding: 9px 13px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
  font-size: 13px;
  line-height: 1.55;
}

.msg--me .bubble {
  background: var(--primary, #10b981);
  color: #fff;
  border-color: transparent;
}

.panel-input {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.notice-list {
  min-height: 240px;
}

.notice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.notice-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 10px;
  position: relative;
}

.notice-item.unread::after {
  content: '';
  position: absolute;
  right: 16px;
  top: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary, #10b981);
}

.notice-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 18px;
  background: var(--primary-bg);
  color: var(--primary-dark, #0f6e56);
}

.notice-icon--review {
  background: #fef3c7;
  color: #b45309;
}

.notice-icon--order {
  background: #dbeafe;
  color: #1d4ed8;
}

.notice-main {
  flex: 1;
  min-width: 0;
}

.notice-main b {
  font-size: 14px;
}

.notice-main p {
  margin: 4px 0 6px;
  font-size: 13px;
  color: var(--text-soft);
}

@media (max-width: 760px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .conv-list {
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 220px;
  }
}
</style>
