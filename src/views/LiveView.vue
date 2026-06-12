<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/vue/24/outline'
import LiveBadge from '@/components/ui/LiveBadge.vue'
import {
  MOCK_CHANNEL_DATA,
  CHANNELS,
  CHANNEL_HLS,
} from '@/composables/useMockData'
import type { ChannelName } from '@/composables/useMockData'

const route = useRoute()
const router = useRouter()

const channelName = computed(() => {
  const name = route.params.channel as string
  if (CHANNELS.includes(name as ChannelName)) return name as ChannelName
  return 'iTVT' as ChannelName
})

const channel = computed(() => MOCK_CHANNEL_DATA[channelName.value])
const streamUrl = ref('')
const loading = ref(true)
const playing = ref(true)
const fullscreen = ref(false)
const volume = ref(50)
const muted = ref(false)
let activePort: number | null = null

async function startStream() {
  loading.value = true
  const hlsUrl = CHANNEL_HLS[channelName.value]
  if (!hlsUrl) return

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const port = await invoke<number>('start_player', { url: hlsUrl })
      activePort = port
      streamUrl.value = `http://127.0.0.1:${port}/stream`
      loading.value = false
      return
    } catch (e) {
      console.error(`Attempt ${attempt + 1} failed:`, e)
      await new Promise(r => setTimeout(r, 300))
    }
  }
  loading.value = false
}

async function stopStream() {
  if (activePort !== null) {
    try { await invoke('stop_player') } catch (_) {}
    activePort = null
    streamUrl.value = ''
  }
}

watch(channelName, () => {
  stopStream().then(() => startStream())
})

startStream()

onUnmounted(() => {
  stopStream()
})

function togglePlay() {
  playing.value = !playing.value
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
  const el = document.querySelector('.player-wrap')
  if (el) {
    if (fullscreen.value) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
}

function toggleMute() {
  muted.value = !muted.value
}
</script>

<template>
  <div class="live-view">
    <div class="live-topbar">
      <button class="ctrl-btn back-btn" @click="router.push('/')">
        <ArrowLeftIcon class="ctrl-icon" />
      </button>
      <div class="topbar-center">
        <LiveBadge />
        <span class="channel-label">{{ channel.name }}</span>
      </div>
      <button class="ctrl-btn" @click="toggleFullscreen" title="Pełny ekran">
        <ArrowsPointingOutIcon v-if="!fullscreen" class="ctrl-icon" />
        <ArrowsPointingInIcon v-else class="ctrl-icon" />
      </button>
    </div>

    <div class="player-wrap">
      <img
        v-if="streamUrl && playing"
        :src="streamUrl"
        class="player-stream"
        alt="Live stream"
      />
      <div v-else-if="loading" class="player-overlay-content">
        <div class="spinner" />
        <span class="overlay-text">Ładowanie strumienia...</span>
      </div>
      <div v-else-if="!playing" class="player-overlay-content">
        <PlayIcon class="big-icon" />
        <span class="overlay-text">Wstrzymano</span>
      </div>
      <div v-else class="player-overlay-content">
        <span class="overlay-text">Brak strumienia</span>
      </div>
    </div>

    <div class="player-controls">
      <button class="ctrl-btn" @click="togglePlay" :title="playing ? 'Wstrzymaj' : 'Odtwarzaj'">
        <PauseIcon v-if="playing" class="ctrl-icon" />
        <PlayIcon v-else class="ctrl-icon" />
      </button>
      <div class="volume-wrap">
        <button class="ctrl-btn ctrl-btn--small" @click="toggleMute" :title="muted ? 'Włącz dźwięk' : 'Wycisz'">
          <SpeakerXMarkIcon v-if="muted || volume === 0" class="ctrl-icon" />
          <SpeakerWaveIcon v-else class="ctrl-icon" />
        </button>
        <input
          v-model.number="volume"
          type="range"
          min="0"
          max="100"
          class="volume-slider"
          @input="muted = volume === 0"
        />
      </div>
      <div class="controls-info">
        <span class="program-title">{{ channel.currentProgram }}</span>
        <span class="time-range">{{ channel.timeRange }}</span>
      </div>
      <button class="ctrl-btn" @click="toggleFullscreen" title="Pełny ekran">
        <ArrowsPointingOutIcon v-if="!fullscreen" class="ctrl-icon" />
        <ArrowsPointingInIcon v-else class="ctrl-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.live-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  color: #fff;
}

.live-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%);
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.channel-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.ctrl-btn--small {
  width: 32px;
  height: 32px;
}

.ctrl-btn:hover {
  background: rgba(255,255,255,0.15);
}

.ctrl-icon {
  width: 20px;
  height: 20px;
}

.player-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  position: relative;
}

.player-stream {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.5);
}

.overlay-text {
  font-size: 14px;
}

.big-icon {
  width: 48px;
  height: 48px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--bg-main);
  border-top: 1px solid var(--border-subtle);
}

.controls-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.program-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.time-range {
  font-size: 12px;
  color: var(--text-muted);
}

.volume-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-red);
  border: none;
  cursor: pointer;
  transition: transform 0.15s;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-red);
  border: none;
  cursor: pointer;
}
</style>
