export const CACHE_KEY = 'ivod_thumb_cache'
const TTL = 4 * 60 * 60 * 1000 // 4 hours

interface CacheEntry {
  dataUrl: string
  timestamp: number
}

// In-memory cache — instant access after first load
const memoryCache = new Map<string, string>()
let loaded = false

function loadFromStorage() {
  if (loaded) return
  loaded = true
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const entries: Record<string, CacheEntry> = JSON.parse(raw)
    const now = Date.now()
    for (const [url, entry] of Object.entries(entries)) {
      if (now - entry.timestamp < TTL) {
        memoryCache.set(url, entry.dataUrl)
      } else {
        // Expired — clean it from storage
        delete entries[url]
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries))
  } catch { /* ignore */ }
}

function persist() {
  try {
    const obj: Record<string, CacheEntry> = {}
    for (const [url, dataUrl] of memoryCache) {
      obj[url] = { dataUrl, timestamp: Date.now() }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch {
    // Storage full — clear oldest entries
    try {
      let oldest: [string, number][] = []
      for (const [url] of memoryCache) {
        const ts = Date.now()
        oldest.push([url, ts])
      }
      oldest.sort((a, b) => a[1] - b[1])
      // Remove oldest 20%
      const removeCount = Math.max(1, Math.floor(oldest.length * 0.2))
      for (let i = 0; i < removeCount; i++) {
        memoryCache.delete(oldest[i][0])
      }
      persist()
    } catch { /* give up */ }
  }
}

export async function useCachedThumbnail(url: string): Promise<string> {
  loadFromStorage()

  const cached = memoryCache.get(url)
  if (cached) return cached

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    memoryCache.set(url, dataUrl)
    persist()
    return dataUrl
  } catch {
    return url // fallback to direct URL
  }
}

export function getCachedThumbnailSync(url: string): string | undefined {
  loadFromStorage()
  return memoryCache.get(url)
}
