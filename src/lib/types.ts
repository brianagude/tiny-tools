export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type Status = 'todo' | 'in-progress' | 'done' | 'cancelled'

// Platform tags (daily is now a first-class field, not a tag)
export const PLATFORM_TAGS: string[] = []

export const TAG_COLOR_PALETTE = [
  { name: 'red',    hex: '#E84337' },
  { name: 'orange', hex: '#FE8601' },
  { name: 'yellow', hex: '#FFD834' },
  { name: 'lime',   hex: '#AEC95F' },
  { name: 'green',  hex: '#3E7E27' },
  { name: 'teal',   hex: '#70A5A3' },
  { name: 'blue',   hex: '#426AA9' },
  { name: 'violet', hex: '#8776A6' },
  { name: 'pink',   hex: '#F285A1' },
  { name: 'gray',   hex: '#94a3b8' },
] as const

export interface CompletionRecord {
  todoId: string
  title: string
  tags: string[]
  date: string        // "YYYY-MM-DD"
  completedAt: string // ISO timestamp
}

export interface Todo {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  daily: boolean        // resets each day when completed
  tags: string[]
  deadline?: string     // ISO date string
  createdAt: string
  updatedAt: string
}
