<script setup lang="ts">
import { ref, computed } from 'vue'
import LivePlayer from '@/components/live/LivePlayer.vue'
import VodCarousel from '@/components/vod/VodCarousel.vue'
import EpgBar from '@/components/layout/EpgBar.vue'
import {
  MOCK_CHANNEL_DATA,
  MOCK_UPCOMING,
  MOCK_EPG,
  CHANNELS,
} from '@/composables/useMockData'
import type { ChannelName } from '@/composables/useMockData'

const activeChannel = ref<ChannelName>('iTVT')
const currentChannel = computed(() => MOCK_CHANNEL_DATA[activeChannel.value])
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-nav">
      <div class="channel-tabs">
        <button
          v-for="ch in CHANNELS"
          :key="ch"
          class="channel-tab"
          :class="{ active: activeChannel === ch }"
          @click="activeChannel = ch"
        >
          {{ ch }}
        </button>
      </div>
    </div>

    <div class="dashboard-top">
      <div class="top-left">
        <LivePlayer :channel="currentChannel" />
      </div>
      <div class="top-right">
        <div class="upcoming-list">
          <div
            v-for="(item, index) in MOCK_UPCOMING[activeChannel]"
            :key="index"
            class="upcoming-card"
          >
            <div class="upcoming-thumb">
              <span class="upcoming-time">{{ item.time }}</span>
            </div>
            <span class="upcoming-title">{{ item.title }}</span>
          </div>
        </div>
      </div>
    </div>
    <VodCarousel />
    <EpgBar :entries="MOCK_EPG[activeChannel]" :channel="activeChannel" />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  gap: 12px;
  min-height: 100%;
}

.dashboard-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-tabs {
  display: flex;
  gap: 6px;
}

.channel-tab {
  padding: 6px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-tab.active {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.channel-tab:hover:not(.active) {
  filter: brightness(1.1);
}

.dashboard-top {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.top-right {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.btn-sm {
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
}

.btn-sm:hover {
  filter: brightness(1.1);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.upcoming-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: filter 0.2s;
}

.upcoming-card:hover {
  filter: brightness(1.1);
}

.upcoming-thumb {
  width: 56px;
  height: 36px;
  border-radius: 4px;
  background: var(--accent-red-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upcoming-time {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-red);
}

.upcoming-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
</style>
