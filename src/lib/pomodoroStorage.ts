const SETTINGS_KEY = 'tiny-tools:pomodoroSettings'
const SESSIONS_KEY = 'tiny-tools:sessions'

export interface PomodoroSettings {
  workMins: number
  breakMins: number
}

export interface Session {
  todoId: string
  seconds: number
  date: string  // "YYYY-MM-DD"
}

const DEFAULTS: PomodoroSettings = { workMins: 25, breakMins: 5 }

// ── Settings ───────────────────────────────────────────────────────────────────

export function getPomodoroSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch { return DEFAULTS }
}

export function savePomodoroSettings(s: PomodoroSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

// ── Sessions ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function readSessions(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getAllSessions(): Session[] {
  return readSessions()
}

export function addTimeSpent(todoId: string, seconds: number): void {
  if (seconds <= 0) return
  const sessions = readSessions()
  sessions.push({ todoId, seconds, date: todayStr() })
  writeSessions(sessions)
}

export function getTimeSpentForTodo(id: string): number {
  return readSessions()
    .filter(s => s.todoId === id)
    .reduce((sum, s) => sum + s.seconds, 0)
}

export function pruneTimeSpent(activeTodoIds: string[]): void {
  const active = new Set(activeTodoIds)
  writeSessions(readSessions().filter(s => active.has(s.todoId)))
}
