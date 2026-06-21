<script setup lang="ts">
import { onMounted } from 'vue'
import { useChannel } from '@/composables/useChannel'

const { channel } = useChannel()

const remoteBase = channel.value === 'debug'
  ? 'https://desktop-app-debug.itvt.xyz'
  : 'https://desktop-app.itvt.xyz'

onMounted(async () => {
  // Hide splash
  const splash = document.getElementById('splash')
  if (splash) splash.classList.add('hidden')

  // Get proxy port
  let proxyPort = ''
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const port = await invoke<number>('get_proxy_port')
    if (port > 0) proxyPort = String(port)
  } catch {
    const p = new URLSearchParams(window.location.search).get('proxy')
    if (p) proxyPort = p
  }

  // Navigate to remote app — direct navigation, no iframe
  const target = proxyPort ? `${remoteBase}?proxy=${proxyPort}` : remoteBase
  window.location.href = target
})
</script>

<template>
  <div />
</template>

<style scoped>
/* Empty bridge component — navigation happens in onMounted */
</style>
