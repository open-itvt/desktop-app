<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { useConnectivity } from '@/composables/useConnectivity'
import { useChannel } from '@/composables/useChannel'
import { useDeepLink } from '@/composables/useDeepLink'

useTheme()
useDeepLink()
useConnectivity()
const { channel } = useChannel()

const iframeUrl = ref('')
const remoteBase = channel.value === 'debug'
  ? 'https://desktop-app-debug.itvt.xyz'
  : 'https://desktop-app.itvt.xyz'

onMounted(async () => {
  document.addEventListener('keydown', blockSelectAll)

  setTimeout(() => {
    const splash = document.getElementById('splash')
    if (splash) splash.classList.add('hidden')
  }, 300)

  // Get proxy port — try IPC first, then URL param
  let proxyPort = ''
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const port = await invoke<number>('get_proxy_port')
    if (port > 0) proxyPort = String(port)
  } catch {
    const p = new URLSearchParams(window.location.search).get('proxy')
    if (p) proxyPort = p
  }

  // Build iframe URL with proxy port
  iframeUrl.value = proxyPort ? `${remoteBase}?proxy=${proxyPort}` : remoteBase
})

function blockSelectAll(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') e.preventDefault()
}
</script>

<template>
  <div class="iframe-shell">
    <iframe v-if="iframeUrl" :src="iframeUrl" class="app-iframe" allowfullscreen allow="autoplay; encrypted-media; fullscreen" />
    <div v-else class="shell-loading">
      <div class="spinner" />
    </div>
    <ContextMenu />
  </div>
</template>

<style scoped>
.iframe-shell { width: 100vw; height: 100vh; overflow: hidden; background: var(--bg-main); }
.app-iframe { width: 100%; height: 100%; border: none; }
.shell-loading { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-main); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border-subtle); border-top-color: var(--accent-red); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
