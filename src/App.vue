<script setup lang="ts">
import { onMounted } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { useDeepLink } from '@/composables/useDeepLink'
import { useConnectivity } from '@/composables/useConnectivity'

useTheme()
useDeepLink()
useConnectivity()

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
  <div class="app-layout">
    <TopBar class="app-topbar" />
    <Sidebar class="app-sidebar" />
    <main class="app-main">
      <router-view />
    </main>
    <ContextMenu />
  </div>
</template>

<style scoped>
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
