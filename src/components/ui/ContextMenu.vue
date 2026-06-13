<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const visible = ref(false)
const x = ref(0)
const y = ref(0)

interface MenuItem {
  label: string
  action: () => void
}

const items: MenuItem[] = [
  { label: 'Wstecz', action: () => router.back() },
  { label: 'Odśwież', action: () => window.location.reload() },
  { label: 'Zrzut ekranu', action: takeScreenshot },
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  x.value = e.clientX
  y.value = e.clientY
  visible.value = true
}

function onClickOutside() {
  visible.value = false
}

function exec(item: MenuItem) {
  visible.value = false
  item.action()
}

async function takeScreenshot() {
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(document.body, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `itvt-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  } catch (e) {
    console.error('Screenshot failed:', e)
  }
}

onMounted(() => {
  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ctx">
      <div v-if="visible">
        <div class="ctx-backdrop" @click="onClickOutside" />
        <div class="ctx-menu" :style="{ left: x + 'px', top: y + 'px' }">
          <div
            v-for="(item, i) in items"
            :key="i"
            class="ctx-item"
            @click="exec(item)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: transparent;
}

.ctx-menu {
  position: fixed;
  z-index: 100000;
  min-width: 170px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 4px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  overflow: hidden;
}

.ctx-item {
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  user-select: none;
}

.ctx-item:hover {
  background: var(--accent-red);
  color: #fff;
}

.ctx-enter-active { transition: opacity 0.15s ease, transform 0.12s ease; }
.ctx-leave-active { transition: opacity 0.1s ease; }
.ctx-enter-from { opacity: 0; transform: scale(0.95); }
.ctx-leave-to { opacity: 0; }
</style>
