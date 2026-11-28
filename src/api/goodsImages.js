// ============================================================
//  goodsImages.js —— 商品真实图片映射（按文字选图 + 同批不重复）
//  图片统一放在 public/images/goods/，走 Vite 的 BASE_URL，
//  保证开发、preview 与 /zy/ 子路径部署都能正确加载。
//
//  assignGoodsImages(list)：给一批商品分配图片，同一条规则内的多张图
//  会依次发给同类商品，避免"羽毛球拍配健身图"或整页重复同一张图。
//  goodsImage(goods)：组件最终读取的图片路径。
// ============================================================
const IMAGE_BASE = `${import.meta.env.BASE_URL}images/goods/`

const ALL_IMAGES = [
  'books.jpg', 'books2.jpg', 'notebook.jpg', 'calculator.jpg',
  'laptop.jpg', 'keyboard.jpg', 'phone.jpg', 'powerbank.jpg',
  'mouse.jpg', 'headphones.jpg', 'speaker.jpg', 'camera.jpg',
  'tripod.jpg', 'cup.jpg', 'lamp.jpg', 'lamp2.jpg',
  'storagebox.jpg', 'backpack.jpg', 'basketball.jpg', 'bike.jpg',
  'yoga.jpg', 'gym.jpg', 'badminton1.jpg', 'badminton2.jpg',
  'jumprope.jpg', 'skincare.jpg', 'hairdryer.jpg', 'guitar.jpg',
  'ukulele.jpg', 'boardgame.jpg',
  'dictionary.jpg', 'earbuds.jpg', 'clock.jpg', 'suitcase.jpg',
  'fan.jpg', 'toothbrush.jpg', 'shaver.jpg', 'pingpong.jpg', 'skateboard.jpg'
]

// 按标题/描述关键词匹配，候选图按顺序取用，保证语义相近且互不重复
const KEYWORD_RULES = [
  { re: /羽毛球|羽球|天斧|racket/i, images: ['badminton1.jpg', 'badminton2.jpg'] },
  { re: /跳绳|计数绳|jump ?rope/i, images: ['jumprope.jpg', 'gym.jpg'] },
  { re: /移动电源|充电宝|power ?bank/i, images: ['powerbank.jpg', 'phone.jpg'] },
  { re: /收纳箱|整理箱|收纳盒|收纳/, images: ['storagebox.jpg', 'backpack.jpg'] },
  { re: /吹风机|电吹风|风筒|hair ?dryer/i, images: ['hairdryer.jpg', 'skincare.jpg'] },
  { re: /三脚架|脚架|三角架|tripod/i, images: ['tripod.jpg', 'camera.jpg'] },
  { re: /尤克里里|ukulele/i, images: ['ukulele.jpg', 'guitar.jpg'] },
  { re: /吉他|guitar|乐器/i, images: ['guitar.jpg', 'ukulele.jpg'] },
  { re: /自行车|单车|骑行/, images: ['bike.jpg', 'gym.jpg'] },
  { re: /蓝牙|降噪|真无线|耳塞|earbud/i, images: ['earbuds.jpg', 'headphones.jpg'] },
  { re: /耳机|耳麦|headphone/i, images: ['headphones.jpg', 'speaker.jpg'] },
  { re: /篮球/, images: ['basketball.jpg', 'gym.jpg'] },
  { re: /相机|摄影|摄像/, images: ['camera.jpg', 'tripod.jpg'] },
  { re: /键盘|keyboard/i, images: ['keyboard.jpg', 'laptop.jpg'] },
  { re: /手机|平板|ipad|平板壳/i, images: ['phone.jpg', 'powerbank.jpg'] },
  { re: /鼠标|mouse/i, images: ['mouse.jpg', 'keyboard.jpg'] },
  { re: /台灯|灯具|照明/, images: ['lamp.jpg', 'lamp2.jpg'] },
  { re: /保温杯|水杯|水壶|杯/, images: ['cup.jpg', 'lamp2.jpg'] },
  { re: /瑜伽|yoga/i, images: ['yoga.jpg', 'gym.jpg'] },
  { re: /护肤|美妆|化妆|面膜|精华/, images: ['skincare.jpg', 'hairdryer.jpg'] },
  { re: /桌游|卡牌|棋盘|拼图/, images: ['boardgame.jpg', 'calculator.jpg'] },
  { re: /笔记本电|电脑|编程|c语言/i, images: ['laptop.jpg', 'keyboard.jpg'] },
  { re: /计算器/, images: ['calculator.jpg', 'boardgame.jpg'] },
  { re: /音箱|音响|speaker/i, images: ['speaker.jpg', 'headphones.jpg'] },
  { re: /健身|哑铃|运动/, images: ['gym.jpg', 'yoga.jpg'] },
  { re: /词典|字典|辞典|dictionary/i, images: ['dictionary.jpg', 'books.jpg'] },
  { re: /真题|讲义|习题|教材|辅导|书|笔记/, images: ['books.jpg', 'books2.jpg', 'notebook.jpg'] },
  { re: /背包|书包|双肩包/, images: ['backpack.jpg', 'storagebox.jpg'] },
  { re: /闹钟|时钟|钟表|clock/i, images: ['clock.jpg', 'lamp2.jpg'] },
  { re: /行李箱|拉杆箱|旅行箱|suitcase/i, images: ['suitcase.jpg', 'backpack.jpg'] },
  { re: /风扇|电扇|fan/i, images: ['fan.jpg', 'clock.jpg'] },
  { re: /牙刷|口腔|toothbrush/i, images: ['toothbrush.jpg', 'skincare.jpg'] },
  { re: /剃须|刮胡|shaver|razor/i, images: ['shaver.jpg', 'toothbrush.jpg'] },
  { re: /乒乓|乒乓球|球拍|ping ?pong|table tennis/i, images: ['pingpong.jpg', 'badminton2.jpg'] },
  { re: /滑板|双翘|skateboard/i, images: ['skateboard.jpg', 'bike.jpg'] }
]

const CATEGORY_POOL = {
  教材书籍: ['books.jpg', 'books2.jpg', 'notebook.jpg', 'calculator.jpg', 'dictionary.jpg'],
  电子数码: ['laptop.jpg', 'keyboard.jpg', 'phone.jpg', 'mouse.jpg', 'headphones.jpg', 'speaker.jpg', 'camera.jpg', 'powerbank.jpg', 'earbuds.jpg'],
  生活用品: ['cup.jpg', 'lamp.jpg', 'lamp2.jpg', 'storagebox.jpg', 'backpack.jpg', 'clock.jpg', 'suitcase.jpg', 'fan.jpg'],
  运动健身: ['basketball.jpg', 'bike.jpg', 'yoga.jpg', 'gym.jpg', 'badminton1.jpg', 'badminton2.jpg', 'jumprope.jpg', 'pingpong.jpg', 'skateboard.jpg'],
  美妆个护: ['skincare.jpg', 'hairdryer.jpg', 'toothbrush.jpg', 'shaver.jpg'],
  其他闲置: ['guitar.jpg', 'ukulele.jpg', 'boardgame.jpg', 'tripod.jpg', 'camera.jpg', 'backpack.jpg']
}

// 没有 image 字段的老商品（如购物车里已存的商品）仍按 ID 兜底
const ID_IMAGE = {
  x101: 'books.jpg',
  x102: 'notebook.jpg',
  x103: 'laptop.jpg',
  x104: 'phone.jpg',
  x105: 'speaker.jpg',
  x106: 'powerbank.jpg',
  x107: 'mouse.jpg',
  x108: 'lamp.jpg',
  x109: 'cup.jpg',
  x110: 'storagebox.jpg',
  x111: 'yoga.jpg',
  x112: 'badminton1.jpg',
  x113: 'jumprope.jpg',
  x114: 'hairdryer.jpg',
  x115: 'skincare.jpg',
  x116: 'ukulele.jpg',
  x117: 'boardgame.jpg',
  x118: 'tripod.jpg',
  x119: 'dictionary.jpg',
  x120: 'earbuds.jpg',
  x121: 'clock.jpg',
  x122: 'suitcase.jpg',
  x123: 'fan.jpg',
  x124: 'toothbrush.jpg',
  x125: 'shaver.jpg',
  x126: 'pingpong.jpg',
  x127: 'skateboard.jpg'
}

function candidatesFor(goods) {
  const text = `${goods.title || ''} ${goods.desc || ''}`
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(text)) return rule.images
  }
  return CATEGORY_POOL[goods.category] || ALL_IMAGES
}

// 给整批商品分配互不重复的图片；返回新数组，不修改原始数据
export function assignGoodsImages(list) {
  const used = new Set()
  return (list || []).map((goods) => {
    if (!goods) return goods

    if (goods.image) {
      used.add(goods.image)
      return goods
    }

    const candidates = candidatesFor(goods)
    let image = candidates.find((name) => !used.has(name))
    if (!image) image = ALL_IMAGES.find((name) => !used.has(name))
    if (!image) {
      // 商品数超过图片数时，按 id 稳定取一张，避免每次渲染都跳图
      const hash = [...String(goods.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
      image = ALL_IMAGES[hash % ALL_IMAGES.length]
    }

    used.add(image)
    return { ...goods, image }
  })
}

export function goodsImage(goods) {
  if (!goods) return ''
  if (goods.image) {
    return /^https?:\/\//i.test(goods.image) || goods.image.startsWith(IMAGE_BASE)
      ? goods.image
      : `${IMAGE_BASE}${goods.image}`
  }

  const idImage = ID_IMAGE[String(goods.id)]
  if (idImage) return `${IMAGE_BASE}${idImage}`

  return `${IMAGE_BASE}${candidatesFor(goods)[0]}`
}
