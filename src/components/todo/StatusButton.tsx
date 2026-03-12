'use client'

import { Status } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<Status, { label: string; className: string }> = {
  todo:          { label: '○', className: 'text-blue-500' },
  'in-progress': { label: '◑', className: 'text-yellow-500' },
  done:          { label: '●', className: 'text-green-500' },
  cancelled:     { label: '✕', className: 'text-muted-foreground' },
}

interface StatusButtonProps {
  status: Status
  onClick: () => void
}

export function StatusButton({ status, onClick }: StatusButtonProps) {
  const config = statusConfig[status]
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      title={`Status: ${status}`}
      className={cn('text-base leading-none transition-opacity hover:opacity-70 w-5 text-center', config.className)}
    >
      {config.label}
    </button>
  )
}
