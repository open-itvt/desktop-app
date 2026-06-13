<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon, ClipboardIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useErrorCapture } from '@/composables/useErrorCapture'
import type { LogEntry } from '@/composables/useErrorCapture'

const emit = defineEmits<{ close: [] }>()
const { logs, clear } = useErrorCapture()
const selected = ref<LogEntry | null>(null)

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function viewDetails(entry: LogEntry) {
  selected.value = selected.value?.id === entry.id ? null : entry
}

function formatProps(entry: LogEntry): string {
  return entry.props.map(a => {
    if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack || ''}`
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2) } catch { return String(a) }
    }
    return String(a)
  }).join('\n\n')
}
</script>

<template>
  <div class="debug-overlay" @click.self="emit('close')">
    <div class="debug-panel">
      <div class="debug-header">
        <div class="debug-title">
          <ExclamationCircleIcon class="debug-icon" />
          <span>Debug — błędy i ostrzeżenia</span>
        </div>
        <div class="debug-actions">
          <button class="debug-btn" @click="clear">Wyczyść</button>
          <button class="debug-btn close-btn" @click="emit('close')">
            <XMarkIcon class="btn-icon" />
          </button>
        </div>
      </div>
      <div class="debug-body">
        <div v-if="logs.length === 0" class="debug-empty">
          <ExclamationTriangleIcon class="empty-icon" />
          <span>Brak błędów i ostrzeżeń</span>
        </div>
        <div v-else class="debug-list">
          <div
            v-for="entry in logs"
            :key="entry.id"
            class="debug-row"
            :class="[entry.type, { active: selected?.id === entry.id }]"
            @click="viewDetails(entry)"
          >
            <div class="row-top">
              <span class="row-badge" :class="entry.type">{{ entry.type === 'error' ? 'ERR' : 'WRN' }}</span>
              <span class="row-msg">{{ entry.message }}</span>
              <span class="row-time">{{ entry.timestamp }}</span>
            </div>
            <div v-if="selected?.id === entry.id" class="row-detail">
              <pre class="detail-text">{{ formatProps(entry) }}</pre>
              <button class="copy-btn" @click.stop="copyText(formatProps(entry))">
                <ClipboardIcon class="copy-icon" />
                Kopiuj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-overlay {
  position: fixed; inset: 0; z-index: 100000;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}

.debug-panel {
  width: 100%; max-width: 680px; max-height: 80vh;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}

.debug-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.debug-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 600; color: var(--text-main);
}

.debug-icon { width: 20px; height: 20px; color: var(--accent-red); }

.debug-actions { display: flex; gap: 6px; align-items: center; }

.debug-btn {
  padding: 5px 12px; border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); background: transparent;
  color: var(--text-muted); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: filter 0.2s;
}

.debug-btn:hover { filter: brightness(1.1); }

.close-btn { padding: 5px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
.btn-icon { width: 16px; height: 16px; }

.debug-body { flex: 1; overflow-y: auto; padding: 8px; }

.debug-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px; color: var(--text-dark);
}

.empty-icon { width: 32px; height: 32px; }

.debug-list { display: flex; flex-direction: column; gap: 4px; }

.debug-row {
  border-radius: var(--radius-sm); cursor: pointer;
  transition: background 0.15s;
}

.debug-row:hover { filter: brightness(1.1); }
.debug-row.error { border-left: 3px solid var(--accent-red); }
.debug-row.warning { border-left: 3px solid #f59e0b; }

.row-top {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
}

.row-badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.3px;
  padding: 2px 5px; border-radius: 3px; flex-shrink: 0;
}

.row-badge.error { background: var(--accent-red-muted); color: var(--accent-red); }
.row-badge.warning { background: #fef3c7; color: #92400e; }

.row-msg {
  flex: 1; font-size: 12px; color: var(--text-main);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.row-time { font-size: 11px; color: var(--text-dark); flex-shrink: 0; }

.row-detail {
  padding: 4px 10px 10px;
}

.detail-text {
  font-size: 11px; line-height: 1.5; color: var(--text-muted);
  background: var(--bg-main); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 8px;
  white-space: pre-wrap; word-break: break-all;
  max-height: 200px; overflow-y: auto; margin: 0;
}

.copy-btn {
  display: inline-flex; align-items: center; gap: 4px;
  margin-top: 6px; padding: 4px 10px;
  border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);
  background: transparent; color: var(--accent-red);
  font-size: 11px; font-weight: 500; cursor: pointer;
  transition: filter 0.2s;
}

.copy-btn:hover { filter: brightness(1.1); }
.copy-icon { width: 14px; height: 14px; }
</style>
