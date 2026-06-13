<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { startPlayer, stopPlayer, getStreamUrl, isLinux } from '@/composables/useBackend'
import { CHANNEL_SLUGS, PLAYER_BASE_URL } from '@/composables/useMockData'

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
const playing = ref(false)
const fullscreen = ref(false)
const volume = ref(50)
const muted = ref(false)
const useEmbed = computed(() => !isLinux())
const iframeRef = ref<HTMLIFrameElement | null>(null)
const embedUrl = computed(() => {
  const slug = CHANNEL_SLUGS[channelName.value]
  return `${PLAYER_BASE_URL}/${slug}?controls=false&blur=0`
})

function postMsg(type: string, payload?: Record<string, any>) {
  iframeRef.value?.contentWindow?.postMessage({ type, ...payload }, '*')
}

async function startStream() {
  loading.value = true
  const hlsUrl = CHANNEL_HLS[channelName.value]
  if (!hlsUrl) { loading.value = false; return }

  if (isLinux()) {
    // Linux: use GStreamer pipeline → MJPEG via proxy
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await startPlayer(hlsUrl)
        streamUrl.value = getStreamUrl()
        loading.value = false
        return
      } catch (e) {
        console.error(`Attempt ${attempt + 1} failed:`, e)
        await new Promise(r => setTimeout(r, 300))
      }
    }
  } else {
    // Win/Mac: direct HLS via <video> tag
    streamUrl.value = hlsUrl
    loading.value = false
  }
}

async function stopStream() {
  if (isLinux()) await stopPlayer()
  streamUrl.value = ''
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
  if (useEmbed.value) {
    // When playing becomes true, tell the embed to start
    if (playing.value) postMsg('play')
    else postMsg('pause')
  }
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
  if (useEmbed.value) {
    postMsg('fullscreen', { active: fullscreen.value })
  } else {
    const el = document.querySelector('.player-wrap')
    if (el) {
      if (fullscreen.value) el.requestFullscreen?.()
      else document.exitFullscreen?.()
    }
  }
}

function toggleMute() {
  muted.value = !muted.value
  if (useEmbed.value) {
    postMsg('mute', { active: muted.value })
  }
}

watch(volume, (v) => {
  if (useEmbed.value) {
    postMsg('setVolume', { volume: v })
  }
})
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
      <!-- iframe always loads but stays hidden-paused until user clicks play -->
      <iframe
        v-if="streamUrl && useEmbed"
        ref="iframeRef"
        :src="embedUrl"
        class="player-iframe"
        :class="{ paused: !playing }"
        allowfullscreen
        allow="autoplay; encrypted-media; fullscreen"
      />
      <img
        v-else-if="streamUrl"
        :src="streamUrl"
        class="player-stream"
        :class="{ paused: !playing }"
        alt="Live stream"
      />
      <div v-else-if="loading" class="player-overlay-content">
        <div class="spinner" />
        <span class="overlay-text">Ładowanie strumienia...</span>
      </div>
      <div v-else class="player-overlay-content">
        <span class="overlay-text">Brak strumienia</span>
      </div>

      <!-- Play overlay — shown when player is loaded but paused -->
      <div v-if="streamUrl && !playing" class="play-overlay" @click="togglePlay">
        <PlayIcon class="big-icon" />
        <span class="overlay-text">Naciśnij play, aby odtworzyć</span>
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
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.live-topbar .ctrl-btn {
  color: #fff;
}

.player-controls .ctrl-btn {
  color: var(--text-main);
  border-color: var(--border-subtle);
}

.ctrl-btn--small { width: 32px; height: 32px; }

.live-topbar .ctrl-btn:hover {
  background: rgba(255,255,255,0.15);
}

.player-controls .ctrl-btn:hover {
  background: var(--bg-card-hover, var(--bg-card));
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

.player-stream { width: 100%; height: 100%; object-fit: contain; }
.player-iframe { width: 100%; height: 100%; border: none; }
.player-iframe.paused { pointer-events: none; }
.player-stream.paused { filter: brightness(0.4); }

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  z-index: 10;
  transition: background 0.25s;
}

.play-overlay:hover {
  background: rgba(0,0,0,0.25);
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
