import { reactive } from 'vue'

const PROFILE_KEY = 'ivod_profile'

interface Profile {
  nickname: string
  initial: string
}

const state = reactive<Profile>(load())

function load(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      return { nickname: d.nickname || 'Użytkownik', initial: d.initial || d.nickname?.charAt(0).toUpperCase() || 'U' }
    }
  } catch { /* ignore */ }
  return { nickname: 'Użytkownik', initial: 'U' }
}

function persist() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ nickname: state.nickname, initial: state.initial }))
  } catch { /* ignore */ }
}

export function useProfile() {
  function save(nickname: string, initial: string) {
    state.nickname = nickname.trim() || 'Użytkownik'
    state.initial = initial.trim() || state.nickname.charAt(0).toUpperCase()
    persist()
  }

  return { profile: state, save }
}
