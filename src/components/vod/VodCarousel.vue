<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import VodCard from '@/components/vod/VodCard.vue'
import ApiErrorBanner from '@/components/ui/ApiErrorBanner.vue'
import { fetchVod, useApiError } from '@/composables/useEpgApi'
import type { VodItem } from '@/types'

const items = ref<VodItem[]>([])
const { apiError, showError } = useApiError()
const showFilter = ref(false)
const searchTerm = ref('')

onMounted(async () => {
  items.value = await fetchVod()
})

const filteredItems = computed(() => {
  if (!searchTerm.value.trim()) return items.value
  const q = searchTerm.value.toLowerCase()
  return items.value.filter(v => v.title.toLowerCase().includes(q))
})

function toggleFilter() { showFilter.value = !showFilter.value }
</script>

<template>
  <section class="vod-carousel">
    <ApiErrorBanner :visible="apiError" @close="showError" />

    <SectionHeader title="BIBLIOTEKA VOD: NOWE I POLECANE">
      <template #actions>
        <div class="dropdown-wrapper">
          <button class="btn" :class="{ active: showFilter }" @click="toggleFilter">Filtry</button>
          <div v-if="showFilter" class="dropdown-panel" @click.stop>
            <input v-model="searchTerm" class="filter-input" placeholder="Szukaj w VOD..." />
          </div>
        </div>
        <button class="btn" @click="$router.push('/vod')">Więcej</button>
      </template>
    </SectionHeader>
    <div class="carousel-track">
      <VodCard v-for="item in filteredItems" :key="item.id" :item="item" />
    </div>
  </section>
</template>

<style scoped>
.vod-carousel { padding: 24px 0; }
.carousel-track { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-behavior: smooth; scrollbar-width: thin; }
.carousel-track::-webkit-scrollbar { height: 4px; }
.btn { padding: 6px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; transition: filter 0.2s; }
.btn:hover, .btn.active { filter: brightness(1.1); }
.dropdown-wrapper { position: relative; }
.dropdown-panel { position: absolute; top: calc(100% + 4px); right: 0; min-width: 220px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.filter-input { width: 100%; padding: 8px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); font-family: var(--font-family); font-size: 13px; outline: none; }
.filter-input:focus { border-color: var(--border-focus); }
.filter-input::placeholder { color: var(--text-muted); }
</style>
