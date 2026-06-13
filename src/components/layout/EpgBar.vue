<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { EpgEntry } from '@/types'
import type { ChannelName } from '@/composables/useMockData'

defineProps<{
  entries: EpgEntry[]
  channel: ChannelName
}>()

const trackRef = ref<HTMLElement | null>(null)

function scrollLeft() {
  trackRef.value?.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  trackRef.value?.scrollBy({ left: 200, behavior: 'smooth' })
}

</script>

<template>
  <div class="epg-bar">
    <div class="epg-header">
      <h3 class="epg-title">{{ channel }}</h3>
      <div class="epg-actions">
        <button class="epg-btn" @click="$router.push('/schedule')">Zobacz więcej</button>
      </div>
      <div class="epg-nav">
        <button class="nav-btn" @click="scrollLeft">
          <ChevronLeftIcon class="nav-icon" />
        </button>
        <button class="nav-btn" @click="scrollRight">
          <ChevronRightIcon class="nav-icon" />
        </button>
      </div>
    </div>
    <div ref="trackRef" class="epg-track">
      <div
        v-for="(entry, index) in entries"
        :key="index"
        class="epg-item"
        :class="{ live: entry.isLive }"
        @click="$router.push('/')"
      >
        <div class="epg-item-top">
          <span class="epg-time">{{ entry.time }}</span>
          <span v-if="entry.isLive" class="epg-live-tag">LIVE</span>
        </div>
        <span class="epg-title">{{ entry.title }}</span>
        <div class="epg-progress" :class="{ active: entry.isLive }">
          <div class="epg-progress-fill" :class="{ active: entry.isLive }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.epg-bar {
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-subtle);
  padding: 16px 24px;
  position: sticky;
  bottom: 0;
}

.epg-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.epg-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.epg-actions {
  display: flex;
  gap: 8px;
}

.epg-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
}

.epg-btn:hover {
  filter: brightness(1.1);
}

.epg-nav {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: filter 0.2s, background 0.2s, border-color 0.2s;
}

.nav-btn:hover {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.epg-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.epg-track::-webkit-scrollbar {
  height: 3px;
}

.epg-item {
  flex: 0 0 180px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: filter 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.epg-item:hover {
  filter: brightness(1.1);
}

.epg-item.live {
  background: var(--accent-red-muted);
  border-color: var(--accent-red);
}

.epg-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.epg-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dark);
}

.epg-live-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-red);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.epg-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.epg-progress {
  width: 100%;
  height: 3px;
  background: var(--border-subtle);
  border-radius: 2px;
  overflow: hidden;
  opacity: 0;
}

.epg-progress.active {
  opacity: 1;
}

.epg-progress-fill {
  height: 100%;
  width: 0%;
  background: var(--accent-red);
  border-radius: 2px;
  transition: width 0.3s;
}

.epg-progress-fill.active {
  width: 45%;
}
</style>
