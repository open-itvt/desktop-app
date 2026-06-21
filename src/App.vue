<script setup lang="ts">
import { onMounted } from 'vue'
import { useChannel } from '@/composables/useChannel'

const { channel } = useChannel()

const remoteBase = channel.value === 'debug'
  ? 'https://desktop-app-debug.itvt.xyz'
  : 'https://desktop-app.itvt.xyz'

onMounted(async () => {
  // Get proxy port — with timeout to prevent hanging
  let proxyPort = ''
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const result = await Promise.race([
      invoke<number>('get_proxy_port'),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ])
    if (result && result > 0) proxyPort = String(result)
  } catch {
    const p = new URLSearchParams(window.location.search).get('proxy')
    if (p) proxyPort = p
  }

  // Navigate to remote app only if on local/embedded page
  const host = window.location.hostname
  if (host.includes('desktop-app') || host.includes('itvt.xyz')) {
    // Already on remote page — let the remote app handle itself
    return
  }

  // On embedded page — navigate to the remote URL
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
