// ============================================================
// api/goods.js —— 校园二手集市前端数据层（对接 json-server）
// 题目 T5 硬指标：数据全部走 json-server 本地接口（3001 端口），
// axios 覆盖 get / post / put / delete 四种请求，每处带 catch 兜底。
// 设计要点：
//   ① 统一 axios 实例：baseURL / timeout 只配一次
//   ② 后端没启动也不白屏：自动降级到 localStorage 演示数据
//   ③ 后端"有响应但报错"（如商品不存在）要抛给页面，不能悄悄降级
// 启动后端：npm run server（json-server --watch server/db.json --port 3001）
// ============================================================
import axios from 'axios'
import { reactive } from 'vue'
import { GOODS_SEED, USER_SEED, ORDER_SEED } from '../../shared/goods.js'

// 页面顶部"在线 / 离线"提示条读取这里
export const serverState = reactive({
  online: null, // null = 还没请求过，true = 接口正常，false = 已降级本地演示
  message: ''
})

const http = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 1800
})

const GOODS_KEY = 'campus-market:goods'
const ORDER_KEY = 'campus-market:orders'

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #6ee7b7, #059669)'

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

function markOffline() {
  serverState.online = false
  serverState.message =
    'json-server 接口（3001 端口）未连接，已切换到本地演示模式：发布、收藏、下单照常可用，启动后端后刷新即可同步。'
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

// ---------- 用户接口（登录校验用） ----------
export async function fetchUsers() {
  try {
    const res = await http.get('/users')
    markOnline()
    return res.data
  } catch {
    markOffline()
    return USER_SEED.map((item) => ({ ...item }))
  }
}

// ---------- 闲置商品接口 ----------
export async function fetchGoods() {
  try {
    const res = await http.get('/goods')
    markOnline()
    return res.data
  } catch {
    markOffline()
    return readLocalGoods()
  }
}

export async function fetchGoodsById(id) {
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
    return res.data
  } catch (err) {
    const error = businessError(err, '发布失败')
    if (error) throw error
    markOffline()
    writeLocalGoods([goods, ...readLocalGoods()])
    return goods
  }
}

export async function updateGoods(id, payload) {
  try {
    const res = await http.put(`/goods/${id}`, payload)
    markOnline()
    return res.data
  } catch (err) {
    const error = businessError(err, '保存失败')
    if (error) throw error
    markOffline()
    const list = readLocalGoods().map((item) =>
      String(item.id) === String(id) ? { ...item, ...payload, id: item.id } : item
    )
    writeLocalGoods(list)
    return list.find((item) => String(item.id) === String(id))
  }
}

export async function removeGoods(id) {
  try {
    await http.delete(`/goods/${id}`)
    markOnline()
    return true
  } catch (err) {
    const error = businessError(err, '删除失败')
    if (error) throw error
    markOffline()
    writeLocalGoods(readLocalGoods().filter((item) => String(item.id) !== String(id)))
    return true
  }
}

// ---------- 订单接口 ----------
export async function fetchOrders() {
  try {
    const res = await http.get('/orders')
    markOnline()
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
    return res.data
  } catch (err) {
    const error = businessError(err, '下单失败')
    if (error) throw error
    markOffline()
    return createLocalOrder(payload)
  }
}

export async function updateOrder(id, payload) {
  try {
    const res = await http.put(`/orders/${id}`, payload)
    markOnline()
    return res.data
  } catch (err) {
    const error = businessError(err, '更新订单失败')
    if (error) throw error
    markOffline()
    const list = readLocalOrders().map((order) =>
      String(order.id) === String(id) ? { ...order, ...payload, id: order.id } : order
    )
    writeLocalOrders(list)
    return list.find((order) => String(order.id) === String(id))
  }
}
