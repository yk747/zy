<!-- ============================================================
  GoodsDetailView.vue —— 闲置详情（题目 F4：动态路由 :id + 卖家信息）
  知识点：
   ① 动态路由参数：this.$route.params.id
   ② watch '$route.params.id'：详情之间跳转时组件被复用，须重新加载
   ③ 收藏 / 加购直接操作 Pinia 仓库，跨页面共享
  ============================================================ -->
<template>
  <div class="page">
    <el-button link class="back" @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon>返回
    </el-button>

    <div v-if="loading" v-loading="true" class="loading-box" element-loading-text="正在加载宝贝信息…"></div>

    <template v-else-if="goods">
      <div class="detail-grid">
        <div class="gallery">
          <div class="main-cover cover-art" :style="{ background: goods.gradient }">
            <GoodsImage
              :goods="goods"
              emoji-size="120px"
              :emoji-transform="currentView.transform"
              :position="currentView.position"
            />
            <span class="cover-badge">{{ goods.category }} · {{ currentView.label }}</span>
            <span v-if="goods.status && goods.status !== '在售'" class="off-shelf">
              {{ goods.status === '已售' ? '已 成 交' : '已 下 架' }}
            </span>
          </div>
          <div class="thumbs">
            <button
              v-for="(view, index) in views"
              :key="index"
              v-ripple
              type="button"
              class="thumb"
              :class="{ active: activeThumb === index }"
              :style="{ background: goods.gradient }"
              :aria-label="`查看${view.label}`"
              @click="activeThumb = index"
            >
              <GoodsImage
                :goods="goods"
                emoji-size="26px"
                :emoji-transform="view.thumbTransform"
                :position="view.position"
              />
            </button>
            <div class="thumb thumb--more">多角度实拍</div>
          </div>
        </div>

        <div class="info card">
          <h1>{{ goods.title }}</h1>

          <div class="tags">
            <span class="tag">{{ goods.category }}</span>
            <span class="tag tag--accent">{{ goods.condition }}</span>
            <span class="tag" :class="goods.status === '在售' ? '' : 'tag--warn'">{{ goods.status }}</span>
          </div>

          <div class="price-box">
            <span class="price big"><small>￥</small>{{ Number(goods.price).toFixed(0) }}</span>
            <span class="muted small">校园当面交易 · 极速交付</span>
          </div>

          <p class="desc">{{ goods.desc || '卖家暂未填写宝贝描述，具体成色可当面验货确认。' }}</p>

          <div class="meta-row">
            <span>上架时间 <b>{{ goods.createdAt || '—' }}</b></span>
            <span>宝贝编号 <b>{{ goods.id }}</b></span>
          </div>

          <!-- 卖家信息（题目 F4 要求） -->
          <div class="seller">
            <el-avatar :size="42" class="seller-avatar">{{ seller.name?.slice(0, 1) || '同' }}</el-avatar>
            <div class="seller-main">
              <b>
                {{ seller.name || '同学' }}
                <el-tag v-if="seller.verified !== false" size="small" type="success" effect="plain">
                  <el-icon><CircleCheck /></el-icon>实名认证
                </el-tag>
              </b>
              <span class="small muted">
                评分 <b class="score">{{ rating.score }}</b> · {{ rating.count }} 条评价
                · 在售 {{ sellerGoodsCount }} 件
              </span>
              <span class="small muted">校区：{{ seller.dorm || '交付地点可协商' }}</span>
              <el-rate v-if="rating.count" :model-value="Number(rating.score)" disabled size="small" />
            </div>
            <el-button size="small" round @click="contactSeller">
              <el-icon><ChatDotRound /></el-icon>咨询卖家
            </el-button>
          </div>

          <div class="buy-row">
            <el-button
              type="primary"
              size="large"
              :disabled="goods.status !== '在售' || cart.has(goods.id)"
              @click="addToCart"
            >
              <el-icon><ShoppingCart /></el-icon>{{
                goods.status === '已售' ? '已成交' : cart.has(goods.id) ? '已在购物车' : '加入购物车'
              }}
            </el-button>
            <el-button size="large" :disabled="goods.status !== '在售'" @click="buyNow">立即下单</el-button>
            <el-button size="large" :type="favorite.has(goods.id) ? 'warning' : 'default'" plain @click="toggleFavorite">
              <el-icon><Star /></el-icon>{{ favorite.has(goods.id) ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>

      <SectionCard title="同类好物推荐" subtitle="为你精选的同类优质宝贝" plain>
        <div class="related-grid">
          <div v-ripple v-for="item in related" :key="item.id" class="mini-product" @click="openGoods(item.id)">
            <div class="mini-cover" :style="{ background: item.gradient }">
              <GoodsImage :goods="item" emoji-size="26px" />
            </div>
            <div class="mini-text">
              <b>{{ item.title }}</b>
              <small class="price">￥{{ Number(item.price).toFixed(0) }}</small>
            </div>
            <el-icon class="mini-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
        <el-empty v-if="!related.length" description="该品类暂无其他在售宝贝" :image-size="70" />
      </SectionCard>

      <SectionCard v-if="recommended.length" title="猜你喜欢" :subtitle="recommendHint" plain>
        <div class="related-grid">
          <div v-ripple v-for="item in recommended" :key="item.id" class="mini-product" @click="openGoods(item.id)">
            <div class="mini-cover" :style="{ background: item.gradient }">
              <GoodsImage :goods="item" emoji-size="26px" />
            </div>
            <div class="mini-text">
              <b>{{ item.title }}</b>
              <small class="price">￥{{ Number(item.price).toFixed(0) }}</small>
            </div>
            <el-icon class="mini-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </SectionCard>
    </template>

    <el-empty v-else description="该宝贝已下架或不存在，看看其他好物吧">
      <el-button type="primary" @click="$router.push('/market')">返回闲置集市</el-button>
    </el-empty>

    <!-- 咨询卖家：本地会话弹窗，快捷问题 + 消息记录 + 发送回复 -->
    <el-dialog
      v-model="consultVisible"
      :title="`咨询 ${seller.name || '卖家'}`"
      width="min(480px, 92vw)"
      align-center
      class="consult-dialog"
    >
      <div class="seller-line">
        <el-avatar :size="38" class="seller-avatar">{{ seller.name?.slice(0, 1) || '同' }}</el-avatar>
        <div>
          <b>{{ seller.name || '卖家' }}</b>
          <span class="small muted"> · {{ seller.dorm || '校内' }} · 通常几分钟内回复</span>
        </div>
      </div>

      <div ref="msgBox" class="msg-box">
        <div class="msg-tip">关于「{{ goods?.title }}」，你想了解什么？</div>
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="msg"
          :class="msg.from === 'me' ? 'msg--me' : 'msg--seller'"
        >
          <span class="bubble">{{ msg.text }}</span>
        </div>
      </div>

      <div class="quick-asks">
        <button
          v-for="q in quickQuestions"
          :key="q"
          v-ripple
          type="button"
          class="quick-ask"
          @click="sendMessage(q)"
        >{{ q }}</button>
      </div>

      <div class="msg-input">
        <el-input
          v-model="consultText"
          placeholder="输入你想咨询的问题，回车发送"
          maxlength="120"
          @keyup.enter="sendMessage()"
        />
        <el-button type="primary" :disabled="!consultText.trim()" @click="sendMessage()">发送</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import SectionCard from '../components/SectionCard.vue'
import GoodsImage from '../components/GoodsImage.vue'
import { fetchUsers } from '../api/goods'
import { fetchAllGoods, fetchAllGoodsById } from '../api/extraGoods'
import { getRating, appendMessage, getConversation, recordFootprint, getFootprints } from '../api/community'
import { useCartStore } from '../store/cart'
import { useFavoriteStore } from '../store/favorite'
import { useUserStore } from '../store/user'

export default {
  name: 'GoodsDetailView',
  components: { SectionCard, GoodsImage },
  data() {
    return {
      goods: null,
      related: [],
      recommended: [],
      allGoods: [],
      seller: {},
      users: [],
      sellerGoodsCount: 0,
      activeThumb: 0,
      // 咨询会话：本地即时对话，切换商品时重置
      consultVisible: false,
      consultText: '',
      messages: [],
      quickQuestions: ['还在吗？', '能小刀吗？', '什么时候方便面交？', '成色怎么样？'],
      // 占位图没有真实多图，用三种"拍摄角度"模拟图库切换
      views: [
        { label: '正面实拍', transform: 'scale(1) rotate(0deg)', thumbTransform: 'scale(1)', position: 'center' },
        { label: '侧面展示', transform: 'scale(0.86) rotate(-14deg)', thumbTransform: 'scale(0.86) rotate(-14deg)', position: '32% center' },
        { label: '细节特写', transform: 'scale(1.18) rotate(9deg)', thumbTransform: 'scale(1.18) rotate(9deg)', position: '70% center' }
      ],
      loading: true
    }
  },
  computed: {
    cart() {
      return useCartStore()
    },
    favorite() {
      return useFavoriteStore()
    },
    currentView() {
      return this.views[this.activeThumb] || this.views[0]
    },
    rating() {
      return getRating(this.goods?.sellerId)
    },
    // 偏好品类 = 收藏 + 足迹里出现最多的分类，用于「猜你喜欢」
    preferredCategory() {
      const me = useUserStore()
      const favIds = [...this.favorite.idSet]
      const favCategories = this.allGoods
        .filter((item) => favIds.includes(String(item.id)))
        .map((item) => item.category)
      const footCategories = getFootprints(me.id).map((item) => item.category)
      const count = {}
      ;[...favCategories, ...footCategories].forEach((c) => {
        if (c) count[c] = (count[c] || 0) + 1
      })
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]
      return top ? top[0] : ''
    },
    recommendHint() {
      return this.preferredCategory
        ? `根据你常看的「${this.preferredCategory}」为你挑选`
        : '根据当前热度为你挑选'
    }
  },
  watch: {
    // 详情页之间互相跳转时组件会被复用，必须监听参数重新加载
    '$route.params.id'() {
      this.load()
    }
  },
  async mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      const id = this.$route.params.id
      // 三个请求互不依赖：并行发出，接口未启动时等待时间从两次超时压到一次
      const [goods, all, users] = await Promise.all([
        fetchAllGoodsById(id),
        fetchAllGoods(),
        fetchUsers()
      ])
      this.goods = goods
      this.activeThumb = 0
      this.consultVisible = false
      this.consultText = ''
      this.messages = []
      if (goods) {
        this.allGoods = all
        this.users = users
        this.seller = users.find((user) => String(user.id) === String(goods.sellerId)) || {}
        // 浏览足迹：每次打开详情都记录，个人中心「我的足迹」可回看
        const me = useUserStore()
        if (me.id) recordFootprint(me.id, goods)
        const sellerId = String(goods.sellerId)
        this.sellerGoodsCount = all.filter(
          (item) => String(item.sellerId) === sellerId && item.status === '在售'
        ).length
        this.related = all
          .filter(
            (item) =>
              item.category === goods.category &&
              String(item.id) !== String(id) &&
              item.status === '在售'
          )
          .slice(0, 3)
        // 猜你喜欢：偏好品类优先，排除当前商品与已推荐项，不足时用其他在售补齐
        const exclude = new Set([String(id), ...this.related.map((item) => String(item.id))])
        const onSale = all.filter((item) => item.status === '在售' && !exclude.has(String(item.id)))
        const favIds = new Set([...this.favorite.idSet])
        const preferred = this.preferredCategory
        this.recommended = [
          ...onSale.filter((item) => item.category === preferred && favIds.has(String(item.id))),
          ...onSale.filter((item) => item.category === preferred && !favIds.has(String(item.id))),
          ...onSale.filter((item) => item.category !== preferred)
        ].slice(0, 3)
      } else {
        this.seller = {}
        this.related = []
        this.recommended = []
        this.sellerGoodsCount = 0
      }
      this.loading = false
    },
    addToCart() {
      if (this.goods.status !== '在售') {
        ElMessage.warning(this.goods.status === '已售' ? '该宝贝已成交' : '该宝贝已下架')
        return
      }
      const ok = this.cart.add(this.goods, this.seller.name || '同学')
      ElMessage[ok ? 'success' : 'warning'](ok ? '已加入购物车' : '该宝贝已在购物车中')
    },
    buyNow() {
      if (this.goods.status !== '在售') {
        ElMessage.warning(this.goods.status === '已售' ? '该宝贝已成交' : '该宝贝已下架')
        return
      }
      this.cart.add(this.goods, this.seller.name || '同学')
      this.$router.push('/cart')
    },
    toggleFavorite() {
      const added = this.favorite.toggle(this.goods.id)
      ElMessage[added ? 'success' : 'info'](added ? '已收藏' : '已取消收藏')
    },
    contactSeller() {
      // 打开会话时载入该商品的历史咨询记录
      const me = useUserStore()
      const conv = me.id ? getConversation(me.id, this.seller.id, this.goods.id) : null
      this.messages = conv ? conv.messages.map((m) => ({ from: m.from, text: m.text })) : []
      this.consultVisible = true
      this.$nextTick(() => this.$refs.msgBox?.scrollTo({ top: 9999 }))
    },
    // 发送咨询：追加我的消息并持久化到消息中心，卖家按关键词即时回复
    sendMessage(text) {
      const content = String(text || this.consultText || '').trim()
      if (!content || !this.goods) return
      this.messages.push({ from: 'me', text: content })
      this.consultText = ''
      this.scrollMessages()
      const me = useUserStore()
      if (me.id) {
        appendMessage({
          userId: me.id,
          peerId: this.seller.id,
          peerName: this.seller.name,
          goodsId: this.goods.id,
          goodsTitle: this.goods.title,
          from: 'me',
          text: content
        })
      }
      // 卖家回复做成即时反馈，不涉及真实消息服务
      setTimeout(() => {
        const reply = this.replyFor(content)
        this.messages.push({ from: 'seller', text: reply })
        this.scrollMessages()
        if (me.id) {
          appendMessage({
            userId: me.id,
            peerId: this.seller.id,
            peerName: this.seller.name,
            goodsId: this.goods.id,
            goodsTitle: this.goods.title,
            from: 'seller',
            text: reply
          })
        }
      }, 420)
    },
    replyFor(text) {
      const name = this.seller.name || '卖家'
      if (/在吗|你好|在不在/.test(text)) return `你好，在的～这件宝贝还在，随时可以当面验货。`
      if (/便宜|小刀|砍价|价格/.test(text)) return `价格已经是校内良心价啦，诚心要的话面交时可以小议，${name}等你～`
      if (/面交|时间|地点|什么时候|方便/.test(text)) return `工作日晚上和周末都方便，地点可以约在${this.seller.dorm || '校内'}附近，你看哪天合适？`
      if (/成色|新旧|质量|有没有.*问题/.test(text)) return `成色和描述一致，实物比照片更清楚，支持当面验货，有问题现场看就知道啦。`
      if (/包邮|快递|邮寄/.test(text)) return `建议当面交易，可以现场验货更放心，快递方式我们私聊再定～`
      return `收到啦，这件事我来跟进～你可以直接问成色、价格或面交时间，我看到会尽快回复。`
    },
    scrollMessages() {
      this.$nextTick(() => this.$refs.msgBox?.scrollTo({ top: 9999, behavior: 'smooth' }))
    },
    openGoods(id) {
      this.$router.push({ name: 'goods-detail', params: { id } })
    }
  }
}
</script>

<style scoped>
.back {
  margin-bottom: 6px;
}

.loading-box {
  height: 300px;
  border-radius: var(--radius);
  background: #fff;
  border: 1px solid var(--border);
}

.detail-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  margin-top: 8px;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-cover {
  position: relative;
  height: 360px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.main-cover::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  right: -60px;
  bottom: -80px;
}

.big-emoji {
  font-size: 140px;
  display: inline-block;
  filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.22));
  transition: transform 0.28s ease;
}

.cover-badge {
  position: absolute;
  left: 16px;
  top: 16px;
  padding: 2px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--primary-dark);
  font-size: 12px;
}

.off-shelf {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.55);
  color: var(--muted);
  font-size: 16px;
  letter-spacing: 6px;
}

.thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.thumb {
  position: relative;
  height: 64px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 22px;
  overflow: hidden;
}

/* 缩略图可点选切换主图视角；用 .thumbs .thumb 提高权重以覆盖全局 button 样式 */
.thumbs .thumb {
  padding: 0;
  margin: 0;
  border: 2px solid transparent;
  color: var(--text);
  cursor: pointer;
  opacity: 0.72;
  transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s, opacity 0.18s;
}

.thumbs .thumb span {
  display: inline-block;
  transition: transform 0.25s ease;
}

.thumbs .thumb:hover {
  transform: translateY(-2px);
  opacity: 1;
}

.thumbs .thumb.active {
  opacity: 1;
  border-color: var(--primary);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 6px 14px rgba(0, 181, 120, 0.3);
}

.thumbs .thumb--more {
  background: #f7faf8 !important;
  color: var(--muted);
  font-size: 11px;
  border: 1px dashed var(--border) !important;
  text-align: center;
  cursor: default;
}

.thumbs .thumb--more:hover {
  transform: none;
}

.info {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.info h1 {
  font-size: 24px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.info h1::after {
  width: 48px;
  height: 3px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 14px;
  background: linear-gradient(120deg, #fff3ea 0%, #fffaf6 58%, #f2fbf7 100%);
  border: 1px solid #fbe4d5;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 14px;
}

.price.big {
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.5px;
}

.desc {
  color: var(--text-soft);
  background: #f8faf9;
  border: 1px solid #eef2f0;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 0 0 14px;
  line-height: 1.85;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}

.meta-row b {
  color: var(--text);
}

.seller {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #f2fbf7, #ffffff);
}

.seller-avatar {
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.seller-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller-main b {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.seller-main .score {
  color: var(--primary-dark, #0f6e56);
  font-size: 14px;
}

.buy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.related-grid {
  /* 自适应列数：推荐满 3 件时三列，稀疏时卡片自动拉伸占满，避免大片空白 */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.mini-product {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.mini-product:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.mini-cover {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 24px;
  flex-shrink: 0;
  overflow: hidden;
}

.mini-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mini-text b {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-arrow {
  margin-left: auto;
  color: var(--muted);
}

/* ---------- 咨询卖家弹窗 ---------- */
.seller-line {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border);
}

.seller-line b {
  font-size: 14px;
}

.msg-box {
  height: 240px;
  overflow-y: auto;
  padding: 12px 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-tip {
  align-self: center;
  font-size: 12px;
  color: var(--muted);
  background: var(--bg);
  border-radius: 999px;
  padding: 3px 14px;
  text-align: center;
}

.msg {
  display: flex;
}

.msg--me {
  justify-content: flex-end;
}

.msg .bubble {
  max-width: 78%;
  padding: 8px 13px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.msg--seller .bubble {
  background: var(--bg);
  color: var(--text);
  border-top-left-radius: 4px;
}

.msg--me .bubble {
  background: linear-gradient(135deg, var(--primary-light), var(--primary-dark));
  color: #fff;
  border-top-right-radius: 4px;
}

.quick-asks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
  border-top: 1px dashed var(--border);
}

.quick-ask {
  padding: 5px 12px;
  margin: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  color: var(--text-soft);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.quick-ask:hover {
  border-color: var(--primary);
  color: var(--primary-dark);
  background: var(--primary-bg);
}

.msg-input {
  display: flex;
  gap: 8px;
  padding-top: 6px;
}

.msg-input .el-input {
  flex: 1;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .main-cover {
    height: 260px;
  }

  .big-emoji {
    font-size: 100px;
  }
}
</style>
