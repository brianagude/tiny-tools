'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Todo, Status, Priority, TAG_COLOR_PALETTE } from '@/lib/types'
import { getGlobalTags, addGlobalTag, getTagColors, setTagColor } from '@/lib/storage'
import { formatRelativeDeadline } from '@/lib/dates'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HelpCircle } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { StatusButton } from './StatusButton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; todo: Todo }

// ── Priority picker ────────────────────────────────────────────────────────────

const priorities: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

const priorityConfig: Record<Priority, { active: string; dot: string; label: string }> = {
  urgent: { active: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',       dot: 'bg-red-500',    label: 'Urgent' },
  high:   { active: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', dot: 'bg-orange-400', label: 'High' },
  medium: { active: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', dot: 'bg-yellow-400', label: 'Medium' },
  low:    { active: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',    dot: 'bg-blue-400',   label: 'Low' },
  none:   { active: 'bg-accent text-muted-foreground',                                  dot: '',              label: 'Priority' },
}

function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const cfg = priorityConfig[value]
  return (
    <Popover>
      <PopoverTrigger className={cn(
        'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer',
        value !== 'none' ? cfg.active : 'text-muted-foreground hover:bg-accent'
      )}>
        {cfg.dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />}
        {cfg.label}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-36 p-1">
        {priorities.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors',
              value === p ? priorityConfig[p].active + ' font-medium' : 'hover:bg-accent text-muted-foreground'
            )}
          >
            {priorityConfig[p].dot && <span className={cn('w-1.5 h-1.5 rounded-full', priorityConfig[p].dot)} />}
            {priorityConfig[p].label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ── Daily toggle ───────────────────────────────────────────────────────────────

function DailyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer',
        value ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 font-medium' : 'text-muted-foreground hover:bg-accent'
      )}
    >
      <span>↻</span>Daily
    </button>
  )
}

// ── Tag picker ─────────────────────────────────────────────────────────────────

function TagPicker({
  selected, onChange, onRenameTag, onDeleteTag,
}: {
  selected: string[]
  onChange: (tags: string[]) => void
  onRenameTag: (oldName: string, newName: string) => void
  onDeleteTag: (tag: string) => void
}) {
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [newTagInput, setNewTagInput] = useState('')

  const refresh = () => {
    setGlobalTags(getGlobalTags())
    setTagColors(getTagColors())
  }

  useEffect(() => { refresh() }, [])

  // Sync when selected changes from outside (e.g. parent rename/delete)
  useEffect(() => { refresh() }, [selected])

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag])
  }

  const openEdit = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    if (editingTag === tag) { setEditingTag(null); return }
    setEditingTag(tag)
    setNameInput(tag)
  }

  const handleSave = (oldName: string) => {
    const newName = nameInput.trim()
    if (newName && newName !== oldName) {
      onRenameTag(oldName, newName)
      // Update local selected state — the parent will also sync todos atomically
      if (selected.includes(oldName)) {
        onChange(selected.map(t => t === oldName ? newName : t))
      }
    }
    setEditingTag(null)
    refresh()
  }

  const handleDelete = (tag: string) => {
    onDeleteTag(tag)
    if (selected.includes(tag)) onChange(selected.filter(t => t !== tag))
    setEditingTag(null)
    refresh()
  }

  const handleColorSelect = (tag: string, hex: string) => {
    setTagColor(tag, hex)
    refresh()
  }

  const submitNewTag = () => {
    const tag = newTagInput.trim()
    if (!tag || globalTags.includes(tag)) return
    addGlobalTag(tag)
    onChange([...selected, tag])
    setNewTagInput('')
    refresh()
  }

  const hasSelected = selected.length > 0

  return (
    <Popover onOpenChange={open => { if (!open) setEditingTag(null) }}>
      <PopoverTrigger className={cn(
        'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer',
        hasSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
      )}>
        <span>#</span>Tags
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="w-56 p-1.5 flex flex-col gap-0">
        {/* Tag list */}
        {globalTags.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-2">No tags yet.</p>
        )}
        {globalTags.map(tag => {
          const color = tagColors[tag] ?? '#94a3b8'
          const isActive = selected.includes(tag)
          const isEditing = editingTag === tag

          return (
            <div key={tag}>
              {/* Row */}
              <div className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors select-none',
                isEditing ? 'bg-accent' : isActive ? 'bg-accent/60 font-medium text-foreground' : 'hover:bg-accent text-muted-foreground'
              )}>
                {/* Color dot — opens edit */}
                <button
                  onMouseDown={e => openEdit(e, tag)}
                  className="w-2.5 h-2.5 rounded-full shrink-0 hover:scale-125 transition-transform"
                  style={{ backgroundColor: color }}
                />
                {/* Name — toggles tag on/off */}
                {isEditing ? (
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(tag); if (e.key === 'Escape') setEditingTag(null) }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-background rounded px-1.5 py-0.5 outline-none border border-border text-foreground text-xs"
                  />
                ) : (
                  <span className="flex-1" onClick={() => toggle(tag)}>{tag}</span>
                )}
                {/* Edit icon */}
                {!isEditing && (
                  <button
                    onMouseDown={e => openEdit(e, tag)}
                    className="opacity-30 hover:opacity-70 transition-opacity text-[10px] leading-none"
                  >
                    ✎
                  </button>
                )}
              </div>

              {/* Inline edit panel */}
              {isEditing && (
                <div className="mx-1 mb-1 px-2 py-2 bg-accent/40 rounded-md space-y-2">
                  {/* Color palette */}
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_COLOR_PALETTE.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => handleColorSelect(tag, c.hex)}
                        title={c.name}
                        className={cn(
                          'w-4 h-4 rounded-full hover:scale-125 transition-transform',
                          color === c.hex && 'outline outline-2 outline-offset-1 outline-foreground/40'
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDelete(tag)}
                      className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Delete tag
                    </button>
                    <button
                      onClick={() => handleSave(tag)}
                      className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* New tag input */}
        <div className={cn('pt-1 mt-0.5', globalTags.length > 0 && 'border-t border-border')}>
          <input
            value={newTagInput}
            onChange={e => setNewTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitNewTag(); if (e.key === 'Escape') setNewTagInput('') }}
            placeholder="New tag…"
            className="w-full text-xs bg-transparent outline-none px-2 py-1.5 placeholder:text-muted-foreground/40"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Deadline picker ────────────────────────────────────────────────────────────

function DeadlinePicker({ value, onChange }: { value: string | undefined; onChange: (d: string | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value + 'T00:00:00') : undefined
  const isOverdue = value ? new Date(value + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0)) : false

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(
        'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer',
        value
          ? isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent'
      )}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
        {value ? formatRelativeDeadline(value) : 'Deadline'}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={d => { onChange(d ? d.toISOString().split('T')[0] : undefined); setOpen(false) }}
          initialFocus
        />
        {value && (
          <div className="px-3 pb-2">
            <button onClick={() => { onChange(undefined); setOpen(false) }} className="text-xs text-muted-foreground hover:text-foreground">
              Clear deadline
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

interface TodoModalProps {
  state: ModalState
  onClose: () => void
  onCreate: (title: string, fields: Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>) => void
  onUpdate: (id: string, changes: Partial<Todo>) => void
  onDelete: (id: string) => void
  onCycleStatus: (id: string, status: Status) => void
  onRenameTag: (oldName: string, newName: string) => void
  onDeleteTag: (tag: string) => void
}

export function TodoModal({ state, onClose, onCreate, onUpdate, onDelete, onCycleStatus, onRenameTag, onDeleteTag }: TodoModalProps) {
  const isOpen = state.mode !== 'closed'
  const isEdit = state.mode === 'edit'
  const todo = isEdit ? state.todo : null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [daily, setDaily] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [deadline, setDeadline] = useState<string | undefined>()
  const [descFocused, setDescFocused] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description ?? '')
      setPriority(todo.priority)
      setDaily(todo.daily)
      setTags(todo.tags)
      setDeadline(todo.deadline)
    } else {
      setTitle(''); setDescription(''); setPriority('none'); setDaily(false); setTags([]); setDeadline(undefined)
    }
    setDescFocused(false)
    setTimeout(() => titleRef.current?.focus(), 50)
  }, [isOpen, todo?.id])

  // Sync tags when parent updates them (e.g. after rename/delete)
  useEffect(() => {
    if (isEdit && todo) setTags(todo.tags)
  }, [todo?.tags]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleField = <K extends keyof Todo>(key: K, value: Todo[K]) => {
    if (key === 'priority') setPriority(value as Priority)
    if (key === 'daily') setDaily(value as boolean)
    if (key === 'tags') setTags(value as string[])
    if (key === 'deadline') setDeadline(value as string | undefined)
    if (isEdit && todo) onUpdate(todo.id, { [key]: value })
  }

  const saveTitle = () => {
    if (isEdit && todo && title.trim() && title.trim() !== todo.title) onUpdate(todo.id, { title: title.trim() })
  }

  const saveDescription = () => {
    if (isEdit && todo) {
      const trimmed = description.trim()
      if (trimmed !== (todo.description ?? '')) onUpdate(todo.id, { description: trimmed || undefined })
    }
  }

  const handleCreate = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const desc = description.trim()
    onCreate(trimmed, { description: desc || undefined, priority, daily, tags, deadline, status: 'todo' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) { saveTitle(); saveDescription(); onClose() } }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl p-0 gap-0 overflow-hidden !top-[22%] !translate-y-0"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') onClose()
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isEdit) handleCreate()
        }}
      >
        <div className="px-5 pt-5 pb-2">
          <textarea
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            placeholder="Task title…"
            rows={1}
            className="w-full bg-transparent text-base font-semibold outline-none resize-none placeholder:text-muted-foreground/40 leading-snug"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
        </div>

        <div className="px-5 pb-4 min-h-[3rem]">
          {descFocused || !description ? (
            <textarea
              autoFocus={descFocused}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={e => { setDescFocused(true); const len = e.currentTarget.value.length; e.currentTarget.setSelectionRange(len, len) }}
              onBlur={() => { setDescFocused(false); saveDescription() }}
              placeholder="Add description…"
              rows={2}
              className="w-full bg-transparent text-sm text-muted-foreground outline-none resize-none placeholder:text-muted-foreground/40"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
          ) : (
            <div
              onClick={() => setDescFocused(true)}
              className="text-sm text-muted-foreground cursor-text prose prose-sm prose-neutral dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground/60 [&_blockquote]:not-italic"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      {children}
                    </a>
                  ),
                  input: ({ type, checked }) =>
                    type === 'checkbox' ? (
                      <input type="checkbox" checked={checked} readOnly className="mr-1.5 accent-foreground" />
                    ) : null,
                }}
              >
                {description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border flex items-center gap-1 flex-wrap">
          {isEdit && todo && (
            <StatusButton status={todo.status} onClick={() => onCycleStatus(todo.id, todo.status)} />
          )}
          <PriorityPicker value={priority} onChange={p => handleField('priority', p)} />
          <DailyToggle value={daily} onChange={v => handleField('daily', v)} />
          <TagPicker
            selected={tags}
            onChange={t => handleField('tags', t)}
            onRenameTag={onRenameTag}
            onDeleteTag={onDeleteTag}
          />
          <DeadlinePicker value={deadline} onChange={d => handleField('deadline', d)} />

          <div className="ml-auto">
            <Popover>
              <PopoverTrigger className="flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
                <HelpCircle className="w-3.5 h-3.5" />
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-56 p-3 text-xs space-y-1.5">
                <p className="font-medium text-foreground mb-2">Markdown reference</p>
                <p className="text-muted-foreground font-mono">**bold** &nbsp; *italic* &nbsp; `code`</p>
                <p className="text-muted-foreground font-mono">- item &nbsp; 1. item</p>
                <p className="text-muted-foreground font-mono">- [ ] todo &nbsp; - [x] done</p>
                <p className="text-muted-foreground font-mono">[text](url)</p>
                <p className="text-muted-foreground font-mono">&gt; blockquote</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 -mx-0 -mb-0 rounded-b-xl">
          {!isEdit && <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>}
          <div className="flex items-center gap-2 ml-auto">
            {isEdit ? (
              <>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { onDelete(todo!.id); onClose() }}
                >
                  Delete
                </Button>
                <Button size="sm" onClick={() => { saveTitle(); saveDescription(); onClose() }} disabled={!title.trim()}>
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>Create task</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
