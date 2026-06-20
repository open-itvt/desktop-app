import type { Channel, EpgEntry, UpcomingProgram } from '@/types'

export const CHANNELS = ['iTVT', 'Oliwier Stream'] as const
export type ChannelName = typeof CHANNELS[number]

export const CHANNEL_SLUGS: Record<ChannelName, string> = {
  'iTVT': 'itvt',
  'Oliwier Stream': 'o-stream',
}

export const PLAYER_BASE_URL = 'https://player-itv.itvt.xyz/channels'
export const HLS_API_BASE = 'https://video-itv.itvt.xyz'

export const CHANNEL_HLS: Record<ChannelName, string> = {
  'iTVT': `${HLS_API_BASE}/live/itvt/index.m3u8`,
  'Oliwier Stream': `${HLS_API_BASE}/live/o-stream/index.m3u8`,
}

export const MOCK_CHANNEL_DATA: Record<ChannelName, Channel> = {
  'iTVT': {
    name: 'iTVT',
    currentProgram: 'Kodujemy z Klubuntu - znów damy radę',
    timeRange: '19:00 - 21:00',
  },
  'Oliwier Stream': {
    name: 'Oliwier Stream',
    currentProgram: 'Gaming Session',
    timeRange: '22:00 - 01:00',
  },
}

export const MOCK_UPCOMING: Record<ChannelName, UpcomingProgram[]> = {
  'iTVT': [
    { time: '21:00', title: 'Fast News IT' },
    { time: '22:00', title: 'Retrogaming Chiptune Session' },
    { time: '23:00', title: 'Nocne Kino' },
  ],
  'Oliwier Stream': [
    { time: '20:00', title: 'Oliwier na Żywo' },
    { time: '22:00', title: 'Gaming Session' },
    { time: '00:00', title: 'Powtórka Vloga' },
    { time: '02:00', title: 'Muzyka na Dobranoc' },
  ],
}

export const MOCK_EPG: Record<ChannelName, EpgEntry[]> = {
  'iTVT': [
    { time: '18:00', title: 'Poranek Technologiczny', isLive: false },
    { time: '19:00', title: 'Kodowanie z Klubuntu', isLive: true },
    { time: '20:00', title: 'Fast News IT', isLive: false },
    { time: '21:00', title: 'Retrogaming', isLive: false },
  ],
  'Oliwier Stream': [
    { time: '18:00', title: 'Vlog Dnia', isLive: false },
    { time: '20:00', title: 'Oliwier na Żywo', isLive: false },
    { time: '22:00', title: 'Gaming Session', isLive: true },
  ],
}

export const MOCK_CHANNELS_DATA = [
  {
    name: 'iTVT' as ChannelName,
    icon: 'iT',
    programs: [
      { time: '12:00', title: 'GStreamer Pipelines', category: 'Edukacja', duration: '45', isLive: false },
      { time: '15:00', title: 'Konfiguracja NixOS', category: 'Edukacja', duration: '60', isLive: false },
      { time: '19:00', title: 'Kodowanie z Klubuntu', category: 'Informacje', duration: '120', isLive: true },
      { time: '21:00', title: 'Fast News IT', category: 'Informacje', duration: '30', isLive: false },
      { time: '22:00', title: 'Retrogaming Chiptune', category: 'Rozrywka', duration: '120', isLive: false },
    ],
  },
  {
    name: 'Oliwier Stream' as ChannelName,
    icon: 'OS',
    programs: [
      { time: '14:00', title: 'Stream Popołudniowy', category: 'Rozrywka', duration: '120', isLive: false },
      { time: '18:00', title: 'Vlog Dnia', category: 'Vlog', duration: '30', isLive: false },
      { time: '20:00', title: 'Oliwier na Żywo', category: 'Rozrywka', duration: '120', isLive: true },
      { time: '22:00', title: 'Gaming Session', category: 'Gry', duration: '180', isLive: false },
    ],
  },
]
