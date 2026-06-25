import { ref } from 'vue'
import type { VodItem } from '@/types'

const API_BASE = 'https://api.itvt.xyz'

export interface EpgProgram {
  id: string
  title: string
  description: string | null
  start: string
  end: string
  category: { id: string; name: string }
  _virtual?: boolean
}

export interface ApiChannel {
  id: string
  name: string
  epg: EpgProgram[]
}

export interface ChannelInfo {
  id: string
  name: string
  slug: string
}

const apiError = ref(false)
let errorTimeout: ReturnType<typeof setTimeout> | undefined

const channelSlugMap = ref<Record<string, string>>({})

export function useApiError() {
  function showError() {
    apiError.value = true
    clearTimeout(errorTimeout)
    errorTimeout = setTimeout(() => { apiError.value = false }, 10000)
  }
  function hideError() { apiError.value = false; clearTimeout(errorTimeout) }
  return { apiError, showError, hideError }
}

export async function fetchChannels(): Promise<ChannelInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/channels`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list: any[] = await res.json()
    const channels = list.map((ch: any) => ({
      id: ch.id, name: ch.name,
      slug: ch.channelSlug || ch.slug || ch.name.toLowerCase().replace(/\s+/g, '-'),
    }))
    const map: Record<string, string> = {}
    for (const ch of channels) map[ch.name] = ch.slug
    channelSlugMap.value = map
    return channels
  } catch (e) {
    console.warn('Channels API failed, using fallback:', e)
    const fb: ChannelInfo[] = [
      { id: 'itvt', name: 'iTVT', slug: 'itvt' },
      { id: 'oliwier', name: 'Oliwier Stream', slug: 'o-stream' },
    ]
    const map: Record<string, string> = {}
    for (const ch of fb) map[ch.name] = ch.slug
    channelSlugMap.value = map
    return fb
  }
}

export function getChannelSlug(channelName: string): string {
  return channelSlugMap.value[channelName] || channelName.toLowerCase().replace(/\s+/g, '-')
}

export function filterEpgByDay(channels: ApiChannel[], dayOffset: number): ApiChannel[] {
  const target = new Date()
  target.setDate(target.getDate() + dayOffset)
  const ds = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const de = new Date(ds.getTime() + 86400000)
  return channels.map(ch => ({
    ...ch,
    epg: ch.epg.filter(p => { const s = new Date(p.start); return s >= ds && s < de }),
  })).filter(ch => ch.epg.length > 0)
}

export function getUpcomingForChannel(channels: ApiChannel[], channelName: string, count = 4) {
  const ch = channels.find(c => c.name === channelName)
  if (!ch) return []
  const now = new Date()
  return ch.epg
    .filter(p => new Date(p.end) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, count)
    .map(p => ({
      time: new Date(p.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      title: p.title,
    }))
}

export async function fetchEpg(query?: string): Promise<ApiChannel[]> {
  try {
    const url = query ? `${API_BASE}/api/epg?q=${encodeURIComponent(query)}` : `${API_BASE}/api/epg`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()).channels ?? []
  } catch (e) {
    console.warn('EPG API failed, using fallback:', e)
    useApiError().showError()
    return []
  }
}

export async function fetchVod(query?: string): Promise<VodItem[]> {
  try {
    const url = query ? `${API_BASE}/api/vod?q=${encodeURIComponent(query)}` : `${API_BASE}/api/vod`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return ((await res.json()).items ?? []).map(mapApi)
  } catch (e) {
    console.warn('VOD API failed, using fallback:', e)
    useApiError().showError()
    return fallbackVod()
  }
}

function mapApi(api: any): VodItem {
  const ts = api.releaseTime || 0
  return {
    id: parseInt(api.id?.slice(0, 8) || '0', 16) || Math.random(),
    title: api.title || '',
    programName: (api.title || '').replace(/#\d+\s*\|\s*.*$/, '').trim() || api.title || '',
    part: 0, programSlug: '',
    videoName: api.name || '',
    claimId: api.id || '',
    thumbnailUrl: api.thumbnail ? `${API_BASE}${api.thumbnail}` : '',
    date: ts ? new Date(ts * 1000).toISOString().split('T')[0] : undefined,
    releaseTime: ts, views: 0,
  }
}

function fallbackVod(): VodItem[] {
  return [
    { id: 101, title: 'Retro time #5 | 28.11.24', programName: 'Retro Time', part: 5, programSlug: 'retro-time',
      videoName: 'retrotime_28.11.24', claimId: 'a4052396df05e011d2cbbbb0b16a00238fd54fcd',
      thumbnailUrl: 'https://thumbnails.odycdn.com/card/s:640:360/quality:85/plain/https://odysee.com/retrotime_28.11.24/a4052396df05e011d2cbbbb0b16a00238fd54fcd',
      date: '2024-11-28', releaseTime: 1732752000, views: 120 },
    { id: 102, title: 'Retro time #4 | 21.11.24', programName: 'Retro Time', part: 4, programSlug: 'retro-time',
      videoName: 'retrotime_21.11.24', claimId: 'a4052396df05e011d2cbbbb0b16a00238fd54fc',
      thumbnailUrl: 'https://thumbnails.odycdn.com/card/s:640:360/quality:85/plain/https://odysee.com/retrotime_21.11.24/a4052396df05e011d2cbbbb0b16a00238fd54fc',
      date: '2024-11-21', releaseTime: 1732147200, views: 85 },
  ]
}
