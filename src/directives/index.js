// ============================================================
// directives/index.js —— 自定义指令（教材 4.5）
//   v-focus      ：挂载后自动聚焦（弹窗里让第一个输入框直接可打字）
//   v-highlight  ：带值指令，把文本里的搜索关键词包上 <mark>
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
  }
}
