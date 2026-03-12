import { Todo, Status } from './types'

const STORAGE_KEY      = 'tiny-tools:todos'
const TAGS_KEY         = 'tiny-tools:tags'
const TAG_COLORS_KEY   = 'tiny-tools:tagColors'
const RESET_KEY        = 'tiny-tools:lastReset'

// ── Global tags ────────────────────────────────────────────────────────────────

export function getGlobalTags(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TAGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveGlobalTags(tags: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
}

export function addGlobalTag(tag: string): void {
  const tags = getGlobalTags()
  if (!tags.includes(tag)) saveGlobalTags([...tags, tag])
}

export function renameGlobalTag(oldName: string, newName: string): void {
  if (typeof window === 'undefined' || !newName.trim() || oldName === newName) return
  saveGlobalTags(getGlobalTags().map(t => t === oldName ? newName : t))
  const colors = getTagColors()
  if (colors[oldName] !== undefined) {
    const { [oldName]: color, ...rest } = colors
    localStorage.setItem(TAG_COLORS_KEY, JSON.stringify({ ...rest, [newName]: color }))
  }
}

export function deleteGlobalTag(tag: string): void {
  if (typeof window === 'undefined') return
  saveGlobalTags(getGlobalTags().filter(t => t !== tag))
  const colors = getTagColors()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [tag]: _removed, ...rest } = colors
  localStorage.setItem(TAG_COLORS_KEY, JSON.stringify(rest))
}

// ── Tag colors ─────────────────────────────────────────────────────────────────

export function getTagColors(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(TAG_COLORS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function setTagColor(tag: string, color: string): void {
  if (typeof window === 'undefined') return
  const colors = getTagColors()
  localStorage.setItem(TAG_COLORS_KEY, JSON.stringify({ ...colors, [tag]: color }))
}

// ── Todos ──────────────────────────────────────────────────────────────────────

export function getTodos(): Todo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const todos = raw ? JSON.parse(raw) : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return todos.map((t: any) => ({ tags: [], daily: false, ...t } as Todo))
  } catch { return [] }
}

export function saveTodos(todos: Todo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

// ── Startup cleanup ────────────────────────────────────────────────────────────

/**
 * Run once on app load:
 * 1. Migrate old 'daily' tag → daily: true field
 * 2. Purge done/cancelled todos older than 7 days
 * 3. Reset daily todos if it's a new day
 */
export function runStartupCleanup(todos: Todo[]): { todos: Todo[]; changed: boolean } {
  let changed = false
  const now = new Date()
  const today = now.toDateString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 1. Migrate 'daily' tag → daily field
  let result = todos.map(t => {
    if (t.tags?.includes('daily') && !t.daily) {
      changed = true
      return { ...t, daily: true, tags: t.tags.filter(tag => tag !== 'daily') }
    }
    return t
  })

  // 2. Purge completed todos older than 7 days
  result = result.filter(t => {
    const isComplete = t.status === 'done' || t.status === 'cancelled'
    if (isComplete && new Date(t.updatedAt) < weekAgo) {
      changed = true
      return false
    }
    return true
  })

  // 3. Reset daily todos if it's a new day
  const lastReset = localStorage.getItem(RESET_KEY)
  if (lastReset !== today) {
    result = result.map(t => {
      if (t.daily && (t.status === 'done' || t.status === 'cancelled')) {
        changed = true
        return { ...t, status: 'todo' as Status, updatedAt: now.toISOString() }
      }
      return t
    })
    localStorage.setItem(RESET_KEY, today)
  }

  return { todos: result, changed }
}
