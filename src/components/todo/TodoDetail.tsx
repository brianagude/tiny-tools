'use client'

import { useState, useEffect } from 'react'
import { Todo, Status, Priority, PLATFORM_TAGS } from '@/lib/types'
import { getGlobalTags, addGlobalTag } from '@/lib/storage'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusButton } from './StatusButton'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

const priorities: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

const priorityStyles: Record<Priority, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  low:    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  none:   'bg-accent text-muted-foreground',
}

interface TodoDetailProps {
  todo: Todo | null
  onClose: () => void
  onUpdate: (id: string, changes: Partial<Todo>) => void
  onDelete: (id: string) => void
  onCycleStatus: (id: string, status: Status) => void
}

export function TodoDetail({ todo, onClose, onUpdate, onDelete, onCycleStatus }: TodoDetailProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customTagInput, setCustomTagInput] = useState('')
  const [calOpen, setCalOpen] = useState(false)
  const [globalTags, setGlobalTags] = useState<string[]>([])

  useEffect(() => {
    setGlobalTags(getGlobalTags())
  }, [])

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description ?? '')
      setCustomTagInput('')
    }
  }, [todo?.id])

  if (!todo) return null

  const saveTitle = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== todo.title) onUpdate(todo.id, { title: trimmed })
  }

  const saveDescription = () => {
    const trimmed = description.trim()
    if (trimmed !== (todo.description ?? '')) onUpdate(todo.id, { description: trimmed || undefined })
  }

  const toggleTag = (tag: string) => {
    const has = todo.tags.includes(tag)
    onUpdate(todo.id, { tags: has ? todo.tags.filter(t => t !== tag) : [...todo.tags, tag] })
  }

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag) { setCustomTagInput(''); return }
    addGlobalTag(tag)
    setGlobalTags(getGlobalTags())
    if (!todo.tags.includes(tag)) {
      onUpdate(todo.id, { tags: [...todo.tags, tag] })
    }
    setCustomTagInput('')
  }

  const removeTag = (tag: string) => {
    onUpdate(todo.id, { tags: todo.tags.filter(t => t !== tag) })
  }

  const setDeadline = (date: Date | undefined) => {
    onUpdate(todo.id, { deadline: date ? date.toISOString().split('T')[0] : undefined })
    setCalOpen(false)
  }

  const deadlineDate = todo.deadline ? new Date(todo.deadline + 'T00:00:00') : undefined

  return (
    <Sheet open={!!todo} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-[420px] sm:w-[480px] flex flex-col gap-0 p-0 overflow-y-auto">
        {/* Title */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <StatusButton status={todo.status} onClick={() => onCycleStatus(todo.id, todo.status)} />
            </div>
            <SheetTitle className="flex-1 text-left font-semibold text-base">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                className="w-full bg-transparent outline-none"
              />
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveDescription}
            placeholder="Add a description…"
            rows={4}
            className="w-full bg-transparent text-sm text-muted-foreground outline-none resize-none placeholder:text-muted-foreground/40"
          />

          {/* Priority */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              {priorities.map(p => (
                <button
                  key={p}
                  onClick={() => onUpdate(todo.id, { priority: p })}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full capitalize transition-all',
                    todo.priority === p
                      ? priorityStyles[p] + ' font-medium'
                      : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {/* Platform tags (daily) */}
              {PLATFORM_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full capitalize transition-all',
                    todo.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                  )}
                >
                  {tag}
                </button>
              ))}
              {/* Global custom tags */}
              {globalTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full capitalize transition-all',
                    todo.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* Create new global tag */}
            <input
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustomTag(); if (e.key === 'Escape') setCustomTagInput('') }}
              placeholder="New tag…"
              className="text-xs bg-transparent outline-none border-b border-border/50 focus:border-border pb-0.5 w-28 placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Deadline</p>
            <div className="flex items-center gap-2">
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger
                  className={cn(
                    'text-sm px-3 py-1.5 rounded-md border border-border transition-colors hover:bg-accent cursor-pointer',
                    deadlineDate && new Date(todo.deadline! + 'T00:00:00') < new Date()
                      ? 'text-red-500 border-red-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {deadlineDate
                    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Set deadline…'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {todo.deadline && (
                <button
                  onClick={() => onUpdate(todo.id, { deadline: undefined })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between items-center shrink-0">
          <p className="text-xs text-muted-foreground">
            Created {new Date(todo.createdAt).toLocaleDateString()}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onDelete(todo.id); onClose() }}
          >
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
