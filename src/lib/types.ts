export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type Status = 'todo' | 'in-progress' | 'done' | 'cancelled'

// Platform tags (daily is now a first-class field, not a tag)
export const PLATFORM_TAGS: string[] = []

export const TAG_COLOR_PALETTE = [
  { name: 'gray',   hex: '#94a3b8' },
  { name: 'red',    hex: '#f87171' },
  { name: 'orange', hex: '#fb923c' },
  { name: 'yellow', hex: '#facc15' },
  { name: 'lime',   hex: '#a3e635' },
  { name: 'green',  hex: '#4ade80' },
  { name: 'teal',   hex: '#2dd4bf' },
  { name: 'blue',   hex: '#60a5fa' },
  { name: 'violet', hex: '#a78bfa' },
  { name: 'pink',   hex: '#f472b6' },
] as const

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
