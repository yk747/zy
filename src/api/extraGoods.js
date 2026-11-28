// ============================================================
//  extraGoods.js —— 扩充商品品类
//  二手集市需要更多不同种类的闲置物，新增商品统一在这里维护。
//  设计要点：
//   ① 不改动已有数据种子，运行时与 fetchGoods() 的结果合并
//   ② 独立卖家编号，避免出现在当前用户的「我发布的宝贝」中
//   ③ 已售状态写入 localStorage，刷新后新物品依然保持已成交
// ============================================================
import { fetchGoods, updateGoods } from './goods'
import { assignGoodsImages } from './goodsImages'

const EXTRA_SOLD_KEY = 'campus-market:extra-sold'

// 新增闲置：覆盖教材、数码、生活、运动、个护、文娱六大类
const EXTRA_GOODS = [
  {
    id: 'x101',
    title: '考研英语真题套装（2019—2025）',
    desc: '真题与解析齐全，重点词汇已单独整理成册，封面轻微磨损，内页干净。',
    category: '教材书籍',
    price: 68,
    condition: '八成新',
    emoji: '📚',
    gradient: 'linear-gradient(135deg, #a7f3d0, #0f766e)',
    sellerId: 'x-seller-1',
    createdAt: '2026-11-26',
    status: '在售'
  },
  {
    id: 'x102',
    title: '线性代数辅导讲义 + 习题册',
    desc: '课后习题有手写解析，适合期末复习和考研打基础，无缺页。',
    category: '教材书籍',
    price: 32,
    condition: '九成新',
    emoji: '📐',
    gradient: 'linear-gradient(135deg, #bfdbfe, #1d4ed8)',
    sellerId: 'x-seller-2',
    createdAt: '2026-11-24',
    status: '在售'
  },
  {
    id: 'x103',
    title: 'C 语言程序设计教材（配光盘）',
    desc: '课堂指定教材，光盘未拆封，书角有一处折痕，不影响阅读。',
    category: '教材书籍',
    price: 45,
    condition: '八成新',
    emoji: '💻',
    gradient: 'linear-gradient(135deg, #c7d2fe, #4338ca)',
    sellerId: 'x-seller-3',
    createdAt: '2026-11-22',
    status: '在售'
  },
  {
    id: 'x104',
    title: 'iPad 保护壳 + 类纸膜套装',
    desc: '适用 iPad Air 4/5，壳边角无磕碰，类纸膜仅试用一次，附收纳袋。',
    category: '电子数码',
    price: 48,
    condition: '九成新',
    emoji: '📱',
    gradient: 'linear-gradient(135deg, #e0e7ff, #6366f1)',
    sellerId: 'x-seller-4',
    createdAt: '2026-11-27',
    status: '在售'
  },
  {
    id: 'x105',
    title: '蓝牙便携音箱（户外款）',
    desc: '音质清晰，续航约 8 小时，配原装充电线，宿舍和自习室都能用。',
    category: '电子数码',
    price: 128,
    condition: '九成新',
    emoji: '🔊',
    gradient: 'linear-gradient(135deg, #fbcfe8, #be185d)',
    sellerId: 'x-seller-5',
    createdAt: '2026-11-25',
    status: '在售'
  },
  {
    id: 'x106',
    title: '20000mAh 快充移动电源',
    desc: '双向快充，自带 Type-C 线，实测可给手机充满三次，成色很新。',
    category: '电子数码',
    price: 75,
    condition: '九成新',
    emoji: '🔋',
    gradient: 'linear-gradient(135deg, #fde68a, #b45309)',
    sellerId: 'x-seller-6',
    createdAt: '2026-11-23',
    status: '在售'
  },
  {
    id: 'x107',
    title: '罗技无线鼠标（静音款）',
    desc: '按键静音，适合自习室使用，电池续航还很长，附 USB 接收器。',
    category: '电子数码',
    price: 55,
    condition: '八成新',
    emoji: '🖱️',
    gradient: 'linear-gradient(135deg, #e2e8f0, #475569)',
    sellerId: 'x-seller-7',
    createdAt: '2026-11-21',
    status: '在售'
  },
  {
    id: 'x108',
    title: '折叠护眼台灯（三档色温）',
    desc: '宿舍桌面神器，三档色温可调，灯臂折叠方便带走，无质量问题。',
    category: '生活用品',
    price: 39,
    condition: '九成新',
    emoji: '💡',
    gradient: 'linear-gradient(135deg, #fef3c7, #d97706)',
    sellerId: 'x-seller-8',
    createdAt: '2026-11-27',
    status: '在售'
  },
  {
    id: 'x109',
    title: '不锈钢保温杯 500ml',
    desc: '保温效果依旧很好，杯口无磕碰，杯盖密封圈完整，已清洗干净。',
    category: '生活用品',
    price: 29,
    condition: '九成新',
    emoji: '🥤',
    gradient: 'linear-gradient(135deg, #bae6fd, #0284c7)',
    sellerId: 'x-seller-9',
    createdAt: '2026-11-26',
    status: '在售'
  },
  {
    id: 'x110',
    title: '布艺衣物收纳箱（两个装）',
    desc: '换季整理用，可折叠不占地方，无污渍异味，两个一起出。',
    category: '生活用品',
    price: 25,
    condition: '全新',
    emoji: '🧺',
    gradient: 'linear-gradient(135deg, #fed7aa, #c2410c)',
    sellerId: 'x-seller-10',
    createdAt: '2026-11-20',
    status: '在售'
  },
  {
    id: 'x111',
    title: '加厚瑜伽垫（含绑带）',
    desc: '6mm 加厚防滑，只有周末用过几次，附收纳绑带，健身入门很合适。',
    category: '运动健身',
    price: 59,
    condition: '九成新',
    emoji: '🧘',
    gradient: 'linear-gradient(135deg, #ddd6fe, #7c3aed)',
    sellerId: 'x-seller-11',
    createdAt: '2026-11-25',
    status: '在售'
  },
  {
    id: 'x112',
    title: '羽毛球拍双拍套装',
    desc: '双拍配三只球和拍包，拍框无开裂，线磅数适中，可直接约球。',
    category: '运动健身',
    price: 88,
    condition: '八成新',
    emoji: '🏸',
    gradient: 'linear-gradient(135deg, #bbf7d0, #15803d)',
    sellerId: 'x-seller-12',
    createdAt: '2026-11-24',
    status: '在售'
  },
  {
    id: 'x113',
    title: '计数跳绳（可调节长度）',
    desc: '电子计数准确，绳长可调，手柄防滑，减肥打卡好帮手。',
    category: '运动健身',
    price: 18,
    condition: '九成新',
    emoji: '🪢',
    gradient: 'linear-gradient(135deg, #fecdd3, #e11d48)',
    sellerId: 'x-seller-13',
    createdAt: '2026-11-22',
    status: '在售'
  },
  {
    id: 'x114',
    title: '负离子吹风机（大功率）',
    desc: '风力足、噪音可控，宿舍限电也能用，附原装风嘴，已清洁干净。',
    category: '美妆个护',
    price: 89,
    condition: '九成新',
    emoji: '💨',
    gradient: 'linear-gradient(135deg, #f5d0fe, #a21caf)',
    sellerId: 'x-seller-14',
    createdAt: '2026-11-26',
    status: '在售'
  },
  {
    id: 'x115',
    title: '护肤基础套装（水乳精华）',
    desc: '朋友送的套装，只用过水乳小样，正装未开封，适合混合肤质。',
    category: '美妆个护',
    price: 96,
    condition: '全新',
    emoji: '🧴',
    gradient: 'linear-gradient(135deg, #fbcfe8, #db2777)',
    sellerId: 'x-seller-15',
    createdAt: '2026-11-23',
    status: '在售'
  },
  {
    id: 'x116',
    title: '21 寸尤克里里（含琴包）',
    desc: '自学入门琴，音色清亮，弦距已调好，附调音器和琴包。',
    category: '其他闲置',
    price: 168,
    condition: '八成新',
    emoji: '🎸',
    gradient: 'linear-gradient(135deg, #fed7aa, #ea580c)',
    sellerId: 'x-seller-16',
    createdAt: '2026-11-27',
    status: '在售'
  },
  {
    id: 'x117',
    title: '桌游策略卡牌合集',
    desc: '三套不同规则的策略卡牌，聚会人数 3—6 人都合适，卡牌齐全。',
    category: '其他闲置',
    price: 42,
    condition: '九成新',
    emoji: '🎲',
    gradient: 'linear-gradient(135deg, #a5f3fc, #0e7490)',
    sellerId: 'x-seller-17',
    createdAt: '2026-11-21',
    status: '在售'
  },
  {
    id: 'x118',
    title: '相机三脚架（便携款）',
    desc: '可伸缩至 1.5 米，带云台和手机夹，拍vlog或小组作业都很稳。',
    category: '其他闲置',
    price: 66,
    condition: '九成新',
    emoji: '📷',
    gradient: 'linear-gradient(135deg, #d1d5db, #374151)',
    sellerId: 'x-seller-18',
    createdAt: '2026-11-19',
    status: '在售'
  },
  {
    id: 'x119',
    title: '英汉双解大词典（第六版）',
    desc: '考研查词用，厚厚一本很扎实，封面有轻微折痕，内页无涂写。',
    category: '教材书籍',
    price: 38,
    condition: '八成新',
    emoji: '📕',
    gradient: 'linear-gradient(135deg, #fecaca, #b91c1c)',
    sellerId: 'x-seller-19',
    createdAt: '2026-11-18',
    status: '在售'
  },
  {
    id: 'x120',
    title: '真无线蓝牙耳机（主动降噪）',
    desc: '通勤和自习都好用，降噪效果明显，续航约 6 小时，配充电盒与替换耳塞。',
    category: '电子数码',
    price: 158,
    condition: '九成新',
    emoji: '🎧',
    gradient: 'linear-gradient(135deg, #c7d2fe, #4f46e5)',
    sellerId: 'x-seller-20',
    createdAt: '2026-11-28',
    status: '在售'
  },
  {
    id: 'x121',
    title: '桌面复古小闹钟（静音扫秒）',
    desc: '起床困难户必备，静音不扰眠，夜光指针，电池已换新的，走时准确。',
    category: '生活用品',
    price: 22,
    condition: '九成新',
    emoji: '⏰',
    gradient: 'linear-gradient(135deg, #fde68a, #b45309)',
    sellerId: 'x-seller-21',
    createdAt: '2026-11-17',
    status: '在售'
  },
  {
    id: 'x122',
    title: '折叠行李箱 24 寸（万向轮）',
    desc: '放假回家和实习搬家都能用，万向轮顺滑，拉杆稳固，外壳无明显磕碰。',
    category: '生活用品',
    price: 138,
    condition: '八成新',
    emoji: '🧳',
    gradient: 'linear-gradient(135deg, #fdba74, #c2410c)',
    sellerId: 'x-seller-22',
    createdAt: '2026-11-16',
    status: '在售'
  },
  {
    id: 'x123',
    title: 'USB 小风扇（静音可折叠）',
    desc: '宿舍和自习室降温神器，三档风力，底座可当手机支架，附充电线。',
    category: '生活用品',
    price: 35,
    condition: '九成新',
    emoji: '🌀',
    gradient: 'linear-gradient(135deg, #a5f3fc, #0891b2)',
    sellerId: 'x-seller-23',
    createdAt: '2026-11-27',
    status: '在售'
  },
  {
    id: 'x124',
    title: '电动牙刷（含替换刷头）',
    desc: '声波清洁，三种模式可选，刷头还剩两支未拆封，机身已消毒干净。',
    category: '美妆个护',
    price: 78,
    condition: '九成新',
    emoji: '🪥',
    gradient: 'linear-gradient(135deg, #bae6fd, #0369a1)',
    sellerId: 'x-seller-24',
    createdAt: '2026-11-25',
    status: '在售'
  },
  {
    id: 'x125',
    title: '电动剃须刀（可水洗）',
    desc: '三刀头浮动贴合，全身水洗好清洁，附充电器和收纳袋，男生宿舍好物。',
    category: '美妆个护',
    price: 92,
    condition: '八成新',
    emoji: '🪒',
    gradient: 'linear-gradient(135deg, #cbd5e1, #334155)',
    sellerId: 'x-seller-25',
    createdAt: '2026-11-22',
    status: '在售'
  },
  {
    id: 'x126',
    title: '乒乓球拍双拍套装（含球）',
    desc: '双面反胶，配三只训练球和拍包，课余约球刚好，胶面无起皮。',
    category: '运动健身',
    price: 46,
    condition: '九成新',
    emoji: '🏓',
    gradient: 'linear-gradient(135deg, #fecaca, #dc2626)',
    sellerId: 'x-seller-26',
    createdAt: '2026-11-20',
    status: '在售'
  },
  {
    id: 'x127',
    title: '双翘滑板（含护具）',
    desc: '入门双翘板，板面弹性好，轮子无磨损，附护膝护肘，新手友好。',
    category: '运动健身',
    price: 168,
    condition: '八成新',
    emoji: '🛹',
    gradient: 'linear-gradient(135deg, #fbcfe8, #be185d)',
    sellerId: 'x-seller-27',
    createdAt: '2026-11-18',
    status: '在售'
  }
]

function readSoldIds() {
  try {
    const raw = localStorage.getItem(EXTRA_SOLD_KEY)
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list.map(String) : [])
  } catch {
    return new Set()
  }
}

function writeSoldIds(ids) {
  try {
    localStorage.setItem(EXTRA_SOLD_KEY, JSON.stringify([...ids]))
  } catch {
    /* 隐私模式下 localStorage 不可写，已售状态仅保留在当前会话 */
  }
}

function isExtraGoods(id) {
  return EXTRA_GOODS.some((goods) => String(goods.id) === String(id))
}

// 与服务端 / 离线缓存中的商品合并；已卖出的扩展商品自动显示为「已售」
export async function fetchAllGoods() {
  const base = await fetchGoods()
  const baseIds = new Set(base.map((goods) => String(goods.id)))
  const sold = readSoldIds()
  const extras = EXTRA_GOODS.filter((goods) => !baseIds.has(String(goods.id))).map((goods) => ({
    ...goods,
    status: sold.has(String(goods.id)) ? '已售' : goods.status
  }))
  // 按标题文字选图，并保证同一批商品不会出现重复图片
  return assignGoodsImages([...base, ...extras])
}

export async function fetchAllGoodsById(id) {
  const all = await fetchAllGoods()
  return all.find((goods) => String(goods.id) === String(id)) || null
}

// 扩展商品不在 json-server 中，状态更新只写本地；其余商品继续走原接口
export async function updateAnyGoods(id, patch) {
  if (isExtraGoods(id)) {
    const sold = readSoldIds()
    if (patch && patch.status === '已售') sold.add(String(id))
    else sold.delete(String(id))
    writeSoldIds(sold)
    return true
  }
  return updateGoods(id, patch)
}

export { EXTRA_GOODS }
