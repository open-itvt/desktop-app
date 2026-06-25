<script setup lang="ts">
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="banner">
    <div v-if="visible" class="api-error-banner">
      <ExclamationTriangleIcon class="banner-icon" />
      <span class="banner-text">Nie udało się pobrać najnowszych danych — używam danych offline</span>
      <button class="banner-close" @click="emit('close')">
        <XMarkIcon class="close-icon" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.api-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--accent-red);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 50;
}

.banner-icon { width: 16px; height: 16px; flex-shrink: 0; }
.banner-text { flex: 1; }
.banner-close {
  width: 24px; height: 24px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.banner-close:hover { background: rgba(255,255,255,0.35); }
.close-icon { width: 14px; height: 14px; }

.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
