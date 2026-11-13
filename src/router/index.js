// ============================================================
// router/index.js —— 校园二手集市路由表 + 全局守卫（题目 T3）
//   ① hash 模式：createWebHashHistory
//   ② 页面组件全部懒加载 () => import(...)，构建时自动分包
//   ③ 动态路由 /goods/:id（详情页）、嵌套路由 /center（个人中心外壳）
//   ④ 全局前置守卫：没 token 进不了业务页
//   ⑤ 404 通配符兜底（必须放最后）
// ============================================================
import { createRouter, createWebHashHistory } from 'vue-router'
import { readToken } from '../store/user'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/market' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录', hideChrome: true }
    },
    {
      // 商品广场：集市首页
      path: '/market',
      name: 'market',
      component: () => import('../views/MarketView.vue'),
      meta: { title: '商品广场', requiresAuth: true }
    },
    {
      // 动态路由：id 是变量，/goods/g1001、/goods/g1002 都进同一个组件
      path: '/goods/:id',
      name: 'goods-detail',
      component: () => import('../views/GoodsDetailView.vue'),
      meta: { title: '闲置详情', requiresAuth: true }
    },
    {
      path: '/publish',
      name: 'publish',
      component: () => import('../views/PublishView.vue'),
      meta: { title: '发布闲置', requiresAuth: true }
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { title: '购物车', requiresAuth: true }
    },
    {
      // 嵌套路由：/center 是"个人中心"外壳，里面再切"我的发布 / 我的订单"
      path: '/center',
      name: 'center',
      component: () => import('../views/CenterView.vue'),
      redirect: '/center/my-goods',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'my-goods',
          name: 'my-goods',
          component: () => import('../views/MyGoodsView.vue'),
          meta: { title: '我的发布', requiresAuth: true }
        },
        {
          path: 'my-orders',
          name: 'my-orders',
          component: () => import('../views/MyOrdersView.vue'),
          meta: { title: '我的订单', requiresAuth: true }
        }
      ]
    },
    {
      path: '/mobile',
      name: 'mobile',
      component: () => import('../views/MobileView.vue'),
      meta: { title: '移动端集市', requiresAuth: true }
    },
    {
      // 404 兜底：通配符必须最后，路由是从上往下匹配的
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: '页面不存在' }
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// 全局前置守卫：requiresAuth 的页面没有 token 一律拦去登录页
// to = 去哪，from = 从哪来，next = 放行函数（每个分支都必须调用）
router.beforeEach((to, from, next) => {
  // 长期登录在 localStorage，本次会话登录在 sessionStorage，两种都认
  const token = readToken()
  // 父路由写了 requiresAuth，子路由要用 matched 逐层检查
  const needAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (needAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  if (to.name === 'login' && token) {
    next({ name: 'market' })
    return
  }
  next()
})

// 全局后置钩子：只做收尾（改标题），不能拦截导航
router.afterEach((to) => {
  document.title = `${to.meta.title || '校园二手集市'} · 校园二手集市`
})

export default router
