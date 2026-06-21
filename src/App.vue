<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { useDeepLink } from '@/composables/useDeepLink'
import { useConnectivity } from '@/composables/useConnectivity'
import { useChannel } from '@/composables/useChannel'

useTheme()
useDeepLink()
useConnectivity()
const { channel } = useChannel()

const isInsideIframe = window.self !== window.top
const isTauriApp = !isInsideIframe
const iframeUrl = ref('')
const useIframe = ref(false)

const remoteBase = channel.value === 'debug'
  ? 'https://desktop-app-debug.itvt.xyz'
  : 'https://desktop-app.itvt.xyz'

onMounted(async () => {
  document.addEventListener('keydown', blockSelectAll)

  setTimeout(() => {
    const splash = document.getElementById('splash')
    if (splash) splash.classList.add('hidden')
  }, 300)

  // If we are the Tauri top-level wrapper AND have IPC, use iframe for remote content
  if (isTauriApp) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const port = await invoke<number>('get_proxy_port')
      if (port > 0) {
        iframeUrl.value = `${remoteBase}?proxy=${port}`
        useIframe.value = true
        return
      }
    } catch {
      // IPC failed — check URL param
      const params = new URLSearchParams(window.location.search)
      const port = params.get('proxy')
      if (port) {
        iframeUrl.value = `${remoteBase}?proxy=${port}`
        useIframe.value = true
        return
      }
    }
    // No proxy — show app directly
    useIframe.value = false
  }
})

function blockSelectAll(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') e.preventDefault()
}
</script>

<template>
  <!-- Tauri top-level: iframe with remote content OR app directly -->
  <div v-if="useIframe" class="iframe-shell">
    <iframe :src="iframeUrl" class="app-iframe" allowfullscreen allow="autoplay; encrypted-media; fullscreen" />
    <ContextMenu />
  </div>

  <div v-else class="app-layout">
    <TopBar class="app-topbar" />
    <Sidebar class="app-sidebar" />
    <main class="app-main">
      <router-view />
    </main>
    <ContextMenu />
  </div>
</template>

<style scoped>
.iframe-shell { width: 100vw; height: 100vh; overflow: hidden; background: var(--bg-main); }
.app-iframe { width: 100%; height: 100%; border: none; }
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-areas: "topbar topbar" "sidebar main";
  height: 100vh; overflow: hidden; background: var(--bg-main);
}
.app-topbar { grid-area: topbar; z-index: 100; }
.app-sidebar { grid-area: sidebar; z-index: 90; }
.app-main { grid-area: main; overflow-y: auto; overflow-x: hidden; }
</style>
