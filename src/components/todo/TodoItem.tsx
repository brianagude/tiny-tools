'use client'

import { useEffect, useState } from 'react'
import { Todo, Priority } from '@/lib/types'
import { getTagColors } from '@/lib/storage'
import { formatRelativeDeadline } from '@/lib/dates'
import { StatusButton } from './StatusButton'
import { cn } from '@/lib/utils'

const priorityDot: Record<Priority, { color: string; label: string }> = {
  urgent: { color: 'bg-red-500',    label: 'Urgent' },
  high:   { color: 'bg-orange-400', label: 'High' },
  medium: { color: 'bg-yellow-400', label: 'Medium' },
  low:    { color: 'bg-blue-400',   label: 'Low' },
  none:   { color: '',              label: '' },
}

interface TodoItemProps {
  todo: Todo
  onStatusClick: () => void
  onClick: () => void
}

export function TodoItem({ todo, onStatusClick, onClick }: TodoItemProps) {
  const isDone = todo.status === 'done' || todo.status === 'cancelled'
  const dot = priorityDot[todo.priority]
  const visibleTags = todo.tags
  const [tagColors, setTagColors] = useState<Record<string, string>>({})

  useEffect(() => { setTagColors(getTagColors()) }, [todo.tags])

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 cursor-pointer group rounded-md transition-colors"
    >
      {/* Priority dot */}
      <div className="w-2 shrink-0 flex justify-center">
        {dot.color && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dot.color)} title={dot.label} />
        )}
      </div>

      <StatusButton status={todo.status} onClick={onStatusClick} />

      <span className={cn('flex-1 text-sm truncate', isDone && 'line-through text-muted-foreground')}>
        {todo.title}
      </span>

      {/* Tags + deadline */}
      <div className="flex items-center gap-1.5 shrink-0">
        {visibleTags.map(tag => {
          const color = tagColors[tag] ?? '#94a3b8'
          return (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {tag}
            </span>
          )
        })}
        {todo.deadline && (() => {
          const overdue = new Date(todo.deadline + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0))
          return (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-medium',
              overdue
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
            )}>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2.5"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2.5"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2.5"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2.5"/>
              </svg>
              {formatRelativeDeadline(todo.deadline)}
            </span>
          )
        })()}
      </div>
    </div>
  )
}
