<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ChannelName } from '@/composables/useMockData'
import { fetchEpg, getUpcomingForChannel } from '@/composables/useEpgApi'

const props = defineProps<{
  channel: ChannelName
}>()

const upcoming = ref<{ time: string; title: string }[]>([])

onMounted(async () => {
  const epg = await fetchEpg()
  upcoming.value = getUpcomingForChannel(epg, props.channel, 4)
})
</script>

<template>
  <div class="epg-bar">
    <div class="epg-header">
      <h3 class="epg-title">{{ channel }}</h3>
      <button class="epg-btn" @click="$router.push('/schedule')">Program</button>
    </div>
    <div v-if="upcoming.length > 0" class="epg-track">
      <div v-for="(p, i) in upcoming" :key="i" class="epg-item">
        <span class="epg-item-time">{{ p.time }}</span>
        <span class="epg-item-title">{{ p.title }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.epg-bar {
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-subtle);
  padding: 10px 24px;
  position: sticky;
  bottom: 0;
}
.epg-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.epg-title { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.epg-btn { padding: 4px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font-size: 11px; font-weight: 500; cursor: pointer; transition: filter 0.2s; }
.epg-btn:hover { filter: brightness(1.1); }
.epg-track { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
.epg-track::-webkit-scrollbar { height: 3px; }
.epg-item { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: var(--radius-sm); background: var(--bg-card); border: 1px solid var(--border-subtle); cursor: pointer; transition: filter 0.2s; min-width: 120px; }
.epg-item:hover { filter: brightness(1.1); }
.epg-item-time { font-size: 11px; font-weight: 600; color: var(--accent-red); white-space: nowrap; }
.epg-item-title { font-size: 12px; font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
