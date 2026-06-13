<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LiveBadge from '@/components/ui/LiveBadge.vue'
import type { Channel } from '@/types'
import { CHANNEL_HLS } from '@/composables/useMockData'
import type { ChannelName } from '@/composables/useMockData'
import { captureSnapshot, isLinux } from '@/composables/useBackend'
import { recordWatch } from '@/composables/useWatchHistory'

const props = defineProps<{
  channel: Channel
}>()

const router = useRouter()
const snapshotUrl = ref('')
const loading = ref(true)
const offline = ref(false)
const needsClick = ref(false)

onMounted(() => loadSnapshot())

watch(() => props.channel.name, () => loadSnapshot())

async function loadSnapshot() {
  loading.value = true
  offline.value = false
  needsClick.value = false
  snapshotUrl.value = ''

  const hlsUrl = CHANNEL_HLS[props.channel.name as ChannelName]
  if (!hlsUrl) {
    offline.value = true
    loading.value = false
    return
  }

  // On non-Linux, snapshot isn't available; show click-to-play instead of offline
  if (!isLinux()) {
    needsClick.value = true
    loading.value = false
    return
  }

  try {
    const dataUrl = await captureSnapshot(hlsUrl)
    snapshotUrl.value = dataUrl
  } catch {
    offline.value = true
  }
  loading.value = false
}

function openPlayer() {
  recordWatch(`live:${props.channel.name}`)
  router.push(`/live/${encodeURIComponent(props.channel.name)}`)
}
</script>

<template>
  <div class="live-player">
    <div class="player-container" :class="{ offline, clickable: needsClick }">
      <img
        v-if="snapshotUrl"
        :src="snapshotUrl"
        class="player-stream"
        alt="Live stream"
        @click="openPlayer"
      />
      <div v-else-if="offline" class="player-placeholder offline">
        <div class="placeholder-content">
          <div class="channel-brand">
            <span class="channel-logo">{{ channel.name.charAt(0) }}</span>
            <span class="channel-name">{{ channel.name }}</span>
          </div>
          <span class="offline-text">Transmisja offline</span>
        </div>
      </div>
      <div v-else-if="needsClick" class="player-placeholder clickable">
        <div class="placeholder-content">
          <div class="channel-brand">
            <span class="channel-logo">{{ channel.name.charAt(0) }}</span>
            <span class="channel-name">{{ channel.name }}</span>
          </div>
          <span class="click-text">Kliknij by włączyć transmisję</span>
        </div>
      </div>
      <div v-else class="player-placeholder">
        <div class="placeholder-content">
          <div class="channel-brand">
            <span class="channel-logo">{{ channel.name.charAt(0) }}</span>
            <span class="channel-name">{{ channel.name }}</span>
          </div>
          <span v-if="loading" class="loading-text">Ładowanie...</span>
        </div>
      </div>
      <div class="player-overlay" @click="openPlayer" />
    </div>
    <div class="player-info">
      <div class="info-top">
        <LiveBadge />
        <span class="channel-label">{{ channel.name }}</span>
      </div>
      <div class="info-middle">
        <span class="program-title">{{ channel.currentProgram }}</span>
        <span class="time-range">{{ channel.timeRange }}</span>
      </div>
      <button class="watch-btn" @click="openPlayer">OGLĄDAJ NA ŻYWO</button>
    </div>
  </div>
</template>

<style scoped>
.live-player { display: flex; flex-direction: column; gap: 10px; }

.player-container {
  position: relative;
  width: 100%;
  max-height: 220px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border-subtle);
}

.player-container.offline {
  background: #0a0a0a;
  border-color: var(--accent-red-muted);
}

.player-stream { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }

.player-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a0a0f 50%, #0a0a0f 100%);
}

.player-placeholder.offline {
  background: #050505;
}

.placeholder-content {
  text-align: center;
}

.channel-brand { display: flex; flex-direction: column; align-items: center; gap: 10px; }

.channel-logo {
  font-size: 32px; font-weight: 700; color: var(--accent-red);
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--accent-red-muted);
  border-radius: var(--radius-md);
}

.channel-name { font-size: 14px; color: var(--text-muted); font-weight: 500; }

.loading-text { font-size: 11px; color: var(--text-dark); margin-top: 4px; }

.offline-text {
  font-size: 12px;
  color: var(--accent-red);
  font-weight: 600;
  margin-top: 4px;
  opacity: 0.8;
}

.click-text {
  font-size: 12px;
  color: var(--accent-red);
  font-weight: 600;
}

.player-container.clickable {
  cursor: pointer;
  border-color: var(--accent-red-muted);
}

.player-container.clickable:hover {
  border-color: var(--accent-red);
}

.player-overlay { position: absolute; inset: 0; cursor: pointer; }

.player-info {
  display: flex; flex-direction: column; gap: 4px; text-align: center;
}

.info-top { display: flex; align-items: center; justify-content: center; gap: 8px; }
.channel-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }

.info-middle { display: flex; flex-direction: column; gap: 1px; }
.program-title { font-size: 16px; font-weight: 700; color: var(--text-main); }
.time-range { font-size: 11px; color: var(--text-dark); }

.watch-btn {
  align-self: center;
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent-red);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: filter 0.2s;
}

.watch-btn:hover { filter: brightness(0.85); }
</style>
