import { onMounted, onUnmounted } from 'vue'

let checkInterval: ReturnType<typeof setInterval> | undefined

function toggle(force?: boolean) {
  const el = document.getElementById('offline')
  if (!el) return
  const show = force !== undefined ? force : !navigator.onLine
  el.classList.toggle('show', show)
}

export function useConnectivity() {
  onMounted(() => {
    window.addEventListener('offline', () => toggle(true))
    window.addEventListener('online', () => toggle(false))

    // Also check proxy connectivity periodically
    checkInterval = setInterval(async () => {
      const params = new URLSearchParams(window.location.search)
      const port = params.get('proxy')
      if (port) {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(3000) })
          toggle(res.ok ? false : true)
        } catch {
          toggle(true)
        }
      } else {
        toggle()
      }
    }, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('offline', () => toggle(true))
    window.removeEventListener('online', () => toggle(false))
    if (checkInterval) clearInterval(checkInterval)
  })
}
