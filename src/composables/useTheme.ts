import { ref, watch } from 'vue'

const STORAGE_KEY = 'itvt-theme'

type Theme = 'dark' | 'light'

const stored = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Theme | null
const prefersLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches

const theme = ref<Theme>(stored ?? (prefersLight ? 'light' : 'dark'))

function apply(t: Theme) {
  document.documentElement.classList.remove('theme-dark', 'theme-light')
  document.documentElement.classList.add(`theme-${t}`)
  localStorage.setItem(STORAGE_KEY, t)
}

apply(theme.value)

watch(theme, (t) => apply(t), { immediate: false })

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function set(t: Theme) {
    theme.value = t
  }

  return { theme, toggle, set }
}
