const KEY = 'ivod_watch_history'

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function write(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

export function recordWatch(id: string) {
  const ids = read()
  if (!ids.includes(id)) {
    ids.push(id)
    write(ids)
  }
}

export function getWatchCount(): number {
  return read().length
}
