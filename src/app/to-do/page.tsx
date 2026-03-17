'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Todo, Priority } from '@/lib/types'
import { useTodos } from '@/hooks/useTodos'
import { usePomodoro } from '@/hooks/usePomodoro'
import { TodoList } from '@/components/todo/TodoList'
import { TodoModal, ModalState } from '@/components/todo/TodoModal'
import { PomodoroWidget } from '@/components/todo/PomodoroWidget'

export default function TodoPage() {
  const { todos, addTodo, updateTodo, deleteTodo, cycleStatus, renameTag, deleteTag } = useTodos()
  const pomodoro = usePomodoro()
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const handleTodoClick = (todo: Todo) => setModal({ mode: 'edit', todo })

  const handleCreate = (title: string, fields: Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>) => {
    addTodo(title, fields.priority as Priority | undefined, fields.daily ?? false, fields.tags ?? [], fields.deadline, fields.description)
  }

  const handleUpdate = (id: string, changes: Partial<Todo>) => {
    updateTodo(id, changes)
    if (modal.mode === 'edit' && modal.todo.id === id) {
      setModal({ mode: 'edit', todo: { ...modal.todo, ...changes } })
    }
  }

  const handleRenameTag = (oldName: string, newName: string) => {
    renameTag(oldName, newName)
    if (modal.mode === 'edit' && modal.todo.tags.includes(oldName)) {
      setModal({ mode: 'edit', todo: { ...modal.todo, tags: modal.todo.tags.map(t => t === oldName ? newName : t) } })
    }
  }

  const handleDeleteTag = (tagName: string) => {
    deleteTag(tagName)
    if (modal.mode === 'edit' && modal.todo.tags.includes(tagName)) {
      setModal({ mode: 'edit', todo: { ...modal.todo, tags: modal.todo.tags.filter(t => t !== tagName) } })
    }
  }

  const remaining = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled').length

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="p-4 border-b border-border shrink-0 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Things I Need To Do</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{remaining} remaining</span>
          <Link
            href="/to-do/stats"
            className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Stats
          </Link>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New task
          </button>
        </div>
      </header>

      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/50 bg-border/15">
        <div className="w-2 shrink-0" />
        <div className="w-5 shrink-0" />
        <span className="flex-1 text-xs text-muted-foreground/50">Task</span>
        <span className="text-xs text-muted-foreground/50 shrink-0 pr-1">Tags / Deadline</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TodoList
          todos={todos}
          onStatusClick={todo => cycleStatus(todo.id, todo.status)}
          onTodoClick={handleTodoClick}
        />
      </div>

      <PomodoroWidget
        pomodoro={pomodoro}
        todos={todos.filter(t => t.status !== 'done' && t.status !== 'cancelled')}
      />

      <TodoModal
        state={modal}
        onClose={() => setModal({ mode: 'closed' })}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={deleteTodo}
        onCycleStatus={cycleStatus}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
      />
    </div>
  )
}
