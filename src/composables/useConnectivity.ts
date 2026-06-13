import { ref, onMounted, onUnmounted } from 'vue'

const offline = ref(false)

let checkInterval: ReturnType<typeof setInterval> | undefined

export function useConnectivity() {
  function goOffline() { offline.value = true }
  function goOnline() { offline.value = false }

  onMounted(() => {
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    // Also check proxy connectivity periodically
    checkInterval = setInterval(async () => {
      const params = new URLSearchParams(window.location.search)
      const port = params.get('proxy')
      if (port) {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(3000) })
          if (res.ok) goOnline()
          else goOffline()
        } catch {
          goOffline()
        }
      } else {
        // No proxy — use navigator.onLine
        if (!navigator.onLine) goOffline()
        else goOnline()
      }
    }, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('offline', goOffline)
    window.removeEventListener('online', goOnline)
    if (checkInterval) clearInterval(checkInterval)
  })

  return { offline }
}
