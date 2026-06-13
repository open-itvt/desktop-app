import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listen } from '@tauri-apps/api/event'

function mapPath(path: string): string {
  // Map vod.itvt.xyz URLs to app routes
  if (path.startsWith('/category/') || path.startsWith('/categories/')) return '/vod'
  if (path.startsWith('/video/') || path.startsWith('/watch/')) return '/vod'
  if (path.startsWith('/schedule/') || path.startsWith('/tv/')) return '/schedule'
  if (path.startsWith('/profile/') || path.startsWith('/user/')) return '/profile'
  if (path.startsWith('/settings/') || path.startsWith('/config/')) return '/settings'
  return '/'
}

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
          const rawPath = params.get('path') || ''
          const appPath = rawPath ? mapPath(rawPath) : '/'
          router.push(appPath)
        } catch { /* ignore */ }
      })
    } catch { /* ignore */ }
  })

  onUnmounted(() => {
    if (unlisten) unlisten()
  })
}
