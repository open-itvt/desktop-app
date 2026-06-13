<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CheckBadgeIcon, HeartIcon, PlayCircleIcon, BookmarkIcon,
  PencilSquareIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import VodCard from '@/components/vod/VodCard.vue'
import { CHANNELS } from '@/composables/useMockData'
import { fetchChannelVideos } from '@/composables/useOdysee'
import { useProfile } from '@/composables/useProfile'
import { getWatchCount } from '@/composables/useWatchHistory'
import type { VodItem } from '@/types'

const { profile, save: saveProfile } = useProfile()

const BKS_KEY = 'ivod_bookmarks'

const editMode = ref(false)
const editNickname = ref('')
const editInitial = ref('')

const bookmarkedVods = ref<VodItem[]>([])
const watchCount = ref(0)
const favCount = ref(0)

onMounted(() => {
  loadBookmarks()
  loadHistory()
  window.addEventListener('bookmark-changed', loadBookmarks)
})

function openEdit() {
  editNickname.value = profile.nickname
  editInitial.value = profile.initial
  editMode.value = true
}

function closeEdit() { editMode.value = false }

function confirmEdit() {
  if (editNickname.value.trim()) {
    saveProfile(editNickname.value.trim(), editInitial.value.trim())
  }
  editMode.value = false
}

async function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BKS_KEY)
    if (!raw) return
    const ids: number[] = JSON.parse(raw)
    favCount.value = ids.length

    const all = await fetchChannelVideos()
    bookmarkedVods.value = all.filter(v => ids.includes(v.id))
  } catch { /* ignore */ }
}

function loadHistory() {
  watchCount.value = getWatchCount()
}

const recentChannels = computed(() => CHANNELS.slice(0, 3))
</script>

<template>
  <div class="profile">
    <SectionHeader title="MÓJ PROFIL">
      <template #actions>
        <button class="btn" @click="openEdit">
          <PencilSquareIcon class="btn-icon" />
          Edytuj
        </button>
      </template>
    </SectionHeader>

    <div class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar-large">{{ profile.initial }}</div>
          <span class="avatar-badge">
            <CheckBadgeIcon class="badge-icon" />
          </span>
        </div>
        <h2 class="display-name">{{ profile.nickname }}</h2>
        <div class="stats-row">
          <div class="stat">
            <PlayCircleIcon class="stat-icon" />
            <span class="stat-value">{{ watchCount }}</span>
            <span class="stat-label">Obejrzane</span>
          </div>
          <div class="stat">
            <HeartIcon class="stat-icon" />
            <span class="stat-value">{{ favCount }}</span>
            <span class="stat-label">Zapisane</span>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="section-title">Zapisane VOD</h3>
        <div v-if="bookmarkedVods.length === 0" class="empty-state">
          <BookmarkIcon class="empty-icon" />
          <span class="empty-text">Brak zapisanych filmów</span>
        </div>
        <div v-else class="saved-grid">
          <VodCard v-for="item in bookmarkedVods" :key="item.id" :item="item" compact />
        </div>
      </div>

      <div class="profile-section">
        <h3 class="section-title">Ulubione kanały</h3>
        <div class="channels-row">
          <div v-for="ch in recentChannels" :key="ch" class="channel-chip">
            <BookmarkIcon class="chip-icon" />
            <span>{{ ch }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editMode" class="modal-overlay" @click.self="closeEdit">
          <div class="modal-card">
            <div class="modal-header">
              <h2 class="modal-title">Edytuj profil</h2>
              <button class="modal-close" @click="closeEdit">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="modal-body">
              <label class="field">
                <span class="field-label">Nazwa</span>
                <input v-model="editNickname" class="field-input" placeholder="Twoja nazwa" />
              </label>
              <label class="field">
                <span class="field-label">Inicjał (awatar)</span>
                <input v-model="editInitial" class="field-input" maxlength="2" placeholder="A" />
              </label>
              <button class="save-btn" @click="confirmEdit">Zapisz</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.profile { padding: 24px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 720px; }

.btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
}

.btn:hover { filter: brightness(1.1); }
.btn-icon { width: 16px; height: 16px; }

.profile-content { display: flex; flex-direction: column; gap: 20px; }

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-section { position: relative; margin-bottom: 4px; }

.avatar-large {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--accent-red);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.avatar-badge {
  position: absolute; bottom: 0; right: -2px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--bg-card);
  display: flex; align-items: center; justify-content: center;
}

.badge-icon { width: 18px; height: 18px; color: #3b82f6; }

.display-name { font-size: 20px; font-weight: 700; color: var(--text-main); }

.stats-row {
  display: flex; gap: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  width: 100%;
  justify-content: center;
}

.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }

.stat-icon { width: 22px; height: 22px; color: var(--accent-red); margin-bottom: 2px; }
.stat-value { font-size: 20px; font-weight: 700; color: var(--text-main); }
.stat-label { font-size: 12px; color: var(--text-muted); }

.profile-section {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 15px; font-weight: 600; color: var(--text-main);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 24px; color: var(--text-dark);
}

.empty-icon { width: 32px; height: 32px; }
.empty-text { font-size: 13px; }

.saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.channels-row { display: flex; flex-wrap: wrap; gap: 8px; }

.channel-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  font-size: 13px; font-weight: 500; color: var(--text-main);
  cursor: pointer; transition: filter 0.2s;
}

.channel-chip:hover { filter: brightness(1.1); }
.chip-icon { width: 14px; height: 14px; color: var(--accent-red); }

/* Edit modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; padding-top: 80px;
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 90%; max-width: 400px;
  padding: 24px;
  height: fit-content;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title { font-size: 20px; font-weight: 700; color: var(--text-main); }

.modal-close {
  width: 32px; height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: filter 0.2s;
}

.modal-close:hover { filter: brightness(1.1); }
.close-icon { width: 18px; height: 18px; }

.modal-body { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

.field-input {
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-family);
  font-size: 14px;
  outline: none;
}

.field-input:focus { border-color: var(--border-focus); }

.save-btn {
  padding: 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent-red);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s;
}

.save-btn:hover { filter: brightness(0.85); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
