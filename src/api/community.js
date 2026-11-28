// ============================================================
// api/community.js —— 信任体系 / 消息中心 / 足迹 / 通知 / 资料
// 这些数据由用户交互产生，统一走 localStorage 持久化（含种子数据），
// 与 goods.js 的"接口优先 + 离线降级"互补：业务数据走 json-server，
// 社区数据本地留存，刷新不丢失，未启动后端也能完整使用。
// ============================================================

const REVIEW_KEY = 'campus-market:reviews'
const CONVERSATION_KEY = 'campus-market:conversations'
const FOOTPRINT_KEY = 'campus-market:footprints'
const NOTIFICATION_KEY = 'campus-market:notifications'
const PROFILE_KEY = 'campus-market:profiles'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 数据损坏则用种子 */
  }
  return fallback
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage 不可用时静默 */
  }
  return value
}

const now = () => new Date().toISOString()

// ---------- 评价：种子数据让信用分一开始就有参考 ----------
const REVIEW_SEED = [
  { id: 'r1', orderId: 'seed1', goodsId: 'g1001', targetId: 'u1', fromId: 'u2', role: 'buyer', rating: 5, content: '教材保存得很好，笔记很清晰，卖家态度也赞！', createdAt: '2026-11-12T10:20:00.000Z' },
  { id: 'r2', orderId: 'seed2', goodsId: 'g1002', targetId: 'u2', fromId: 'u1', role: 'buyer', rating: 5, content: '手机成色和描述一致，当面验机很放心。', createdAt: '2026-11-14T15:40:00.000Z' },
  { id: 'r3', orderId: 'seed3', goodsId: 'g1003', targetId: 'u2', fromId: 'u3', role: 'buyer', rating: 4, content: '键盘功能正常，就是颜色比照片稍深一点。', createdAt: '2026-11-16T09:10:00.000Z' },
  { id: 'r4', orderId: 'seed4', goodsId: 'g1001', targetId: 'u2', fromId: 'u1', role: 'seller', rating: 5, content: '买家爽快，面交准时，愉快的交易～', createdAt: '2026-11-12T10:25:00.000Z' },
  { id: 'r5', orderId: 'seed5', goodsId: 'g1004', targetId: 'u3', fromId: 'u4', role: 'buyer', rating: 5, content: '东西很划算，卖家还送了小配件。', createdAt: '2026-11-18T18:30:00.000Z' }
]

function readReviews() {
  const list = readJSON(REVIEW_KEY, null)
  if (Array.isArray(list)) return list
  return writeJSON(REVIEW_KEY, REVIEW_SEED.map((item) => ({ ...item })))
}

export function getReviews(targetId) {
  if (!targetId) return []
  return readReviews()
    .filter((item) => String(item.targetId) === String(targetId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getRating(targetId) {
  const list = getReviews(targetId)
  if (!list.length) return { score: '5.0', count: 0, goodRate: '100' }
  const sum = list.reduce((acc, item) => acc + (Number(item.rating) || 5), 0)
  const good = list.filter((item) => Number(item.rating) >= 4).length
  return {
    score: (sum / list.length).toFixed(1),
    count: list.length,
    goodRate: Math.round((good / list.length) * 100)
  }
}

export function hasReviewed(orderId, fromId, role) {
  return readReviews().some(
    (item) =>
      String(item.orderId) === String(orderId) &&
      String(item.fromId) === String(fromId) &&
      item.role === role
  )
}

export function addReview(payload) {
  const review = {
    id: 'r' + Date.now(),
    orderId: payload.orderId || '',
    goodsId: payload.goodsId || '',
    targetId: payload.targetId || '',
    fromId: payload.fromId || '',
    role: payload.role || 'buyer',
    rating: Math.max(1, Math.min(5, Number(payload.rating) || 5)),
    content: String(payload.content || '').trim() || '交易愉快，感谢！',
    createdAt: now()
  }
  writeJSON(REVIEW_KEY, [review, ...readReviews()])
  return review
}

// ---------- 咨询会话：按「我 ↔ 卖家 + 商品」聚合 ----------
function readConversations() {
  const list = readJSON(CONVERSATION_KEY, null)
  return Array.isArray(list) ? list : writeJSON(CONVERSATION_KEY, [])
}

export function getConversations(userId) {
  if (!userId) return []
  return readConversations()
    .filter((c) => String(c.userId) === String(userId))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getConversation(userId, peerId, goodsId) {
  return (
    readConversations().find(
      (c) =>
        String(c.userId) === String(userId) &&
        String(c.peerId) === String(peerId) &&
        String(c.goodsId) === String(goodsId)
    ) || null
  )
}

// 追加一条消息；from 用 'me' / 'seller'，viewed 表示我是否已读
export function appendMessage({ userId, peerId, peerName, goodsId, goodsTitle, from, text }) {
  const list = readConversations()
  let conv = list.find(
    (c) =>
      String(c.userId) === String(userId) &&
      String(c.peerId) === String(peerId) &&
      String(c.goodsId) === String(goodsId)
  )
  if (!conv) {
    conv = {
      id: 'c' + Date.now(),
      userId,
      peerId,
      peerName: peerName || '卖家',
      goodsId,
      goodsTitle: goodsTitle || '',
      messages: [],
      unread: 0,
      updatedAt: now()
    }
    list.unshift(conv)
  }
  conv.messages.push({ from, text, at: now() })
  conv.peerName = peerName || conv.peerName
  conv.unread = from === 'me' ? 0 : (Number(conv.unread) || 0) + 1
  conv.updatedAt = now()
  writeJSON(CONVERSATION_KEY, list)
  return conv
}

export function markConversationRead(id) {
  const list = readConversations().map((c) => (String(c.id) === String(id) ? { ...c, unread: 0 } : c))
  writeJSON(CONVERSATION_KEY, list)
}

// ---------- 浏览足迹 ----------
function readFootprints() {
  const map = readJSON(FOOTPRINT_KEY, null)
  return map && typeof map === 'object' ? map : writeJSON(FOOTPRINT_KEY, {})
}

export function getFootprints(userId) {
  if (!userId) return []
  return readFootprints()[userId] || []
}

export function recordFootprint(userId, goods) {
  if (!userId || !goods) return
  const map = readFootprints()
  const list = (map[userId] || []).filter((item) => String(item.id) !== String(goods.id))
  list.unshift({
    id: goods.id,
    title: goods.title,
    price: goods.price,
    category: goods.category,
    image: goods.image || '',
    emoji: goods.emoji || '📦',
    gradient: goods.gradient || '',
    viewedAt: now()
  })
  map[userId] = list.slice(0, 30)
  writeJSON(FOOTPRINT_KEY, map)
}

export function clearFootprints(userId) {
  const map = readFootprints()
  delete map[userId]
  writeJSON(FOOTPRINT_KEY, map)
}

// ---------- 通知 ----------
function readNotifications() {
  const map = readJSON(NOTIFICATION_KEY, null)
  return map && typeof map === 'object' ? map : writeJSON(NOTIFICATION_KEY, {})
}

export function getNotifications(userId) {
  if (!userId) return []
  return (readNotifications()[userId] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function addNotification(userId, { type = 'system', title = '', content = '' }) {
  if (!userId) return null
  const map = readNotifications()
  const item = { id: 'n' + Date.now() + Math.floor(Math.random() * 90 + 10), type, title, content, read: false, createdAt: now() }
  map[userId] = [item, ...(map[userId] || [])].slice(0, 50)
  writeJSON(NOTIFICATION_KEY, map)
  return item
}

export function unreadCount(userId) {
  return getNotifications(userId).filter((item) => !item.read).length
}

export function markAllNotificationsRead(userId) {
  const map = readNotifications()
  map[userId] = (map[userId] || []).map((item) => ({ ...item, read: true }))
  writeJSON(NOTIFICATION_KEY, map)
}

// ---------- 系统公告（静态种子） ----------
export const ANNOUNCEMENTS = [
  { id: 'a1', title: '校园认证全面开放', content: '完成实名认证后，你的宝贝会展示认证徽章，成交率更高。', date: '2026-11-20', tone: 'green' },
  { id: 'a2', title: '面交安全提醒', content: '建议在食堂、图书馆等公共场所当面验货，确认无误后再确认收货。', date: '2026-11-22', tone: 'amber' },
  { id: 'a3', title: '评价功能上线', content: '交易完成后可为对方评分，信用档案会同步展示累计好评率。', date: '2026-11-25', tone: 'blue' }
]

// ---------- 个人资料（昵称 / 宿舍 / 签名） ----------
function readProfiles() {
  const map = readJSON(PROFILE_KEY, null)
  return map && typeof map === 'object' ? map : writeJSON(PROFILE_KEY, {})
}

export function getProfile(userId) {
  if (!userId) return {}
  return readProfiles()[userId] || {}
}

export function saveProfile(userId, patch) {
  if (!userId) return {}
  const map = readProfiles()
  map[userId] = { ...(map[userId] || {}), ...patch, updatedAt: now() }
  writeJSON(PROFILE_KEY, map)
  return map[userId]
}
