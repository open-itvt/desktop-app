<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MagnifyingGlassIcon, BellIcon, XMarkIcon, ArrowLeftIcon, TvIcon } from '@heroicons/vue/24/outline'
import { searchVideos } from '@/composables/useOdysee'
import { CHANNELS, MOCK_CHANNELS_DATA } from '@/composables/useMockData'
import { useProfile } from '@/composables/useProfile'
import type { VodItem } from '@/types'

interface ChannelResult {
  type: 'channel'
  name: string
  slug: string
}

interface EpgProgramResult {
  type: 'epg'
  title: string
  channel: string
  time: string
  category: string
}

type SearchResult = VodItem | ChannelResult | EpgProgramResult

const route = useRoute()
const router = useRouter()
const { profile } = useProfile()

const clock = ref('')
let intervalId: ReturnType<typeof setInterval> | undefined

function updateClock() {
  const now = new Date()
  clock.value = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  updateClock()
  intervalId = setInterval(updateClock, 10000)
  window.addEventListener('open-search', openSearch)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  window.removeEventListener('open-search', openSearch)
})

const showSearch = ref(false)
const showNotifications = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searching = ref(false)
const searched = ref(false)

watch(searchQuery, () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    searched.value = false
  }
})

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

  searching.value = true
  searched.value = true

  const ql = q.toLowerCase()
  const channelResults: ChannelResult[] = CHANNELS
    .filter(ch => ch.toLowerCase().includes(ql))
    .map(ch => ({ type: 'channel' as const, name: ch, slug: ch.toLowerCase().replace(/\s+/g, '-') }))

  // Search EPG programs
  const epgResults: EpgProgramResult[] = []
  for (const ch of MOCK_CHANNELS_DATA) {
    for (const prog of ch.programs) {
      if (prog.title.toLowerCase().includes(ql) || prog.category.toLowerCase().includes(ql)) {
        epgResults.push({
          type: 'epg',
          title: prog.title,
          channel: ch.name,
          time: prog.time,
          category: prog.category,
        })
      }
    }
  }

  let vodResults: VodItem[] = []
  try {
    vodResults = await searchVideos(q)
  } catch { /* ignore */ }

  searchResults.value = [...channelResults, ...epgResults, ...vodResults]
  searching.value = false

  // Store search term for highlighting in ScheduleView
  localStorage.setItem('ivod_search_query', q)
  window.dispatchEvent(new CustomEvent('search-highlight', { detail: q }))
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') doSearch()
}

function openSearch() {
  showSearch.value = true
  searchResults.value = []
  searched.value = false
  searchQuery.value = ''
}

function closeSearch() {
  showSearch.value = false
  searchResults.value = []
  searched.value = false
  searchQuery.value = ''
  localStorage.removeItem('ivod_search_query')
  window.dispatchEvent(new CustomEvent('search-highlight', { detail: '' }))
}

function isVod(r: SearchResult): r is VodItem { return 'videoName' in r }
function isChannel(r: SearchResult): r is ChannelResult { return !isVod(r) && (r as any).type === 'channel' }
function isEpg(r: SearchResult): r is EpgProgramResult { return !isVod(r) && (r as any).type === 'epg' }

function resultTitle(r: SearchResult): string {
  if (isVod(r)) return r.title
  if (isChannel(r)) return r.name
  return r.title
}

function resultMeta(r: SearchResult): string {
  if (isVod(r)) return r.date || ''
  if (isChannel(r)) return 'Kanał'
  return `${r.channel} · ${r.time}`
}

function goToResult(r: SearchResult) {
  closeSearch()
  if ('videoName' in r) {
    router.push(`/watch/${encodeURIComponent(r.videoName)}/${encodeURIComponent(r.claimId)}`)
  } else if (r.type === 'channel') {
    router.push(`/live/${r.slug}`)
  } else if (r.type === 'epg') {
    const slug = CHANNELS.find(ch => ch.toLowerCase().includes(r.channel.toLowerCase()))?.toLowerCase().replace(/\s+/g, '-') || 'itvt'
    router.push(`/live/${slug}`)
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function goToProfile() {
  router.push('/profile')
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div>
    <header class="topbar">
      <div class="topbar-left">
        <button v-if="route.path !== '/'" class="back-btn" @click="goBack">
          <ArrowLeftIcon class="back-icon" />
        </button>
        <span class="logo" @click="router.push('/')">iTVT</span>
      </div>
      <div class="topbar-center">
        <div class="search-wrapper" @click="openSearch">
          <MagnifyingGlassIcon class="search-icon" />
          <input type="text" class="search-input" placeholder="Szukaj..." readonly />
        </div>
      </div>
      <div class="topbar-right">
        <span class="clock">{{ clock }}</span>
        <button class="icon-btn" @click="toggleNotifications">
          <BellIcon class="icon" />
        </button>
        <div class="avatar" @click="goToProfile">{{ profile.initial }}</div>
      </div>
    </header>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSearch" class="modal-overlay" @click.self="closeSearch">
          <div class="modal-card search-card">
            <div class="modal-header">
              <h2 class="modal-title">Szukaj</h2>
              <button class="modal-close" @click="closeSearch">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="search-input-wrap">
              <MagnifyingGlassIcon class="search-input-icon" />
              <input
                v-model="searchQuery"
                type="text"
                class="search-modal-input"
                placeholder="Szukaj programów, kanałów..."
                autofocus
                @keydown="onSearchKeydown"
              />
              <button class="search-go-btn" @click="doSearch">Szukaj</button>
            </div>

            <div v-if="searching" class="search-status">Szukanie...</div>

            <div v-else-if="searched && searchResults.length === 0" class="search-status">
              Brak wyników
            </div>

            <div v-else-if="searchResults.length > 0" class="search-results">
              <div
                v-for="(r, i) in searchResults"
                :key="i"
                class="result-row"
                @click="goToResult(r)"
              >
                <div v-if="isVod(r)" class="result-icon channel">
                  <img :src="r.thumbnailUrl" class="result-thumb" alt="" />
                </div>
                <div v-else-if="isEpg(r)" class="result-icon epg">
                  <span class="r-epg-time">{{ r.time }}</span>
                </div>
                <div v-else class="result-icon channel">
                  <TvIcon class="r-icon" />
                </div>
                <div class="result-info">
                  <span class="result-title">{{ resultTitle(r) }}</span>
                  <span class="result-meta">{{ resultMeta(r) }}</span>
                </div>
              </div>
            </div>

            <p v-else class="hint-text">
              Wpisz nazwę i naciśnij Enter, albo kliknij Szukaj
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showNotifications" class="modal-overlay" @click.self="toggleNotifications">
          <div class="modal-card">
            <div class="modal-header">
              <h2 class="modal-title">Powiadomienia</h2>
              <button class="modal-close" @click="toggleNotifications">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="notif-list">
              <div class="notif-item">
                <div class="notif-dot" />
                <div class="notif-content">
                  <span class="notif-title">Nowy program na żywo</span>
                  <span class="notif-desc">Wydarzenia Dnia rozpoczęły się na iTVT</span>
                  <span class="notif-time">Teraz</span>
                </div>
              </div>
              <div class="notif-item">
                <div class="notif-dot muted" />
                <div class="notif-content">
                  <span class="notif-title">Fast News IT za 30 min</span>
                  <span class="notif-desc">Nadchodzący program na kanale iTVT</span>
                  <span class="notif-time">20:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: var(--topbar-height);
  padding: 0 24px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-subtle);
  gap: 24px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 200px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: filter 0.2s;
}

.logo:hover { filter: brightness(1.1); }

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: filter 0.2s, background 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.back-icon { width: 18px; height: 18px; }

.topbar-center { flex: 1; display: flex; justify-content: center; }

.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  cursor: text;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%) scaleX(-1);
  width: 18px; height: 18px;
  color: var(--text-muted);
  opacity: 0.55;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: var(--font-family);
  font-size: 14px;
  outline: none;
  cursor: text;
}

.search-input::placeholder { color: var(--text-muted); }

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 200px;
  justify-content: flex-end;
}

.clock {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: filter 0.2s;
}

.icon-btn:hover { filter: brightness(1.1); }

.icon { width: 20px; height: 20px; }

.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent-red);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s;
}

.avatar:hover { filter: brightness(1.1); }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  padding-top: 60px;
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 560px;
  height: fit-content;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}

.modal-close {
  width: 32px; height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s;
}

.modal-close:hover { filter: brightness(1.1); }

.close-icon { width: 18px; height: 18px; }

.search-input-wrap {
  position: relative;
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.search-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%) scaleX(-1);
  width: 20px; height: 20px;
  color: var(--text-muted);
  opacity: 0.55;
  pointer-events: none;
}

.search-modal-input {
  flex: 1;
  padding: 12px 14px 12px 42px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-family);
  font-size: 15px;
  outline: none;
}

.search-modal-input:focus { border-color: var(--border-focus); }
.search-modal-input::placeholder { color: var(--text-muted); }

.search-go-btn {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent-red);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s;
  flex-shrink: 0;
}

.search-go-btn:hover { filter: brightness(0.85); }

.search-status {
  text-align: center;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 13px;
  flex-shrink: 0;
}

.search-results {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: filter 0.2s;
}

.result-row:hover { filter: brightness(1.1); }

.result-icon.channel {
  width: 44px; height: 32px;
  border-radius: 4px;
  background: var(--accent-red-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.r-icon { width: 18px; height: 18px; color: var(--accent-red); }

.r-epg-time {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-red);
}

.result-thumb {
  width: 44px; height: 32px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--bg-main);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 11px;
  color: var(--text-dark);
}

.hint-text {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: 16px 0;
  flex-shrink: 0;
}

.notif-list { display: flex; flex-direction: column; gap: 4px; }

.notif-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: filter 0.2s;
}

.notif-item:hover { filter: brightness(1.1); }

.notif-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--accent-red);
  margin-top: 5px;
  flex-shrink: 0;
}

.notif-dot.muted { background: var(--text-dark); }

.notif-content { display: flex; flex-direction: column; gap: 2px; }

.notif-title { font-size: 14px; font-weight: 600; color: var(--text-main); }
.notif-desc { font-size: 12px; color: var(--text-muted); }
.notif-time { font-size: 11px; color: var(--text-dark); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
