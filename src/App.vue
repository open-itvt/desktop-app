<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { useConnectivity } from '@/composables/useConnectivity'
import { useChannel } from '@/composables/useChannel'

useTheme()
useConnectivity()
const { channel } = useChannel()

const iframeUrl = ref('')
const iframeLoaded = ref(false)
const iframeError = ref(false)

function getBaseUrl(): string {
  if (channel.value === 'debug') return 'https://desktop-app-debug.itvt.xyz'
  return 'https://desktop-app.itvt.xyz'
}

function getFullUrl(): string {
  const params = new URLSearchParams(window.location.search)
  const proxyPort = params.get('proxy') || ''
  const base = getBaseUrl()
  return proxyPort ? `${base}?proxy=${proxyPort}` : base
}

onMounted(() => {
  document.addEventListener('keydown', blockSelectAll)
  // Hide splash after a short delay
  setTimeout(() => {
    const splash = document.getElementById('splash')
    if (splash) splash.classList.add('hidden')
  }, 300)
  // Set iframe src
  iframeUrl.value = getFullUrl()
})

function onIframeLoad() {
  iframeLoaded.value = true
}

function onIframeError() {
  iframeError.value = true
}

function blockSelectAll(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') e.preventDefault()
}
</script>

<template>
  <div class="app-shell">
    <iframe
      v-if="iframeUrl"
      :src="iframeUrl"
      class="app-iframe"
      :class="{ hidden: iframeError }"
      allowfullscreen
      allow="autoplay; encrypted-media; fullscreen"
      @load="onIframeLoad"
      @error="onIframeError"
    />
    <div v-if="!iframeUrl || (!iframeLoaded && !iframeError)" class="shell-loading">
      <div class="spinner" />
    </div>
    <ContextMenu />
  </div>
</template>

<style scoped>
.app-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-main);
  position: relative;
}

.app-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.app-iframe.hidden {
  display: none;
}

.shell-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-main);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
