import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listen } from '@tauri-apps/api/event'

export function useDeepLink() {
  const router = useRouter()
  let unlisten: (() => void) | null = null

  onMounted(async () => {
    try {
      unlisten = await listen<string>('deep-link://new-url', (event) => {
        try {
          const payload = typeof event.payload === 'string'
            ? JSON.parse(event.payload)
            : event.payload
          const url = payload.url || ''
          const qs = url.split('?').slice(1).join('?')
          const params = new URLSearchParams(qs)
          const path = params.get('path') || ''
          if (path) {
            router.push(path)
          }
        } catch { /* ignore */ }
      })
    } catch { /* ignore */ }
  })

  onUnmounted(() => {
    if (unlisten) unlisten()
  })
}
