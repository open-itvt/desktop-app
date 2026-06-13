<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useChannel } from '@/composables/useChannel'
import { useTheme } from '@/composables/useTheme'
import { useDeepLink } from '@/composables/useDeepLink'
import { useConnectivity } from '@/composables/useConnectivity'
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'

useTheme()
useDeepLink()
useConnectivity()

const { channel } = useChannel()

// If we are inside an iframe (remote page loaded by the Tauri wrapper),
// show the full app with TopBar + Sidebar + router-view.
// If we are top‑level (in the Tauri webview directly), show the iframe wrapper
// that loads the remote page.
const isInsideIframe = window.self !== window.top

const appUrl = computed(() => {
  const params = new URLSearchParams(window.location.search)
  const proxyPort = params.get('proxy') || ''
  const base = channel.value === 'debug'
    ? 'https://desktop-app-debug.itvt.xyz'
    : 'https://desktop-app.itvt.xyz'
  return proxyPort ? `${base}?proxy=${proxyPort}` : base
})

onMounted(() => {
  document.addEventListener('keydown', blockSelectAll)
  setTimeout(() => {
    const splash = document.getElementById('splash')
    if (splash) splash.classList.add('hidden')
  }, 300)
})

function blockSelectAll(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') e.preventDefault()
}
</script>

<template>
  <!-- Tauri wrapper (top‑level): load remote content in iframe -->
  <div v-if="!isInsideIframe" class="iframe-shell">
    <iframe :src="appUrl" class="app-iframe" allowfullscreen allow="autoplay; encrypted-media; fullscreen" />
    <ContextMenu />
  </div>

  <!-- Remote page (inside iframe): show the actual app -->
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
.iframe-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-main);
}
.app-iframe { width: 100%; height: 100%; border: none; }

.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-areas:
    "topbar topbar"
    "sidebar main";
  height: 100vh;
  overflow: hidden;
  background: var(--bg-main);
}
.app-topbar { grid-area: topbar; z-index: 100; }
.app-sidebar { grid-area: sidebar; z-index: 90; }
.app-main { grid-area: main; overflow-y: auto; overflow-x: hidden; }
</style>
