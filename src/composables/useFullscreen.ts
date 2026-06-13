import { ref, onMounted, onUnmounted } from 'vue'

const isFullscreen = ref(false)

export function useFullscreen() {
  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      isFullscreen.value = true
    } else {
      document.exitFullscreen?.()
      isFullscreen.value = false
    }
  }

  function onFsChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggle()
      }
    })
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFsChange)
  })

  return { isFullscreen, toggle }
}
