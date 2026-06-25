<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchEpg, useApiError } from '@/composables/useEpgApi'
import ApiErrorBanner from '@/components/ui/ApiErrorBanner.vue'
import { MOCK_CHANNELS_DATA } from '@/composables/useMockData'

interface Program { time: string; title: string; category: string; isLive: boolean }
interface ChannelData { name: string; icon: string; programs: Program[] }

const router = useRouter()
const { apiError, showError } = useApiError()
const channels = ref<ChannelData[]>([])
const loading = ref(true)
const activeDay = ref<'dzis' | 'jutro'>('dzis')
const showFilter = ref(false)
const filterCategory = ref<string | null>(null)
const searchHighlight = ref('')

const JUTRO_DATA: ChannelData[] = [
  {
    name: 'iTVT', icon: 'iT',
    programs: [
      { time: '08:00', title: 'Poranek Technologiczny', category: 'Informacje', isLive: false },
      { time: '10:00', title: 'Fast News IT', category: 'Informacje', isLive: false },
      { time: '14:00', title: 'GStreamer Deep Dive', category: 'Edukacja', isLive: false },
      { time: '19:00', title: 'Wydarzenia Dnia', category: 'Informacje', isLive: true },
      { time: '21:00', title: 'Retrogaming Chiptune', category: 'Rozrywka', isLive: false },
    ],
  },
  {
    name: 'Oliwier Stream', icon: 'OS',
    programs: [
      { time: '09:00', title: 'Poranny Stream', category: 'Rozrywka', isLive: false },
      { time: '14:00', title: 'Speedrun Session', category: 'Gry', isLive: false },
      { time: '20:00', title: 'Oliwier na Żywo', category: 'Rozrywka', isLive: true },
    ],
  },
]

onMounted(async () => {
  try {
    const epg = await fetchEpg()
    channels.value = epg.map(ch => {
      const mock = MOCK_CHANNELS_DATA.find(m => m.name === ch.name) || { icon: ch.name.charAt(0) }
      return { name: ch.name, icon: mock.icon, programs: mapEpgToPrograms(ch.epg) }
    })
  } catch {
    channels.value = MOCK_CHANNELS_DATA.map(ch => ({
      name: ch.name, icon: ch.icon,
      programs: ch.programs.map(p => ({ time: p.time, title: p.title, category: p.category, isLive: p.isLive })),
    }))
    showError()
  }
  loading.value = false

  const q = localStorage.getItem('ivod_search_query')
  if (q) searchHighlight.value = q
  window.addEventListener('search-highlight', (e: Event) => {
    searchHighlight.value = (e as CustomEvent).detail || ''
  })
})

function mapEpgToPrograms(epg: any[]): Program[] {
  return epg.map(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const now = Date.now()
    return {
      time: start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      title: e.title,
      category: e.category?.name || 'Inne',
      isLive: now >= start.getTime() && now < end.getTime(),
    }
  })
}

const displayedData = computed(() => {
  if (activeDay.value === 'dzis') {
    return channels.value.map(ch => ({
      ...ch,
      programs: ch.programs.filter(p => !filterCategory.value || p.category === filterCategory.value),
    })).filter(ch => ch.programs.length > 0)
  }
  return JUTRO_DATA.map(ch => ({
    ...ch,
    programs: ch.programs.filter(p => !filterCategory.value || p.category === filterCategory.value),
  })).filter(ch => ch.programs.length > 0)
})

const allCategories = computed(() => {
  const source = activeDay.value === 'dzis' ? channels.value : JUTRO_DATA
  return [...new Set(source.flatMap(ch => ch.programs.map(p => p.category)))]
})

function setDay(day: 'dzis' | 'jutro') { activeDay.value = day; filterCategory.value = null }
function toggleFilter() { showFilter.value = !showFilter.value }
function setCategory(cat: string | null) { filterCategory.value = cat; showFilter.value = false }
function isHighlighted(title: string): boolean {
  return searchHighlight.value.length > 0 && title.toLowerCase().includes(searchHighlight.value.toLowerCase())
}
</script>

<template>
  <div class="schedule">
    <ApiErrorBanner :visible="apiError" @close="showError" />
    <div class="page-top">
      <h1 class="page-heading">Harmonogram</h1>
      <div class="page-actions">
        <button class="filter-btn" :class="{ active: activeDay === 'dzis' }" @click="setDay('dzis')">Dziś</button>
        <button class="filter-btn" :class="{ active: activeDay === 'jutro' }" @click="setDay('jutro')">Jutro</button>
        <div class="dropdown-wrapper">
          <button class="filter-btn" :class="{ active: showFilter || filterCategory }" @click="toggleFilter">Filtry</button>
          <div v-if="showFilter" class="dropdown-panel" @click.stop>
            <div class="dropdown-option" :class="{ checked: !filterCategory }" @click="setCategory(null)">Wszystkie</div>
            <div v-for="cat in allCategories" :key="cat" class="dropdown-option" :class="{ checked: filterCategory === cat }" @click="setCategory(cat)">{{ cat }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state"><span class="loading-text">Ładowanie harmonogramu...</span></div>

    <div v-else class="schedule-grid">
      <div v-for="ch in displayedData" :key="ch.name + activeDay" class="channel-card">
        <div class="channel-header">
          <span class="channel-icon">{{ ch.icon }}</span>
          <span class="channel-name">{{ ch.name }}</span>
        </div>
        <div class="program-list">
          <div v-for="(prog, i) in ch.programs" :key="i"
            class="program-card"
            :class="{ live: prog.isLive, highlighted: isHighlighted(prog.title) }"
            @click="router.push('/')">
            <div class="program-top">
              <span class="program-time">{{ prog.time }}</span>
              <span v-if="prog.isLive" class="live-tag">LIVE</span>
            </div>
            <div class="program-title">{{ prog.title }}</div>
            <div class="program-meta">{{ prog.category }}</div>
            <div v-if="prog.isLive" class="progress-bar"><div class="progress-fill" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule { padding: 32px; display: flex; flex-direction: column; gap: 24px; height: 100%; }
.filter-btn { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-muted); font-family: var(--font-family); cursor: pointer; background: transparent; padding: 6px 14px; font-size: 13px; transition: all 0.2s; }
.filter-btn.active { background: var(--accent-red); border-color: var(--accent-red); color: #fff; }
.filter-btn:hover:not(.active) { filter: brightness(1.1); }
.dropdown-wrapper { position: relative; }
.dropdown-panel { position: absolute; top: calc(100% + 4px); right: 0; z-index: 50; min-width: 180px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.dropdown-option { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--text-main); transition: filter 0.2s; }
.dropdown-option:hover { filter: brightness(1.1); }
.dropdown-option.checked { color: var(--accent-red); font-weight: 600; }
.page-top { display: flex; align-items: center; justify-content: space-between; }
.page-heading { font-size: 28px; font-weight: 700; color: var(--text-main); margin: 0; }
.page-actions { display: flex; gap: 8px; }
.schedule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; flex: 1; align-content: start; }
.loading-state { display: flex; align-items: center; justify-content: center; padding: 48px; }
.loading-text { font-size: 14px; color: var(--text-muted); }
.channel-card { padding: 16px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer; transition: filter 0.2s; }
.channel-card:hover { filter: brightness(1.1); }
.channel-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
.channel-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--accent-red); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.channel-name { font-size: 18px; font-weight: 700; color: var(--text-main); }
.program-list { display: flex; flex-direction: column; gap: 8px; }
.program-card { padding: 12px 16px; border-radius: var(--radius-sm); background: var(--bg-main); border: 1px solid var(--border-subtle); cursor: pointer; transition: filter 0.2s, border-color 0.2s, background 0.2s; }
.program-card:hover { filter: brightness(1.1); }
.program-card.live { background: var(--accent-red-muted); border-color: var(--accent-red); }
.program-card.highlighted { border-color: var(--accent-red); border-width: 2px; box-shadow: 0 0 0 1px var(--accent-red); }
.program-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.program-time { font-size: 12px; font-weight: 600; color: var(--text-dark); }
.live-tag { font-size: 10px; font-weight: 700; color: var(--accent-red); text-transform: uppercase; letter-spacing: 0.5px; }
.program-title { font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
.program-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
.progress-bar { width: 100%; height: 3px; background: var(--border-subtle); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.progress-fill { height: 100%; width: 45%; background: var(--accent-red); border-radius: 2px; }
</style>
