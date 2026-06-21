import { ref } from 'vue'

let proxyBase = ''
const platform = ref<'linux' | 'windows' | 'macos' | 'unknown'>('unknown')
let resolved = false

async function resolve() {
  if (resolved) return
  resolved = true

  // First try IPC (works for local Tauri builds with embedded frontend)
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const port = await invoke<number>('get_proxy_port')
    if (port > 0) {
      proxyBase = `http://127.0.0.1:${port}`
      const res = await fetch(`${proxyBase}/api/status`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        platform.value = data.platform || 'unknown'
        return
      }
    }
  } catch { /* IPC not available — try query param */ }

  // Fallback: ?proxy= query param (dev mode, remote pages, or IPC failed)
  const params = new URLSearchParams(window.location.search)
  const port = params.get('proxy')
  if (!port) return
  proxyBase = `http://127.0.0.1:${port}`

  try {
    const res = await fetch(`${proxyBase}/api/status`)
    const data = await res.json()
    platform.value = data.platform || 'unknown'
  } catch { /* ignore */ }
}

export function isLinux(): boolean { return platform.value === 'linux' }
export function getPlatform() { return platform }

export async function startPlayer(url: string): Promise<void> {
  await resolve()
  if (!proxyBase) throw new Error('no proxy')
  if (platform.value !== 'linux') return
  const res = await fetch(`${proxyBase}/api/player/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
}

export async function stopPlayer(): Promise<void> {
  await resolve()
  if (!proxyBase || platform.value !== 'linux') return
  await fetch(`${proxyBase}/api/player/stop`, { method: 'POST' }).catch(() => {})
}

export async function captureSnapshot(url: string): Promise<string> {
  await resolve()
  if (!proxyBase || platform.value !== 'linux') throw new Error('snapshot not supported on this platform')
  const res = await fetch(`${proxyBase}/api/snapshot?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`snapshot failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.data
}

export function getStreamUrl(): string {
  return proxyBase ? `${proxyBase}/stream` : ''
}
