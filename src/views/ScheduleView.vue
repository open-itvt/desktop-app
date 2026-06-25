<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchEpg, filterEpgByDay, useApiError } from '@/composables/useEpgApi'
import ApiErrorBanner from '@/components/ui/ApiErrorBanner.vue'
import { MOCK_CHANNELS_DATA } from '@/composables/useMockData'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const { apiError, showError } = useApiError()
const channels = ref<any[]>([])
const loading = ref(true)
const selectedDay = ref(0)     // 0=today, 1=tomorrow, …
const showDayPicker = ref(false)
const searchHighlight = ref('')

function dayLabel(offset: number): string {
  if (offset === 0) return 'Dziś'
  if (offset === 1) return 'Jutro'
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'short' })
}

const days = Array.from({ length: 7 }, (_, i) => i)

const filteredChannels = computed(() => {
  const epg = filterEpgByDay(channels.value, selectedDay.value)
  return epg.map(ch => {
    const mock = MOCK_CHANNELS_DATA.find(m => m.name === ch.name) || { icon: ch.name.charAt(0) }
    return {
      name: ch.name,
      icon: mock.icon,
      programs: ch.epg.map(p => {
        const start = new Date(p.start)
        const end = new Date(p.end)
        const now = Date.now()
        return {
          time: start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
          title: p.title,
          category: p.category?.name || 'Inne',
          isLive: selectedDay.value === 0 && now >= start.getTime() && now < end.getTime(),
        }
      }),
    }
  })
})

onMounted(async () => {
  try {
    channels.value = await fetchEpg()
  } catch {
    showError()
  }
  loading.value = false

  const q = localStorage.getItem('ivod_search_query')
  if (q && q.length > 0) searchHighlight.value = q
  window.addEventListener('search-highlight', (e: Event) => {
    searchHighlight.value = (e as CustomEvent).detail || ''
  })
})

function selectDay(offset: number) { selectedDay.value = offset; showDayPicker.value = false }
function isHighlighted(title: string): boolean {
  return searchHighlight.value.length > 0 && title.toLowerCase().includes(searchHighlight.value.toLowerCase())
}
</script>

<template>
  <div class="schedule">
    <ApiErrorBanner :visible="apiError" @close="apiError = false" />
    <div class="page-top">
      <h1 class="page-heading">Harmonogram</h1>
      <div class="page-actions">
        <div class="day-picker-wrapper">
          <button class="filter-btn active" @click="showDayPicker = !showDayPicker">
            {{ dayLabel(selectedDay) }}
            <ChevronDownIcon class="chevron-icon" />
          </button>
          <div v-if="showDayPicker" class="day-picker-dropdown" @click.stop>
            <div
              v-for="d in days"
              :key="d"
              class="day-option"
              :class="{ checked: selectedDay === d }"
              @click="selectDay(d)"
            >
              {{ dayLabel(d) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state"><span class="loading-text">Ładowanie harmonogramu...</span></div>

    <div v-else class="schedule-grid">
      <div v-if="filteredChannels.length === 0 && !loading" class="loading-state">
        <span class="loading-text">Brak programów tego dnia</span>
      </div>
      <div v-for="ch in filteredChannels" :key="ch.name + '-' + selectedDay" class="channel-card">
        <div class="channel-header">
          <span class="channel-icon">{{ ch.icon }}</span>
          <span class="channel-name">{{ ch.name }}</span>
        </div>
        <div class="program-list">
          <div v-if="ch.programs.length === 0" class="empty-prog">Brak programów tego dnia</div>
          <div
            v-for="(prog, i) in ch.programs"
            :key="i"
            class="program-card"
            :class="{ live: prog.isLive, highlighted: isHighlighted(prog.title) }"
            @click="$router.push('/?channel=' + encodeURIComponent(ch.name))"
          >
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

.page-top { display: flex; align-items: center; justify-content: space-between; }
.page-heading { font-size: 28px; font-weight: 700; color: var(--text-main); margin: 0; }
.page-actions { display: flex; gap: 8px; position: relative; }

.day-picker-wrapper { position: relative; }
.filter-btn { display: flex; align-items: center; gap: 4px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-muted); font-family: var(--font-family); cursor: pointer; background: transparent; padding: 6px 14px; font-size: 13px; transition: all 0.2s; }
.filter-btn.active { background: var(--accent-red); border-color: var(--accent-red); color: #fff; }
.chevron-icon { width: 14px; height: 14px; }

.day-picker-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 50; min-width: 200px;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  padding: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.day-option { padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--text-main); transition: filter 0.2s; }
.day-option:hover { filter: brightness(1.1); }
.day-option.checked { color: var(--accent-red); font-weight: 600; }

.loading-state { display: flex; align-items: center; justify-content: center; padding: 48px; }
.loading-text { font-size: 14px; color: var(--text-muted); }

.schedule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; flex: 1; align-content: start; }
.channel-card { padding: 16px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer; transition: filter 0.2s; }
.channel-card:hover { filter: brightness(1.1); }
.channel-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
.channel-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--accent-red); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.channel-name { font-size: 18px; font-weight: 700; color: var(--text-main); }
.program-list { display: flex; flex-direction: column; gap: 8px; }
.empty-prog { padding: 16px; text-align: center; font-size: 13px; color: var(--text-dark); }
.program-card { padding: 12px 16px; border-radius: var(--radius-sm); background: var(--bg-main); border: 1px solid var(--border-subtle); cursor: pointer; transition: filter 0.2s, border-color 0.2s, background 0.2s; }
.program-card:hover { background: var(--bg-card-hover, var(--bg-card)); }
.program-card.live { border-color: var(--accent-red); border-width: 0.5px; }
.program-card.highlighted { border-color: var(--accent-red); box-shadow: 0 0 0 1px var(--accent-red); }
.program-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.program-time { font-size: 12px; font-weight: 600; color: var(--text-dark); }
.live-tag { font-size: 10px; font-weight: 700; color: var(--accent-red); text-transform: uppercase; letter-spacing: 0.5px; }
.program-title { font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
.program-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
.progress-bar { width: 100%; height: 3px; background: var(--border-subtle); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.progress-fill { height: 100%; width: 45%; background: var(--accent-red); border-radius: 2px; }
</style>
