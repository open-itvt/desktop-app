<script setup lang="ts">
import type { ChannelName } from '@/composables/useMockData'

defineProps<{
  channel: ChannelName
}>()
</script>

<template>
  <div class="epg-bar">
    <div class="epg-header">
      <h3 class="epg-title">{{ channel }}</h3>
      <button class="epg-btn" @click="$router.push('/schedule')">Zobacz więcej</button>
    </div>
  </div>
</template>

<style scoped>
.epg-bar {
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-subtle);
  padding: 12px 24px;
  position: sticky;
  bottom: 0;
}

.epg-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.epg-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.epg-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
}

.epg-btn:hover {
  filter: brightness(1.1);
}
</style>
