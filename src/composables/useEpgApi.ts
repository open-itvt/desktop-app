import { ref } from 'vue'
import type { VodItem } from '@/types'
import { MOCK_CHANNELS_DATA } from '@/composables/useMockData'

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

const apiError = ref(false)
let errorTimeout: ReturnType<typeof setTimeout> | undefined

export function useApiError() {
  function showError() {
    apiError.value = true
    clearTimeout(errorTimeout)
    errorTimeout = setTimeout(() => { apiError.value = false }, 10000)
  }
  function hideError() {
    apiError.value = false
    clearTimeout(errorTimeout)
  }
  return { apiError, showError, hideError }
}

export async function fetchEpg(query?: string): Promise<ApiChannel[]> {
  try {
    const url = query ? `${API_BASE}/api/epg?q=${encodeURIComponent(query)}` : `${API_BASE}/api/epg`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.channels ?? []
  } catch (e) {
    console.warn('EPG API failed, using fallback:', e)
    useApiError().showError()
    return MOCK_CHANNELS_DATA.map(ch => ({
      id: ch.name,
      name: ch.name,
      epg: ch.programs.map((p, i) => ({
        id: `${ch.name}-${i}`,
        title: p.title,
        description: null,
        start: new Date().toISOString(),
        end: new Date(Date.now() + parseInt(p.duration) * 60000).toISOString(),
        category: { id: p.category, name: p.category },
      })),
    }))
  }
}

export async function fetchVod(query?: string): Promise<VodItem[]> {
  try {
    const url = query ? `${API_BASE}/api/vod?q=${encodeURIComponent(query)}` : `${API_BASE}/api/vod`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return (data.items ?? []).map(mapApiVodToItem)
  } catch (e) {
    console.warn('VOD API failed, using fallback:', e)
    useApiError().showError()
    return getFallback()
  }
}

function mapApiVodToItem(api: any): VodItem {
  const ts = api.releaseTime || 0
  return {
    id: parseInt(api.id?.slice(0, 8) || '0', 16) || Math.random(),
    title: api.title || '',
    programName: (api.title || '').replace(/#\d+\s*\|\s*.*$/, '').trim() || api.title || '',
    part: 0,
    programSlug: '',
    videoName: api.name || '',
    claimId: api.id || '',
    thumbnailUrl: api.thumbnail ? `${API_BASE}${api.thumbnail}` : '',
    date: ts ? new Date(ts * 1000).toISOString().split('T')[0] : undefined,
    releaseTime: ts,
    views: 0,
  }
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
