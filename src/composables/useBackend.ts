// Backend abstraction: detects platform from proxy and routes accordingly.
// Linux → GStreamer pipeline (snapshot + MJPEG stream via proxy)
// Win/Mac → direct HLS playback via <video> + hls.js or native HLS

let proxyBase = ''
let platform: 'linux' | 'windows' | 'macos' | 'unknown' = 'unknown'
let resolved = false

async function resolve() {
  if (resolved) return
  resolved = true
  const params = new URLSearchParams(window.location.search)
  const port = params.get('proxy')
  if (!port) return
  proxyBase = `http://127.0.0.1:${port}`

  try {
    const res = await fetch(`${proxyBase}/api/status`)
    const data = await res.json()
    platform = data.platform || 'unknown'
  } catch {
    platform = 'unknown'
  }
}

export function isLinux(): boolean { return platform === 'linux' }

export async function startPlayer(url: string): Promise<void> {
  await resolve()
  if (!proxyBase) throw new Error('no proxy')
  // On non-Linux, the proxy can't decode HLS — frontend uses direct HLS
  if (platform !== 'linux') return
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
  if (!proxyBase || platform !== 'linux') return
  await fetch(`${proxyBase}/api/player/stop`, { method: 'POST' }).catch(() => {})
}

export async function captureSnapshot(url: string): Promise<string> {
  await resolve()
  if (!proxyBase || platform !== 'linux') throw new Error('snapshot not supported on this platform')

  const res = await fetch(`${proxyBase}/api/snapshot?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`snapshot failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.data
}

export function getStreamUrl(): string {
  return proxyBase ? `${proxyBase}/stream` : ''
}
