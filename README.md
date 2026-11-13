# 校园二手集市 · 前后端综合项目（题目 G3｜校园二手交易平台）

把《WEB 前端框架技术》课程六节课的知识点整合成一个可运行的校园二手交易平台：Vue 3 前端 + json-server 本地接口。

面向在校学生的闲置物品交易平台：卖家发布商品、买家浏览搜索、收藏加购、约面交下单，并附移动端（Vant）买家场景。

> 本项目位于 `20261104/`，**未修改** `web-framework-32605150617/` 中的任何原有实验。

## 技术栈

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| Vue 3 | 3.5 | 页面与组件（选项式写法，与课程一致） |
| Vue Router | 4.6 | hash 路由、动态路由、嵌套路由、登录守卫、懒加载 |
| Element Plus | 2.14 | 桌面端组件库（Menu 布局、Form、Dialog、Empty 等） |
| Vant | 4.10 | 移动端集市（van-card / van-tag / van-submit-bar，按需引入） |
| Pinia | 4.1 | 用户 / 购物车 / 收藏 / 订单四个仓库 + persist 持久化 |
| Axios | 1.21 | 请求层：get / post / put / delete + catch 兜底 |
| json-server | 0.17 | 本地接口（3001 端口），数据落盘 `server/db.json` |

## 快速开始

```bash
cd 20261104
npm install
npm start
```

`npm start` 会同时启动：

- 本地接口（json-server）：`http://localhost:3001`
- 前端页面：`http://localhost:5173`（自动打开）

也可以分两个终端手动启动：

```bash
npm run server   # json-server
npm run dev      # 前端
```

体验账号（6 位认证同学任选其一，密码统一 `123456`）：

| 昵称 | 宿舍 |
| --- | --- |
| 小杨 | 东区 8 号楼 502 |
| 小刘 | 东区 6 号楼 301 |
| 小郭 | 西区 3 号楼 415 |
| 陈知远 | 西区 5 号楼 208 |
| 周予安 | 东区 9 号楼 606 |
| 林一诺 | 西区 2 号楼 509 |

### 接口没启动也能用

前端请求失败后会自动降级到浏览器 `localStorage` 演示数据，页面顶部提示「本地演示模式」。
发布、收藏、下单照常执行；启动 json-server 后刷新即可切换为真实接口。

`server/db.json` 为接口数据文件，删除后重启会恢复种子数据。

## 功能清单（对应题目 G3）

| 编号 | 功能 | 位置 |
| --- | --- | --- |
| F1 | 登录 + 全局守卫拦截未登录 | `LoginView.vue` + `router/index.js` |
| F2 | 商品广场（卡片列表 + 分类 + 关键词搜索 + 排序） | `MarketView.vue` |
| F3 | 发布商品（表单 post，占位色块图） | `PublishView.vue` + `GoodsFormDialog.vue` |
| F4 | 商品详情（动态路由 `:id`）+ 卖家信息 | `GoodsDetailView.vue` |
| F5 | 购物车 / 收藏（Pinia 业务仓库，persist 持久化） | `store/cart.js` + `store/favorite.js` |
| E6 | 我的发布（上下架 put、编辑、删除） | `CenterView.vue` + `MyGoodsView.vue` |
| E7 | 订单模拟（确认购买生成记录，待面交 → 已完成） | `CartView.vue` + `MyOrdersView.vue` + `store/order.js` |
| O8 | 占位 emoji 图 | `GoodsCard.vue` / 发布表单 |

## 后端接口（json-server，3001 端口）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/goods` | 闲置列表 |
| GET | `/goods/:id` | 闲置详情 |
| POST | `/goods` | 发布闲置 |
| PUT | `/goods/:id` | 编辑 / 上下架（全量替换） |
| DELETE | `/goods/:id` | 删除闲置 |
| GET | `/users` | 认证同学（登录校验用） |
| GET | `/orders` | 订单列表 |
| POST | `/orders` | 创建订单（确认购买） |
| PUT | `/orders/:id` | 订单状态流转（待面交 → 已完成） |

## 页面一览

| 路由 | 页面 | 主要功能 |
| --- | --- | --- |
| `/login` | 登录 | 表单校验、账号校验、token 写入、登录后跳回原目标 |
| `/market` | 商品广场 | 搜索高亮、分类筛选、排序、统计卡、加购/收藏 |
| `/goods/:id` | 闲置详情 | 动态路由、卖家信息、同类推荐、加购/立即购买/收藏 |
| `/publish` | 发布闲置 | 发布表单（标题/分类/价格/成色/占位图/描述） |
| `/cart` | 购物车 | 移除/清空、面交信息表单、提交订单 |
| `/center` | 个人中心（嵌套外壳） | 统计卡 + 子页面切换 |
| `/center/my-goods` | 我的发布 | 上架/下架、编辑、删除 |
| `/center/my-orders` | 我的订单 | 我买到的 / 我卖出的、确认完成 |
| `/mobile` | 移动端集市 | Vant 商品广场 + 详情 + 加购（手机壳容器） |
| `*` | 404 | 通配符兜底 |

## 硬指标对照（题目 T1—T7）

| # | 硬指标 | 项目中的位置 |
| --- | --- | --- |
| T1 | Vue3 选项式 API + Vite + npm | 全项目 |
| T2 | ≥3 个自封装组件（props+emit，含插槽） | `SearchBar`（props+emit）、`GoodsCard`（props+emit）、`SectionCard`（插槽）、`GoodsFormDialog`（组件 v-model）、`StatCard`（props）；computed：广场筛选/详情相关；watch：详情页监听 `:id` |
| T3 | ≥5 页面 + 动态路由 + 嵌套路由 + 守卫 + 懒加载 | `router/index.js`：全部 `() => import()` 懒加载 |
| T4 | Element Plus 主界面 + Vant 移动端页 | EP：Menu/Form/Dialog/Table(我的发布列表)/Empty；Vant：`MobileView.vue`（van-card/van-tag/van-submit-bar） |
| T5 | json-server 3001 + axios 四种请求 + catch 兜底 + loading | `server/db.json` + `api/goods.js` + 各页面 loading 态 |
| T6 | Pinia ≥2 仓库 + actions + persist | `user` / `cart` / `favorite` / `order`，cart 与 favorite、user 均 persist |
| T7 | build / preview / 部署 | `npm run build` → `npm run preview`；hash 路由可部署任意静态平台 |

## 目录结构

```
20261104/
├─ index.html
├─ vite.config.js             # Vue 插件 + Vant 按需引入
├─ package.json
├─ shared/
│  └─ goods.js                # 前后端共享的种子数据（goods/users/orders）
├─ server/
│  └─ db.json                 # json-server 数据文件
└─ src/
   ├─ main.js                 # 插件总线：Element Plus / Pinia / Router / 指令
   ├─ App.vue                 # 外壳、provide 全局信息、路由过渡
   ├─ style.css               # 集市设计令牌（绿色主题，含 Element Plus 主色）
   ├─ api/goods.js            # Axios 封装 + 离线降级
   ├─ directives/index.js     # v-focus / v-highlight
   ├─ router/index.js         # 路由表（懒加载）+ 登录守卫
   ├─ store/
   │  ├─ user.js              # Pinia：登录同学（persist）
   │  ├─ cart.js              # Pinia：购物车（persist）
   │  ├─ favorite.js          # Pinia：收藏（persist）
   │  └─ order.js             # Pinia：订单（actions 调接口）
   ├─ components/
   │  ├─ AppHeader.vue        # 顶部导航（购物车角标）
   │  ├─ SearchBar.vue        # 搜索栏（props + emit）
   │  ├─ GoodsCard.vue        # 闲置卡片（props + emit + 高亮指令）
   │  ├─ SectionCard.vue      # 区块卡片（默认/extra/footer 插槽）
   │  ├─ GoodsFormDialog.vue  # 发布/编辑弹窗（组件 v-model）
   │  └─ StatCard.vue         # 统计卡（props）
   └─ views/
      ├─ LoginView.vue
      ├─ MarketView.vue
      ├─ GoodsDetailView.vue
      ├─ PublishView.vue
      ├─ CartView.vue
      ├─ CenterView.vue
      ├─ MyGoodsView.vue
      ├─ MyOrdersView.vue
      ├─ MobileView.vue
      └─ NotFoundView.vue
```

## 构建

```bash
npm run build     # 产物在 dist/
npm run preview   # 本地预览构建结果（需另开终端运行 npm run server）
```

hash 路由可直接部署到任意静态服务器；json-server 另行部署后修改 `src/api/goods.js` 中的 `baseURL` 即可。
