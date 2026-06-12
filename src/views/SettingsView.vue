<script setup lang="ts">
import { SunIcon, MoonIcon, PaintBrushIcon, BellIcon, GlobeAltIcon, ShieldCheckIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { useTheme } from '@/composables/useTheme'
import { ref } from 'vue'

const { theme, toggle } = useTheme()

const notifications = ref(true)
const autoplay = ref(true)

function openPrivacy() {
  window.open('https://vod.itvt.xyz/#prywatnosc', '_blank')
}
</script>

<template>
  <div class="settings">
    <SectionHeader title="USTAWIENIA" />

    <div class="settings-sections">
      <section class="settings-group">
        <div class="group-header">
          <PaintBrushIcon class="group-icon" />
          <h3>Wygląd</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Motyw</span>
            <span class="setting-desc">Przełącz między jasnym a ciemnym motywem</span>
          </div>
          <div class="theme-toggle" :class="{ light: theme === 'light' }" @click="toggle">
            <div class="toggle-track">
              <SunIcon class="toggle-icon sun" />
              <MoonIcon class="toggle-icon moon" />
              <div class="toggle-thumb" :class="{ right: theme === 'light' }" />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-header">
          <BellIcon class="group-icon" />
          <h3>Powiadomienia</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Powiadomienia push</span>
            <span class="setting-desc">Otrzymuj powiadomienia o nadchodzących programach</span>
          </div>
          <label class="switch">
            <input v-model="notifications" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Autoodtwarzanie</span>
            <span class="setting-desc">Automatycznie odtwarzaj kolejny program VOD</span>
          </div>
          <label class="switch">
            <input v-model="autoplay" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-header">
          <GlobeAltIcon class="group-icon" />
          <h3>Regionalne</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Język</span>
            <span class="setting-desc">Polski (domyślny)</span>
          </div>
          <span class="setting-value">Polski</span>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Strefa czasowa</span>
            <span class="setting-desc">Europa / Warszawa (CET)</span>
          </div>
          <span class="setting-value">UTC+1</span>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-header">
          <ShieldCheckIcon class="group-icon" />
          <h3>Prywatność i bezpieczeństwo</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Polityka prywatności</span>
            <span class="setting-desc">Dowiedz się, jak przetwarzamy Twoje dane</span>
          </div>
          <button class="text-btn" @click="openPrivacy">Przeglądaj</button>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-header">
          <InformationCircleIcon class="group-icon" />
          <h3>Informacje</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Wersja aplikacji</span>
          </div>
          <span class="setting-value">2.0.0 - preview</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-group {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 8px;
}

.group-icon {
  width: 20px;
  height: 20px;
  color: var(--accent-red);
}

.group-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  gap: 16px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.setting-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
  flex-shrink: 0;
}

.text-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent-red);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
  flex-shrink: 0;
}

.text-btn:hover {
  filter: brightness(1.1);
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border-subtle);
  border-radius: 22px;
  transition: background 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  bottom: 3px;
  background: var(--text-main);
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
}

.switch input:checked + .slider {
  background: var(--accent-red);
}

.switch input:checked + .slider::before {
  transform: translateX(18px);
  background: #fff;
}

.theme-toggle {
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-track {
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  z-index: 1;
  transition: color 0.2s;
}

.toggle-icon.sun {
  color: var(--text-dark);
}

.theme-toggle.light .toggle-icon.sun {
  color: #f59e0b;
}

.toggle-icon.moon {
  color: #6366f1;
}

.theme-toggle.light .toggle-icon.moon {
  color: var(--text-dark);
}

.toggle-thumb {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-red);
  top: 2px;
  left: 2px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.toggle-thumb.right {
  transform: translateX(28px);
}
</style>
