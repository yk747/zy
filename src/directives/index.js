// ============================================================
// directives/index.js —— 自定义指令（教材 4.5）
//   v-focus      ：挂载后自动聚焦（弹窗里让第一个输入框直接可打字）
//   v-highlight  ：带值指令，把文本里的搜索关键词包上 <mark>
//   v-ripple     ：点击处扩散一圈涟漪，给可点元素即时反馈
// 写成插件：main.js 里 app.use(directives) 一次注册，全项目可用。
// ============================================================

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 把 keyword 命中的片段标黄；没关键词就还原原始文本
function paint(el, keyword) {
  const raw = el.dataset.raw ?? el.textContent
  el.dataset.raw = raw
  const word = String(keyword || '').trim()
  if (!word) {
    el.textContent = raw
    return
  }
  const safeWord = escapeHtml(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(${safeWord})`, 'gi')
  el.innerHTML = escapeHtml(raw).replace(pattern, '<mark>$1</mark>')
}

export default {
  install(app) {
    // 自动聚焦：el-input 渲染出的根节点里再找真正的 input
    app.directive('focus', {
      mounted(el) {
        const input = el.matches?.('input,textarea') ? el : el.querySelector?.('input,textarea')
        input?.focus()
      }
    })

    // 关键词高亮：mounted 涂一次，值变了 updated 再涂
    app.directive('highlight', {
      mounted(el, binding) {
        paint(el, binding.value)
      },
      updated(el, binding) {
        if (binding.value !== binding.oldValue) paint(el, binding.value)
      }
    })

    // 点击涟漪：从手指/鼠标落点扩散一圈，动画结束自动移除节点
    // 尊重系统"减少动态效果"，禁用状态不触发，元素卸载时解绑监听
    app.directive('ripple', {
      mounted(el) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
        const handler = (event) => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
          if (el.classList?.contains('is-disabled') || el.disabled) return
          const rect = el.getBoundingClientRect()
          const size = Math.max(rect.width, rect.height) * 2.2
          const dot = document.createElement('span')
          dot.className = 'ripple-dot'
          dot.style.width = dot.style.height = `${size}px`
          dot.style.left = `${(event.clientX || rect.left + rect.width / 2) - rect.left - size / 2}px`
          dot.style.top = `${(event.clientY || rect.top + rect.height / 2) - rect.top - size / 2}px`
          el.appendChild(dot)
          dot.addEventListener('animationend', () => dot.remove(), { once: true })
        }
        el.__rippleHandler = handler
        el.addEventListener('pointerdown', handler)
      },
      unmounted(el) {
        if (el.__rippleHandler) el.removeEventListener('pointerdown', el.__rippleHandler)
      }
    })
  }
}
