<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="section-header">
    <h2 class="section-title">{{ title }}</h2>
    <div class="section-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.section-actions {
  display: flex;
  gap: 8px;
}

:slotted(.btn) {
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

:slotted(.btn:hover) {
  filter: brightness(1.1);
}
</style>
