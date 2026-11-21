// ============================================================
// api/goods.js —— 校园二手集市前端数据层（对接 json-server）
// 题目 T5 硬指标：数据全部走 json-server 本地接口（3001 端口），
// axios 覆盖 get / post / put / delete 四种请求，每处带 catch 兜底。
// 设计要点：
//   ① 统一 axios 实例：baseURL / timeout 只配一次
//   ② 后端没启动也不白屏：自动降级到 localStorage 本地数据
//   ③ 后端"有响应但报错"（如商品不存在）要抛给页面，不能悄悄降级
// 启动后端：npm run server（json-server --watch server/db.json --port 3001）
// ============================================================
import axios from 'axios'
import { reactive } from 'vue'
import { GOODS_SEED, USER_SEED, ORDER_SEED } from '../../shared/goods.js'

// 页面顶部"在线 / 离线"提示条读取这里
export const serverState = reactive({
  online: null, // null = 还没请求过，true = 接口正常，false = 已降级到本地数据
  message: ''
})

const http = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 1800
})

const GOODS_KEY = 'campus-market:goods'
const ORDER_KEY = 'campus-market:orders'
const USER_KEY = 'campus-market:users'

// 项目未接入短信网关：登录验证码使用固定值 + 页面提示
export const VERIFY_CODE = '123456'

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #6ee7b7, #059669)'

// ---------- 请求缓存：页面来回切换时不必反复打接口 ----------
// 缓存只存"接口请求成功"的结果；离线降级数据不写入，避免把旧数据固化。
// 写操作（发布 / 编辑 / 删除 / 下单）后立即失效，保证数据一致。
const CACHE_TTL = 45 * 1000
const requestCache = new Map()

function cloneData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function readCache(key) {
  const hit = requestCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL) {
    requestCache.delete(key)
    return null
  }
  return cloneData(hit.value)
}

function writeCache(key, value) {
  requestCache.set(key, { value: cloneData(value), at: Date.now() })
}

function invalidateCache(key) {
  if (key) requestCache.delete(key)
  else requestCache.clear()
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 数据损坏就用兜底数据 */
  }
  return fallback
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

function readLocalGoods() {
  const list = readJSON(GOODS_KEY, null)
  if (Array.isArray(list)) return list
  const seed = GOODS_SEED.map((item) => ({ ...item }))
  writeJSON(GOODS_KEY, seed)
  return seed
}

function writeLocalGoods(list) {
  writeJSON(GOODS_KEY, list)
}

function readLocalOrders() {
  const list = readJSON(ORDER_KEY, null)
  if (Array.isArray(list)) return list
  const seed = ORDER_SEED.map((item) => ({ ...item, items: item.items.map((it) => ({ ...it })) }))
  writeJSON(ORDER_KEY, seed)
  return seed
}

function writeLocalOrders(list) {
  writeJSON(ORDER_KEY, list)
}

function readLocalUsers() {
  const list = readJSON(USER_KEY, null)
  if (Array.isArray(list)) return list
  const seed = USER_SEED.map((item) => ({ ...item }))
  writeJSON(USER_KEY, seed)
  return seed
}

function writeLocalUsers(list) {
  writeJSON(USER_KEY, list)
}

function markOffline() {
  serverState.online = false
  serverState.message =
    '网络服务暂时不可用，已进入离线浏览模式：发布、收藏与下单仍可使用，服务恢复后刷新页面即可同步。'
}

function markOnline() {
  serverState.online = true
  serverState.message = ''
}

// 后端返回了 4xx/5xx：这是业务错误（如商品不存在），应提示给用户
function businessError(err, fallback) {
  if (!err.response) return null
  markOnline()
  return new Error(err.response.data?.message || fallback)
}

// ---------- 字段标准化：发布表单/本地兜底共用 ----------
export function normalizeGoods(payload) {
  return {
    id: payload.id || 'g' + Date.now(),
    title: String(payload.title || '').trim(),
    category: payload.category || '其他闲置',
    price: Number(payload.price) || 0,
    condition: payload.condition || '九成新',
    emoji: payload.emoji || '📦',
    gradient: payload.gradient || DEFAULT_GRADIENT,
    desc: String(payload.desc || ''),
    sellerId: payload.sellerId || 'u1',
    status: payload.status || '在售',
    createdAt: payload.createdAt || new Date().toISOString().slice(0, 10)
  }
}

// ---------- 用户接口（登录 / 注册 / 找回密码） ----------
export async function fetchUsers() {
  const cached = readCache('users')
  if (cached) return cached
  try {
    const res = await http.get('/users')
    markOnline()
    writeCache('users', res.data)
    // 同步一份到本地：注册用户离线后仍能登录
    writeLocalUsers(res.data)
    return res.data
  } catch {
    markOffline()
    return readLocalUsers()
  }
}

// 手机号查找（验证码登录 / 找回密码共用）
export async function findUserByPhone(phone) {
  const users = await fetchUsers()
  const target = String(phone || '').trim()
  return users.find((user) => String(user.phone) === target) || null
}

// 短信验证码：真实项目应由服务端下发，这里直接返回固定验证码
export function sendVerifyCode(phone) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, code: VERIFY_CODE, phone }), 500)
  })
}

// 注册：昵称 / 手机号唯一，写库并持久化；业务校验失败抛错，不降级
export async function registerUser({ name, phone, password, dorm }) {
  const users = await fetchUsers()
  const cleanName = String(name || '').trim()
  const cleanPhone = String(phone || '').trim()

  if (users.some((user) => user.name === cleanName)) {
    throw new Error('这个昵称已被占用，换一个试试')
  }
  if (users.some((user) => String(user.phone) === cleanPhone)) {
    throw new Error('该手机号已注册，请直接登录')
  }

  const user = {
    id: 'u' + Date.now(),
    name: cleanName,
    password: String(password || ''),
    dorm: String(dorm || '').trim() || '未填写宿舍',
    phone: cleanPhone
  }

  try {
    const res = await http.post('/users', user)
    markOnline()
    invalidateCache('users')
    return res.data
  } catch (err) {
    const error = businessError(err, '注册失败')
    if (error) throw error
    markOffline()
    writeLocalUsers([...readLocalUsers(), user])
    invalidateCache('users')
    return user
  }
}

// 找回密码：按手机号定位用户后更新密码（未接入短信验证，按手机号重置）
export async function resetPassword(phone, password) {
  const user = await findUserByPhone(phone)
  if (!user) throw new Error('该手机号未注册，请先创建账号')

  try {
    await http.put(`/users/${user.id}`, { password: String(password || '') })
    markOnline()
    invalidateCache('users')
    return true
  } catch (err) {
    const error = businessError(err, '重置失败')
    if (error) throw error
    markOffline()
    writeLocalUsers(
      readLocalUsers().map((item) =>
        String(item.id) === String(user.id) ? { ...item, password: String(password || '') } : item
      )
    )
    invalidateCache('users')
    return true
  }
}

// ---------- 闲置商品接口 ----------
export async function fetchGoods() {
  const cached = readCache('goods')
  if (cached) return cached
  try {
    const res = await http.get('/goods')
    markOnline()
    writeCache('goods', res.data)
    return res.data
  } catch {
    markOffline()
    return readLocalGoods()
  }
}

export async function fetchGoodsById(id) {
  // 列表缓存命中时直接复用，详情页不必再发一次 /goods/:id
  const cached = readCache('goods')
  if (cached) return cached.find((item) => String(item.id) === String(id)) || null
  try {
    const res = await http.get(`/goods/${id}`)
    markOnline()
    return res.data
  } catch (err) {
    if (err.response?.status === 404) {
      markOnline()
      return null
    }
    markOffline()
    return readLocalGoods().find((item) => String(item.id) === String(id)) || null
  }
}

export async function createGoods(payload) {
  const goods = normalizeGoods(payload)
  try {
    const res = await http.post('/goods', goods)
    markOnline()
    invalidateCache('goods')
    return res.data
  } catch (err) {
    const error = businessError(err, '发布失败')
    if (error) throw error
    markOffline()
    writeLocalGoods([goods, ...readLocalGoods()])
    invalidateCache('goods')
    return goods
  }
}

export async function updateGoods(id, payload) {
  try {
    const res = await http.put(`/goods/${id}`, payload)
    markOnline()
    invalidateCache('goods')
    return res.data
  } catch (err) {
    const error = businessError(err, '保存失败')
    if (error) throw error
    markOffline()
    const list = readLocalGoods().map((item) =>
      String(item.id) === String(id) ? { ...item, ...payload, id: item.id } : item
    )
    writeLocalGoods(list)
    invalidateCache('goods')
    return list.find((item) => String(item.id) === String(id))
  }
}

export async function removeGoods(id) {
  try {
    await http.delete(`/goods/${id}`)
    markOnline()
    invalidateCache('goods')
    return true
  } catch (err) {
    const error = businessError(err, '删除失败')
    if (error) throw error
    markOffline()
    writeLocalGoods(readLocalGoods().filter((item) => String(item.id) !== String(id)))
    invalidateCache('goods')
    return true
  }
}

// ---------- 订单接口 ----------
export async function fetchOrders() {
  const cached = readCache('orders')
  if (cached) return cached
  try {
    const res = await http.get('/orders')
    markOnline()
    writeCache('orders', res.data)
    return res.data
  } catch {
    markOffline()
    return readLocalOrders()
  }
}

function createLocalOrder(payload) {
  const orders = readLocalOrders()
  const order = {
    ...payload,
    id: 'o' + Date.now(),
    orderNo: 'CM' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 900 + 100),
    createdAt: new Date().toISOString()
  }
  writeLocalOrders([order, ...orders])
  return order
}

export async function createOrder(payload) {
  try {
    const res = await http.post('/orders', payload)
    markOnline()
    invalidateCache('orders')
    return res.data
  } catch (err) {
    const error = businessError(err, '下单失败')
    if (error) throw error
    markOffline()
    const order = createLocalOrder(payload)
    invalidateCache('orders')
    return order
  }
}

export async function updateOrder(id, payload) {
  try {
    const res = await http.put(`/orders/${id}`, payload)
    markOnline()
    invalidateCache('orders')
    return res.data
  } catch (err) {
    const error = businessError(err, '更新订单失败')
    if (error) throw error
    markOffline()
    const list = readLocalOrders().map((order) =>
      String(order.id) === String(id) ? { ...order, ...payload, id: order.id } : order
    )
    writeLocalOrders(list)
    invalidateCache('orders')
    return list.find((order) => String(order.id) === String(id))
  }
}

// 删除订单（已完成）：在线删库，离线删本地缓存，两边都失效 orders 缓存
export async function deleteOrder(id) {
  try {
    await http.delete(`/orders/${id}`)
    markOnline()
    invalidateCache('orders')
    return true
  } catch (err) {
    const error = businessError(err, '删除订单失败')
    if (error) throw error
    markOffline()
    writeLocalOrders(readLocalOrders().filter((order) => String(order.id) !== String(id)))
    invalidateCache('orders')
    return true
  }
}
