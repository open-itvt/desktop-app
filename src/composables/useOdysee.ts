import type { VodItem } from '@/types'

const API_URL = 'https://api.lbry.tv/api/v1/proxy'
const CHANNEL = '@itvt:9'
const CACHE_KEY = 'ivod_vod_cache'
const CACHE_TTL = 12 * 60 * 60 * 1000

interface LbryClaim {
  name: string
  claim_id: string
  value: {
    title?: string
    description?: string
    thumbnail?: { url: string }
    release_time: number
    stream_type?: string
    source?: { media_type?: string; duration?: number }
  }
}

interface CacheData {
  timestamp: number
  items: VodItem[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractPart(title: string): number | undefined {
  const match = title.match(/#(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

function parseProgramName(title: string): string {
  const cleaned = title.replace(/#\d+\s*\|\s*.*$/, '').trim()
  return cleaned || title
}

function mapClaimToVodItem(claim: LbryClaim): VodItem | null {
  if (claim.value.stream_type !== 'video') return null

  const title = claim.value.title || claim.name
  const part = extractPart(title)
  const videoName = claim.name
  const programName = title.includes('Oliwier Stream') || videoName.startsWith('o.stream')
    ? 'Oliwier Stream'
    : parseProgramName(title)
  const claimId = claim.claim_id
  const releaseDate = claim.value.release_time
    ? new Date(claim.value.release_time * 1000).toISOString().split('T')[0]
    : undefined

  const thumbnailUrl = claim.value.thumbnail?.url ||
    `https://thumbnails.odycdn.com/card/s:640:360/quality:85/plain/https://odysee.com/${videoName}/${claimId}`

  return {
    id: parseInt(claimId.slice(0, 8), 16) || Math.random(),
    title,
    programName,
    part: part || 0,
    programSlug: slugify(programName),
    videoName,
    claimId,
    thumbnailUrl,
    date: releaseDate,
    releaseTime: claim.value.release_time || 0,
    views: 0,
  }
}

export async function searchVideos(query: string): Promise<VodItem[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'claim_search',
        params: {
          text: query,
          channel: CHANNEL,
          claim_type: 'stream',
          page_size: 20,
          order_by: ['release_time'],
        },
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const claims: LbryClaim[] = data?.result?.items ?? []

    return claims
      .map(mapClaimToVodItem)
      .filter((v): v is VodItem => v !== null)
  } catch (err) {
    console.warn('Search failed:', err)
    return []
  }
}

export async function fetchChannelVideos(): Promise<VodItem[]> {
  const cached = readCache()
  if (cached) return cached

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'claim_search',
        params: {
          channel: CHANNEL,
          claim_type: 'stream',
          page_size: 50,
          order_by: ['release_time'],
        },
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const claims: LbryClaim[] = data?.result?.items ?? []

    const items = claims
      .map(mapClaimToVodItem)
      .filter((v): v is VodItem => v !== null)

    writeCache(items)
    return items
  } catch (err) {
    console.warn('Odysee API failed, using fallback:', err)
    return getFallback()
  }
}

function readCache(): VodItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data: CacheData = JSON.parse(raw)
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data.items
    }
  } catch { /* ignore */ }
  return null
}

function writeCache(items: VodItem[]) {
  try {
    const data: CacheData = { timestamp: Date.now(), items }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function getFallback(): VodItem[] {
  return [
    {
      id: 101, title: 'Retro time #5 | 28.11.24', programName: 'Retro Time', part: 5, programSlug: 'retro-time',
      videoName: 'retrotime_28.11.24', claimId: 'a4052396df05e011d2cbbbb0b16a00238fd54fcd',
      thumbnailUrl: 'https://thumbnails.odycdn.com/card/s:640:360/quality:85/plain/https://odysee.com/retrotime_28.11.24/a4052396df05e011d2cbbbb0b16a00238fd54fcd',
      date: '2024-11-28', releaseTime: 1732752000, views: 120,
    },
    {
      id: 102, title: 'Retro time #4 | 21.11.24', programName: 'Retro Time', part: 4, programSlug: 'retro-time',
      videoName: 'retrotime_21.11.24', claimId: 'a4052396df05e011d2cbbbb0b16a00238fd54fc',
      thumbnailUrl: 'https://thumbnails.odycdn.com/card/s:640:360/quality:85/plain/https://odysee.com/retrotime_21.11.24/a4052396df05e011d2cbbbb0b16a00238fd54fc',
      date: '2024-11-21', releaseTime: 1732147200, views: 85,
    },
  ]
}
