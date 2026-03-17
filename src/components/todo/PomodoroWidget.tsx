'use client'

import { Todo } from '@/lib/types'
import { UsePomodoroReturn } from '@/hooks/usePomodoro'

interface Props {
  pomodoro: UsePomodoroReturn
  todos: Todo[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimeSpent(seconds: number): string {
  if (seconds === 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// Shared input/select styles for dark background
const selectCls = 'text-xs rounded border border-white/15 bg-white/5 text-white/70 px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/40'
const btnCls = 'text-xs px-2.5 py-0.5 rounded border border-white/15 text-white/60 hover:bg-white/10 hover:text-white transition-colors'

export function PomodoroWidget({ pomodoro, todos }: Props) {
  const {
    phase,
    selectedTodoId,
    selectedTodoTitle,
    secondsLeft,
    totalSeconds,
    settings,
    start,
    pause,
    resume,
    stop,
    skipBreak,
    selectTodo,
    updateSettings,
    getTimeSpentForTodo,
  } = pomodoro

  const activeTodos = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const persistedTime = selectedTodoId ? getTimeSpentForTodo(selectedTodoId) : 0
  const sessionSeconds = (phase === 'work' || phase === 'paused') ? (totalSeconds - secondsLeft) : 0
  const liveTimeSpent = persistedTime + sessionSeconds
  // floor to completed minutes only — don't show until a full minute has elapsed
  const timeSpentDisplay = Math.floor(liveTimeSpent / 60) * 60
  // elapsed fraction: 0 at start, 1 at end
  const elapsed = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0

  return (
    <div className="shrink-0 bg-black">
      <div className="flex items-center gap-3 px-4 py-2.5">

        {/* Idle */}
        {phase === 'idle' && (
          <>
            <span className="text-xs font-medium text-white/30 uppercase tracking-widest shrink-0">
              Timer
            </span>

            <select
              value={selectedTodoId ?? ''}
              onChange={e => {
                const todo = activeTodos.find(t => t.id === e.target.value)
                if (todo) selectTodo(todo.id, todo.title)
              }}
              className={`${selectCls} w-full`}
              style={{ maxWidth: 240 }}
            >
              <option value="">Select a task…</option>
              {activeTodos.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={1}
                max={120}
                value={settings.workMins}
                onChange={e => updateSettings({ ...settings, workMins: Math.max(1, parseInt(e.target.value) || 1) })}
                className={`${selectCls} text-center`}
                style={{ width: 64 }}
              />
              <span className="text-xs text-white/25">/</span>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.breakMins}
                onChange={e => updateSettings({ ...settings, breakMins: Math.max(1, parseInt(e.target.value) || 1) })}
                className={`${selectCls} text-center`}
                style={{ width: 64 }}
              />
              <span className="text-xs text-white/30">min</span>
            </div>

            {selectedTodoId && liveTimeSpent >= 60 && (
              <span className="text-xs text-white/40 shrink-0">{formatTimeSpent(timeSpentDisplay)} logged</span>
            )}

            <button
              onClick={start}
              disabled={!selectedTodoId}
              className={`${btnCls} shrink-0 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Start
            </button>
          </>
        )}

        {/* Work / Paused */}
        {(phase === 'work' || phase === 'paused') && (
          <>
            <span
              className="text-xs text-white/50 shrink-0 truncate"
              style={{ maxWidth: 200 }}
              title={selectedTodoTitle ?? ''}
            >
              {selectedTodoTitle}
            </span>

            <div className="flex-1 relative h-[3px] rounded-full bg-white overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-neutral-500 transition-[width] duration-1000 ease-linear"
                style={{ width: `${elapsed * 100}%` }}
              />
            </div>

            <span className="text-xs font-mono text-white/70 shrink-0 tabular-nums">
              {formatTime(secondsLeft)}
            </span>

            {phase === 'paused' && (
              <span className="text-xs text-white/40 shrink-0 uppercase tracking-widest">paused</span>
            )}

            {selectedTodoId && liveTimeSpent >= 60 && (
              <span className="text-xs text-white/40 shrink-0">{formatTimeSpent(timeSpentDisplay)} logged</span>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {phase === 'work' ? (
                <button onClick={pause} className={btnCls}>Pause</button>
              ) : (
                <button onClick={resume} className={btnCls}>Resume</button>
              )}
              <button onClick={stop} className={btnCls}>Stop</button>
            </div>
          </>
        )}

        {/* Break */}
        {phase === 'break' && (
          <>
            <span className="text-xs font-medium text-white/30 uppercase tracking-widest shrink-0">Break</span>

            <span className="text-xs text-white/30 shrink-0">Next:</span>

            <select
              value={selectedTodoId ?? ''}
              onChange={e => {
                const todo = activeTodos.find(t => t.id === e.target.value)
                if (todo) selectTodo(todo.id, todo.title)
              }}
              className={`${selectCls} w-full`}
              style={{ maxWidth: 240 }}
            >
              <option value="">Select a task…</option>
              {activeTodos.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <div className="flex-1 relative h-[3px] rounded-full bg-white overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-neutral-500 transition-[width] duration-1000 ease-linear"
                style={{ width: `${elapsed * 100}%` }}
              />
            </div>

            <span className="text-xs font-mono text-white/70 shrink-0 tabular-nums">
              {formatTime(secondsLeft)}
            </span>

            <button onClick={skipBreak} className={`${btnCls} shrink-0`}>Skip</button>
          </>
        )}

      </div>
    </div>
  )
}
