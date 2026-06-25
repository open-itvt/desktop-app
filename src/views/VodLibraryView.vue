<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import VodCard from '@/components/vod/VodCard.vue'
import ApiErrorBanner from '@/components/ui/ApiErrorBanner.vue'
import { fetchVod, useApiError } from '@/composables/useEpgApi'
import type { VodItem } from '@/types'

const allItems = ref<VodItem[]>([])
const loading = ref(true)
const { apiError, showError } = useApiError()

const showFilters = ref(false)
const showSort = ref(false)
const activeSort = ref<'date' | 'title'>('date')
const searchTerm = ref('')

const items = computed(() => {
  let list = [...allItems.value]
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase()
    list = list.filter(v => v.title.toLowerCase().includes(q))
  }
  if (activeSort.value === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    list.sort((a, b) => b.releaseTime - a.releaseTime)
  }
  return list
})

onMounted(async () => {
  allItems.value = await fetchVod()
  loading.value = false
})

function toggleFilters() { showFilters.value = !showFilters.value; showSort.value = false }
function toggleSort() { showSort.value = !showSort.value; showFilters.value = false }
function setSort(s: 'date' | 'title') { activeSort.value = s; showSort.value = false }
</script>

<template>
  <div class="vod-library">
    <ApiErrorBanner :visible="apiError" @close="showError" />

    <SectionHeader title="BIBLIOTEKA VOD">
      <template #actions>
        <div class="btn-group">
          <div class="dropdown-wrapper">
            <button class="btn" :class="{ active: showFilters }" @click="toggleFilters">Filtry</button>
            <div v-if="showFilters" class="dropdown-panel" @click.stop>
              <div class="dropdown-item"><input v-model="searchTerm" class="dropdown-input" placeholder="Szukaj w VOD..." /></div>
              <div class="dropdown-label">Wpisz fragment tytułu</div>
            </div>
          </div>
          <div class="dropdown-wrapper">
            <button class="btn" :class="{ active: showSort }" @click="toggleSort">Sortuj</button>
            <div v-if="showSort" class="dropdown-panel right" @click.stop>
              <div class="dropdown-option" :class="{ checked: activeSort === 'date' }" @click="setSort('date')">Data (najnowsze)</div>
              <div class="dropdown-option" :class="{ checked: activeSort === 'title' }" @click="setSort('title')">Tytuł (A-Z)</div>
            </div>
          </div>
        </div>
      </template>
    </SectionHeader>

    <div v-if="loading" class="loading-state"><span class="loading-text">Ładowanie biblioteki VOD...</span></div>
    <div v-else-if="items.length === 0" class="loading-state"><span class="loading-text">Brak wyników</span></div>
    <div v-else class="vod-grid">
      <VodCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </div>
</template>

<style scoped>
.vod-library { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.vod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.loading-state { display: flex; align-items: center; justify-content: center; padding: 48px; }
.loading-text { font-size: 14px; color: var(--text-muted); }
.btn-group { display: flex; gap: 8px; position: relative; }
.dropdown-wrapper { position: relative; }
.btn { padding: 6px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; transition: filter 0.2s; }
.btn:hover, .btn.active { filter: brightness(1.1); }
.dropdown-panel { position: absolute; top: calc(100% + 4px); right: 0; min-width: 200px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.dropdown-panel.right { right: 0; left: auto; }
.dropdown-input { width: 100%; padding: 8px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); font-family: var(--font-family); font-size: 13px; outline: none; }
.dropdown-input:focus { border-color: var(--border-focus); }
.dropdown-input::placeholder { color: var(--text-muted); }
.dropdown-label { font-size: 11px; color: var(--text-dark); padding: 6px 4px 2px; }
.dropdown-option { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--text-main); transition: filter 0.2s; }
.dropdown-option:hover { filter: brightness(1.1); }
.dropdown-option.checked { color: var(--accent-red); font-weight: 600; }
</style>
