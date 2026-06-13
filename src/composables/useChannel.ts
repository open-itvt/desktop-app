import { ref, watch } from 'vue'

const CHANNEL_KEY = 'itvt_channel'
type Channel = 'stable' | 'debug'

function read(): Channel {
  try {
    const v = localStorage.getItem(CHANNEL_KEY)
    if (v === 'debug') return 'debug'
  } catch { /* ignore */ }
  return 'stable'
}

const channel = ref<Channel>(read())

watch(channel, (ch) => {
  try { localStorage.setItem(CHANNEL_KEY, ch) } catch { /* ignore */ }
})

export function useChannel() {
  function set(ch: Channel) {
    if (ch !== channel.value) {
      channel.value = ch
    }
  }

  function restart() {
    try {
      sessionStorage.setItem('itvt_return_path', window.location.hash || '/settings')
    } catch { /* ignore */ }
    window.location.reload()
  }

  return { channel, set, restart }
}
