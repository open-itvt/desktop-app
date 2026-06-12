<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()

const videoName = computed(() => route.params.videoName as string)
const claimId = computed(() => route.params.claimId as string)
const embedUrl = computed(() =>
  `https://odysee.com/$/embed/${videoName.value}/${claimId.value}`
)
</script>

<template>
  <div class="watch-view">
    <div class="watch-topbar">
      <button class="back-btn" @click="router.push('/vod')">
        <ArrowLeftIcon class="back-icon" />
      </button>
      <span class="watch-title">Odtwarzacz VOD</span>
    </div>

    <div class="player-wrap">
      <iframe
        :src="embedUrl"
        class="player-iframe"
        allowfullscreen
        allow="autoplay; encrypted-media; fullscreen"
      />
    </div>
  </div>
</template>

<style scoped>
.watch-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
}

.watch-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover { background: rgba(255,255,255,0.15); }

.back-icon { width: 20px; height: 20px; }

.watch-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.player-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.player-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
