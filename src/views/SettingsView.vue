<script setup lang="ts">
import { ref, computed } from 'vue'
import { SunIcon, MoonIcon, PaintBrushIcon, BellIcon, GlobeAltIcon, ShieldCheckIcon, InformationCircleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { useTheme } from '@/composables/useTheme'
import { useChannel } from '@/composables/useChannel'

const { theme, toggle } = useTheme()
const { channel, set } = useChannel()

const notifications = ref(true)
const autoplay = ref(true)
const showPrivacy = ref(false)
const showRestartPrompt = ref(false)
const showClearPrompt = ref(false)
const versionLabel = computed(() => channel.value === 'debug' ? '2.0.1 (Debug)' : '2.0.1')
let pendingChannel: 'stable' | 'debug' | null = null

function switchChannel(ch: 'stable' | 'debug') {
  if (ch !== channel.value) {
    pendingChannel = ch
    showRestartPrompt.value = true
  }
}

function confirmChannel() {
  if (pendingChannel) {
    set(pendingChannel)
    showRestartPrompt.value = false
    pendingChannel = null
    window.location.reload()
  }
}

function cancelChannel() {
  showRestartPrompt.value = false
  pendingChannel = null
}

function clearCache() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch { /* ignore */ }
  // Clear cookies
  document.cookie.split(';').forEach(c => {
    document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  })
  // Clear Cache Storage API
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {})
  }
  showClearPrompt.value = false
  window.location.reload()
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
          <ArrowPathIcon class="group-icon" />
          <h3>Aktualizacje</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Kanał aktualizacji</span>
            <span class="setting-desc" v-if="channel === 'stable'">Tylko stabilne wersje (domyślny)</span>
            <span class="setting-desc" v-else>Debug — wersje przedpremierowe z oznaczeniem -debug</span>
          </div>
          <div class="channel-toggle">
            <button class="ch-btn" :class="{ active: channel === 'stable' }" @click="switchChannel('stable')">Stabilny</button>
            <button class="ch-btn" :class="{ active: channel === 'debug' }" @click="switchChannel('debug')">Debug</button>
          </div>
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
          <button class="text-btn" @click="showPrivacy = true">Przeczytaj</button>
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
          <span class="setting-value">{{ versionLabel }}</span>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-header">
          <InformationCircleIcon class="group-icon" />
          <h3>Pamięć podręczna</h3>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Wyczyść pamięć podręczną</span>
            <span class="setting-desc">Usuwa dane przechowywane lokalnie (ustawienia, zapisane filmy, cache miniaturek)</span>
          </div>
          <button class="text-btn clear-cache" @click="showClearPrompt = true">Wyczyść</button>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPrivacy" class="modal-overlay" @click.self="showPrivacy = false">
          <div class="modal-card privacy-card">
            <div class="modal-header">
              <h2 class="modal-title">Polityka prywatności</h2>
              <button class="modal-close" @click="showPrivacy = false">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="privacy-body">
              <h3>1. Administrator danych</h3>
              <p>Administratorem Twoich danych osobowych jest iTVT. Kontakt: kontakt@itvt.xyz.</p>

              <h3>2. Jakie dane zbieramy?</h3>
              <ul>
                <li>Dane konta: nazwa użytkownika i inicjał awatara (przechowywane lokalnie).</li>
                <li>Dane o aktywności: lista zapisanych filmów, historia oglądania, motyw.</li>
                <li>Dane techniczne: typ urządzenia, wersja aplikacji (przekazywane do API Odysee).</li>
              </ul>

              <h3>3. Pliki cookie</h3>
              <p>Nie używamy cookies śledzących. Używamy localStorage do ustawień i zapisanych filmów. Dane nie są wysyłane poza:</p>
              <ul>
                <li>api.lbry.tv (wyszukiwanie VOD)</li>
                <li>video-itv.itvt.xyz (strumieniowanie HLS)</li>
              </ul>

              <h3>4. Podstawa prawna</h3>
              <p>Dane lokalne służą wyłącznie do świadczenia usługi (art. 6 ust. 1 lit. b RODO). Bez profilowania i marketingu.</p>

              <h3>5. Twoje prawa</h3>
              <p>Masz prawo dostępu, sprostowania i usunięcia danych. Dane można wyczyścić przez usunięcie localStorage w narzędziach deweloperskich.</p>

              <h3>6. Kontakt</h3>
              <p>W sprawach prywatności: kontakt@itvt.xyz</p>

              <p class="privacy-footer">Ostatnia aktualizacja: czerwiec 2026</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Restart prompt -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRestartPrompt" class="modal-overlay" @click.self="cancelChannel">
          <div class="modal-card restart-card">
            <div class="modal-header">
              <h2 class="restart-title">Zmień kanał</h2>
              <button class="modal-close" @click="cancelChannel">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="restart-body">
              <p class="restart-text">Zmiana kanału na <strong>{{ pendingChannel === 'debug' ? 'Debug' : 'Stabilny' }}</strong> wymaga ponownego uruchomienia aplikacji. Kontynuować?</p>
              <div class="restart-actions">
                <button class="restart-btn cancel" @click="cancelChannel">Anuluj</button>
                <button class="restart-btn confirm" @click="confirmChannel">Uruchom ponownie</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Clear cache prompt -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showClearPrompt" class="modal-overlay" @click.self="showClearPrompt = false">
          <div class="modal-card restart-card">
            <div class="modal-header">
              <h2 class="restart-title">Wyczyść pamięć podręczną</h2>
              <button class="modal-close" @click="showClearPrompt = false">
                <XMarkIcon class="close-icon" />
              </button>
            </div>
            <div class="restart-body">
              <p class="restart-text">Usunięte zostaną wszystkie dane lokalne: ustawienia, nick, zapisane filmy, cache miniaturek. Aplikacja uruchomi się ponownie. Kontynuować?</p>
              <div class="restart-actions">
                <button class="restart-btn cancel" @click="showClearPrompt = false">Anuluj</button>
                <button class="restart-btn confirm" @click="clearCache">Wyczyść i uruchom ponownie</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.settings { padding: 24px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 720px; }
.settings-sections { display: flex; flex-direction: column; gap: 20px; }
.settings-group { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 4px; }
.group-header { display: flex; align-items: center; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 8px; }
.group-icon { width: 20px; height: 20px; color: var(--accent-red); }
.group-header h3 { font-size: 15px; font-weight: 600; color: var(--text-main); }
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; gap: 16px; }
.setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); }
.setting-desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
.setting-value { font-size: 14px; font-weight: 500; color: var(--text-dark); flex-shrink: 0; }
.text-btn { padding: 8px 16px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: transparent; color: var(--accent-red); font-size: 13px; font-weight: 500; cursor: pointer; transition: filter 0.2s; flex-shrink: 0; }
.text-btn:hover { filter: brightness(1.1); }
.switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: var(--border-subtle); border-radius: 22px; transition: background 0.2s; }
.slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: var(--text-main); border-radius: 50%; transition: transform 0.2s; }
.switch input:checked + .slider { background: var(--accent-red); }
.switch input:checked + .slider::before { transform: translateX(18px); background: #fff; }
.theme-toggle { cursor: pointer; flex-shrink: 0; }
.toggle-track { position: relative; width: 56px; height: 28px; border-radius: 14px; background: var(--bg-main); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 6px; }
.toggle-icon { width: 16px; height: 16px; z-index: 1; transition: color 0.2s; }
.toggle-icon.sun { color: var(--text-dark); }
.theme-toggle.light .toggle-icon.sun { color: #f59e0b; }
.toggle-icon.moon { color: #6366f1; }
.theme-toggle.light .toggle-icon.moon { color: var(--text-dark); }
.toggle-thumb { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: var(--accent-red); top: 2px; left: 2px; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.toggle-thumb.right { transform: translateX(28px); }

.channel-toggle { display:flex; gap:4px; flex-shrink:0; }
.ch-btn { padding:6px 14px; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); background:transparent; color:var(--text-muted); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; }
.ch-btn.active { background:var(--accent-red); border-color:var(--accent-red); color:#fff; }
.ch-btn:hover:not(.active) { filter:brightness(1.1); }
.modal-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: flex-start; padding: 60px 16px; overflow-y: auto; }
.privacy-card { max-width: 600px; width: 100%; }
.privacy-card .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.privacy-card .modal-title { font-size: 20px; font-weight: 700; color: var(--accent-red); }
.privacy-card .modal-close { width: 32px; height: 32px; border: 1px solid var(--border-subtle); border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.privacy-card .modal-close:hover { filter: brightness(1.1); }
.close-icon { width: 18px; height: 18px; }
.privacy-body { font-size: 13px; line-height: 1.6; color: var(--text-main); max-height: 60vh; overflow-y: auto; padding-right: 4px; background: var(--bg-card); border-radius: var(--radius-sm); padding: 12px; }
.privacy-body h3 { font-size: 14px; font-weight: 700; margin: 16px 0 6px; color: var(--accent-red); }
.privacy-body p, .privacy-body ul, .privacy-body li { margin: 4px 0; color: var(--text-muted); }
.privacy-body ul { padding-left: 20px; }
.privacy-body code { font-size: 12px; background: var(--bg-main); padding: 1px 6px; border-radius: 3px; color: var(--accent-red); }
.privacy-footer { margin-top: 16px; font-size: 11px; color: var(--text-dark); text-align: center; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* Restart modal */
.restart-card { max-width: 400px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; }
.restart-card .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.restart-title { font-size: 20px; font-weight: 700; color: var(--accent-red); }
.restart-body { display: flex; flex-direction: column; gap: 16px; }
.restart-text { font-size: 14px; color: var(--text-main); line-height: 1.5; }
.restart-actions { display: flex; gap: 8px; }
.restart-btn { flex: 1; padding: 10px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; transition: filter 0.2s; }
.restart-btn.cancel { border: 1px solid var(--border-subtle); background: transparent; color: var(--text-muted); }
.restart-btn.confirm { border: 1px solid var(--accent-red); background: var(--accent-red); color: #fff; }
.restart-btn:hover { filter: brightness(1.1); }
</style>
