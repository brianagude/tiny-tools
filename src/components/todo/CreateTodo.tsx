'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'

interface CreateTodoProps {
  onAdd: (title: string) => void
}

export function CreateTodo({ onAdd }: CreateTodoProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
    inputRef.current?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') setValue('')
  }

  return (
    <div className="px-4 py-2 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/50 text-base w-5 text-center select-none">+</span>
        <Input
          ref={inputRef}
          placeholder="Add a task…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm h-8 bg-transparent placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  )
}
