<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlayIcon, BookmarkIcon, BookmarkSlashIcon, CalendarDaysIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { VodItem } from '@/types'
import { recordWatch } from '@/composables/useWatchHistory'

const props = defineProps<{
  item: VodItem
  compact?: boolean
}>()

const router = useRouter()
const BKS_KEY = 'ivod_bookmarks'

function isBookmarked(): boolean {
  try {
    const raw = localStorage.getItem(BKS_KEY)
    if (!raw) return false
    const ids: number[] = JSON.parse(raw)
    return ids.includes(props.item.id)
  } catch { return false }
}

const bookmarked = ref(isBookmarked())

function toggleBookmark() {
  try {
    const raw = localStorage.getItem(BKS_KEY)
    let ids: number[] = raw ? JSON.parse(raw) : []
    if (bookmarked.value) {
      ids = ids.filter(id => id !== props.item.id)
    } else {
      ids.push(props.item.id)
    }
    localStorage.setItem(BKS_KEY, JSON.stringify(ids))
    bookmarked.value = !bookmarked.value
    window.dispatchEvent(new CustomEvent('bookmark-changed'))
  } catch { /* ignore */ }
}

function openPlayer() {
  recordWatch(`vod:${props.item.id}`)
  router.push(`/watch/${encodeURIComponent(props.item.videoName)}/${encodeURIComponent(props.item.claimId)}`)
}
</script>

<template>
  <div class="vod-card">
    <div class="card-thumbnail" @click="openPlayer">
      <img
        v-if="item.thumbnailUrl"
        :src="item.thumbnailUrl"
        class="thumb-img"
        alt=""
        loading="lazy"
      />
      <div v-else class="thumb-placeholder">
        <span class="thumb-text">{{ item.title.charAt(0) }}</span>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ item.title }}</h3>
      <div class="card-meta">
        <span v-if="item.date" class="meta-item">
          <CalendarDaysIcon class="meta-icon" />
          {{ item.date }}
        </span>
        <span v-if="item.views" class="meta-item">
          <EyeIcon class="meta-icon" />
          {{ item.views }}
        </span>
      </div>
      <div class="card-actions" :class="{ compact }">
        <button class="action-btn primary" @click="openPlayer">
          <PlayIcon class="action-icon" />
          <span v-if="!compact">Odtwórz</span>
        </button>
        <button class="action-btn" :class="bookmarked ? 'saved' : 'secondary'" @click.stop="toggleBookmark">
          <BookmarkSlashIcon v-if="bookmarked" class="action-icon" />
          <BookmarkIcon v-else class="action-icon" />
          <span v-if="!compact">{{ bookmarked ? 'Zapisane' : 'Zapisz' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vod-card {
  flex: 0 0 220px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: filter 0.2s;
}

.vod-card:hover { filter: brightness(1.1); }

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
  cursor: pointer;
}

.thumb-img { width: 100%; height: 100%; object-fit: cover; }

.thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #161416 0%, #1c1c1f 100%);
}

.thumb-text { font-size: 28px; font-weight: 700; color: var(--accent-red); opacity: 0.4; }

.card-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }

.card-title {
  font-size: 14px; font-weight: 700; color: var(--text-main);
  line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.card-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.meta-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-muted); }
.meta-icon { width: 13px; height: 13px; }

.card-actions { display: flex; gap: 6px; margin-top: 2px; }

.card-actions.compact { gap: 4px; margin-top: 4px; }

.action-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 6px 10px; border: none; border-radius: var(--radius-sm);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: filter 0.2s;
}

.action-btn.primary { background: var(--accent-red); color: #fff; }
.action-btn.primary:hover { filter: brightness(0.85); }

.action-btn.secondary { background: transparent; border: 1px solid var(--border-subtle); color: var(--text-muted); }
.action-btn.secondary:hover { filter: brightness(1.1); }

.action-btn.saved { background: var(--accent-red-muted); border: 1px solid var(--accent-red); color: var(--accent-red); }
.action-btn.saved:hover { filter: brightness(1.1); }

.action-icon { width: 12px; height: 12px; }
</style>
