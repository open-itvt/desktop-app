import { ref } from 'vue'

export interface LogEntry {
  id: number
  type: 'error' | 'warning'
  message: string
  stack?: string
  timestamp: string
  props: any[]
}

const logs = ref<LogEntry[]>([])
let idCounter = 0
let origError: typeof console.error
let origWarn: typeof console.warn
let origOnError: OnErrorEventHandler | null = null

function add(type: 'error' | 'warning', args: any[]) {
  const message = args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')
  const stack = args.find(a => a instanceof Error)?.stack
  logs.value.push({
    id: ++idCounter,
    type,
    message,
    stack,
    timestamp: new Date().toLocaleTimeString(),
    props: args,
  })
  if (logs.value.length > 100) logs.value.shift()
}

function safeStringify(obj: any): string {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

export function useErrorCapture() {
  function start() {
    origError = console.error
    origWarn = console.warn
    origOnError = window.onerror

    console.error = (...args: any[]) => {
      add('error', args)
      origError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      add('warning', args)
      origWarn.apply(console, args)
    }

    window.onerror = (_msg, _source, _lineno, _colno, error) => {
      add('error', error ? [error.message] : [_msg])
      if (origOnError) return origOnError.call(window, _msg, _source, _lineno, _colno, error)
      return false
    }
  }

  function stop() {
    console.error = origError
    console.warn = origWarn
    window.onerror = origOnError
  }

  function clear() {
    logs.value = []
    idCounter = 0
  }

  return { logs, start, stop, clear }
}
