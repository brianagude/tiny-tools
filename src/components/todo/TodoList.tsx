'use client'

import { Todo, Priority, Status } from '@/lib/types'
import { TodoItem } from './TodoItem'

const priorityOrder: Record<Priority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3, none: 4,
}

const statusOrder: Record<Status, number> = {
  'in-progress': 0, 'todo': 1, 'done': 2, 'cancelled': 3,
}

function getDeadlineMs(t: Todo): number {
  return t.deadline ? new Date(t.deadline + 'T00:00:00').getTime() : Infinity
}

function byPriorityDateStatus(a: Todo, b: Todo): number {
  const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
  if (pDiff !== 0) return pDiff
  const aDl = getDeadlineMs(a)
  const bDl = getDeadlineMs(b)
  if (aDl !== bDl) return aDl - bDl
  return statusOrder[a.status] - statusOrder[b.status]
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-xs text-muted-foreground/50">{count}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}

interface TodoListProps {
  todos: Todo[]
  onStatusClick: (todo: Todo) => void
  onTodoClick: (todo: Todo) => void
}

export function TodoList({ todos, onStatusClick, onTodoClick }: TodoListProps) {
  const active = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const done   = todos.filter(t => t.status === 'done' || t.status === 'cancelled')

  const daily = active.filter(t => t.daily).sort(byPriorityDateStatus)
  const rest  = active.filter(t => !t.daily).sort(byPriorityDateStatus)
  const completed = done.sort(byPriorityDateStatus)

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        No tasks yet.
      </div>
    )
  }

  const renderGroup = (items: Todo[]) => items.map(todo => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onStatusClick={() => onStatusClick(todo)}
      onClick={() => onTodoClick(todo)}
    />
  ))

  return (
    <div className="pb-2">
      {daily.length > 0 && (
        <section>
          <SectionHeader label="Daily" count={daily.length} />
          {renderGroup(daily)}
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {daily.length > 0 && <SectionHeader label="Tasks" count={rest.length} />}
          {renderGroup(rest)}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <SectionHeader label="Completed" count={completed.length} />
          {renderGroup(completed)}
        </section>
      )}
    </div>
  )
}
