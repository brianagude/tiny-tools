'use client'

import { Todo, Priority } from '@/lib/types'
import { TodoItem } from './TodoItem'

const priorityOrder: Record<Priority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3, none: 4,
}

const byPriority = (a: Todo, b: Todo) => priorityOrder[a.priority] - priorityOrder[b.priority]

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

  const daily = active.filter(t => t.daily).sort(byPriority)
  const rest  = active.filter(t => !t.daily).sort(byPriority)
  const completed = done.sort(byPriority)

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        No tasks yet. Add one below.
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
