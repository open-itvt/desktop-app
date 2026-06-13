<script setup lang="ts">
import { onMounted } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { useDeepLink } from '@/composables/useDeepLink'
import { useConnectivity } from '@/composables/useConnectivity'
import { WifiIcon } from '@heroicons/vue/24/outline'

useTheme()
useDeepLink()
const { offline } = useConnectivity()

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

function reload() { window.location.reload() }
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

  <Teleport to="body">
    <Transition name="offline-fade">
      <div v-if="offline" class="offline-overlay">
        <div class="offline-content">
          <WifiIcon class="offline-icon" />
          <div class="offline-logo">iTVT</div>
          <div class="offline-msg">Błąd połączenia</div>
          <div class="offline-sub">z internetem / serwerem</div>
          <div class="offline-retry" @click="reload">
            Spróbuj ponownie
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

<style>
.offline-overlay {
  position: fixed;
  inset: 0;
  z-index: 500000;
  background: #09090b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.offline-icon {
  width: 40px;
  height: 40px;
  color: #a81414;
  opacity: 0.7;
  margin-bottom: 8px;
}

.offline-logo {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1px;
  color: #ffffff;
}

.offline-msg {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #a81414;
  margin-top: 8px;
}

.offline-sub {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #71717a;
}

.offline-retry {
  margin-top: 16px;
  padding: 10px 28px;
  border: 1px solid #a81414;
  border-radius: 8px;
  color: #a81414;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.offline-retry:hover {
  background: rgba(168, 20, 20, 0.15);
}

.offline-fade-enter-active,
.offline-fade-leave-active {
  transition: opacity 0.35s ease;
}

.offline-fade-enter-from,
.offline-fade-leave-to {
  opacity: 0;
}
</style>
