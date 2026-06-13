import { onMounted, onUnmounted } from 'vue'

let checkInterval: ReturnType<typeof setInterval> | undefined
let prevProxyOk = true

function toggle(show: boolean) {
  const el = document.getElementById('offline')
  if (el) el.classList.toggle('show', show)
}

export function useConnectivity() {
  onMounted(() => {
    // The inline script in index.html handles browser offline/online via navigator.onLine
    // This composable additionally checks proxy availability

    checkInterval = setInterval(async () => {
      const params = new URLSearchParams(window.location.search)
      const port = params.get('proxy')
      if (!port) return // no proxy mode — rely on browser events

      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2000) })
        const proxyOk = res.ok
        if (proxyOk && !prevProxyOk) {
          toggle(false) // proxy recovered
        }
        prevProxyOk = proxyOk
      } catch {
        // Proxy unreachable
        if (prevProxyOk) {
          toggle(true) // proxy just went down
        }
        prevProxyOk = false
      }
    }, 8000) // check every 8s, less aggressive
  })

  onUnmounted(() => {
    if (checkInterval) clearInterval(checkInterval)
    prevProxyOk = true
  })
}
