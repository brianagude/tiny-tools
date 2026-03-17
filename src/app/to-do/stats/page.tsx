'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getTodos } from '@/lib/storage'
import { getTagColors } from '@/lib/storage'
import { getAllSessions, Session } from '@/lib/pomodoroStorage'
import { Todo } from '@/lib/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

function dateStr(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function weekStart(): string {
  const now = new Date()
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  return mon.toISOString().slice(0, 10)
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]
}

function formatDate(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcStreak(byDay: Record<string, number>): number {
  let streak = 0
  const d = new Date()
  if (!byDay[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1)
  while (byDay[d.toISOString().slice(0, 10)] > 0) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ── Donut chart ────────────────────────────────────────────────────────────────

const R = 54, STROKE = 22, SIZE = 152, CTR = SIZE / 2
const C = 2 * Math.PI * R

const FALLBACK_COLORS = [
  '#60a5fa', '#f87171', '#4ade80', '#facc15',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f472b6', '#94a3b8',
]

function DonutChart({ slices }: { slices: Array<{ label: string; seconds: number; color: string }> }) {
  const total = slices.reduce((s, x) => s + x.seconds, 0)
  if (total === 0) return null
  let cum = 0
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
      <circle cx={CTR} cy={CTR} r={R} fill="none" stroke="hsl(var(--border))" strokeWidth={STROKE} />
      {slices.map((slice, i) => {
        const frac = slice.seconds / total
        const dash = frac * C - 2
        const angle = cum * 360 - 90
        cum += frac
        return (
          <circle key={i} cx={CTR} cy={CTR} r={R} fill="none"
            stroke={slice.color} strokeWidth={STROKE}
            strokeDasharray={`${Math.max(0, dash)} ${C}`}
            transform={`rotate(${angle}, ${CTR}, ${CTR})`}
          />
        )
      })}
    </svg>
  )
}

// ── Data types ─────────────────────────────────────────────────────────────────

interface DashboardData {
  todayTotal: number
  todayTasks: Array<{ id: string; title: string; seconds: number }>
  weekTotal: number
  weekTags: Array<{ tag: string; seconds: number; color: string }>
  past14: Array<{ date: string; seconds: number }>
  allTimeTotal: number
  bestDaySeconds: number
  bestDayDate: string
  streak: number
  hasAnyData: boolean
}

function compute(todos: Todo[], tagColors: Record<string, string>, sessions: Session[]): DashboardData {
  const todoMap = new Map<string, Todo>(todos.map(t => [t.id, t]))
  const today = dateStr(0)
  const wStart = weekStart()

  // ── By day map (all time)
  const byDay: Record<string, number> = {}
  for (const s of sessions) {
    byDay[s.date] = (byDay[s.date] ?? 0) + s.seconds
  }

  // ── Today
  const todayTaskMap: Record<string, number> = {}
  for (const s of sessions.filter(s => s.date === today)) {
    todayTaskMap[s.todoId] = (todayTaskMap[s.todoId] ?? 0) + s.seconds
  }
  const todayTasks = Object.entries(todayTaskMap)
    .map(([id, seconds]) => ({ id, title: todoMap.get(id)?.title ?? 'Deleted task', seconds }))
    .sort((a, b) => b.seconds - a.seconds)
  const todayTotal = todayTasks.reduce((s, t) => s + t.seconds, 0)

  // ── This week by tag
  const weekSessions = sessions.filter(s => s.date >= wStart)
  const weekTotal = weekSessions.reduce((s, x) => s + x.seconds, 0)
  const weekTagMap: Record<string, number> = {}
  for (const s of weekSessions) {
    const tags = todoMap.get(s.todoId)?.tags ?? []
    if (tags.length === 0) {
      weekTagMap['untagged'] = (weekTagMap['untagged'] ?? 0) + s.seconds
    } else {
      for (const tag of tags) {
        weekTagMap[tag] = (weekTagMap[tag] ?? 0) + s.seconds
      }
    }
  }
  const weekTags = Object.entries(weekTagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, seconds], i) => ({
      tag, seconds,
      color: tag === 'untagged' ? '#94a3b8' : (tagColors[tag] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
    }))

  // ── Past 14 days
  const past14 = Array.from({ length: 14 }, (_, i) => {
    const d = dateStr(13 - i)
    return { date: d, seconds: byDay[d] ?? 0 }
  })

  // ── All time
  const allTimeTotal = sessions.reduce((s, x) => s + x.seconds, 0)
  const bestEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  const streak = calcStreak(byDay)

  return {
    todayTotal, todayTasks,
    weekTotal, weekTags,
    past14,
    allTimeTotal,
    bestDaySeconds: bestEntry?.[1] ?? 0,
    bestDayDate: bestEntry?.[0] ?? '',
    streak,
    hasAnyData: sessions.length > 0,
  }
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest shrink-0">{label}</span>
      <div className="h-px flex-1 bg-border/60" />
      {right && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{right}</span>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  const loadData = useCallback(() => {
    const sessions = getAllSessions()
    const todos = getTodos()
    const tagColors = getTagColors()
    setData(compute(todos, tagColors, sessions))
  }, [])

  useEffect(() => {
    loadData()
    const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadData])

  if (!data) return null

  const maxBar = Math.max(...data.past14.map(d => d.seconds), 1)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Stats</h1>
        <Link href="/to-do" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Back to tasks
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!data.hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-8">
            <p className="text-sm text-muted-foreground">No time logged yet.</p>
            <p className="text-xs text-muted-foreground/50">
              Start the timer on the tasks page — your stats will appear here.
            </p>
          </div>
        ) : (
          <div className="pb-10">
            {/* ── All time ──────────────────────────────────────────────────── */}
            <SectionHeader label="All time" />
            <div className="grid grid-cols-3 gap-px bg-border mx-4 rounded-lg overflow-hidden">
              <div className="bg-background px-4 py-4">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Total</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(data.allTimeTotal)}</p>
              </div>
              <div className="bg-background px-4 py-4">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Best day</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(data.bestDaySeconds)}</p>
                {data.bestDayDate && (
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{formatDate(data.bestDayDate)}</p>
                )}
              </div>
              <div className="bg-background px-4 py-4">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Streak</p>
                <p className="text-xl font-semibold tabular-nums">{data.streak}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">{data.streak === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            {/* ── Today ─────────────────────────────────────────────────────── */}
            <SectionHeader label="Today" right={data.todayTotal > 0 ? fmt(data.todayTotal) : undefined} />
            {data.todayTasks.length === 0 ? (
              <p className="px-4 text-xs text-muted-foreground/40 pb-2">No sessions logged today.</p>
            ) : (
              data.todayTasks.map(task => (
                <div key={task.id} className="flex items-center px-4 py-2 border-b border-border/20 last:border-0">
                  <span className="flex-1 text-sm truncate">{task.title}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{fmt(task.seconds)}</span>
                </div>
              ))
            )}

            {/* ── This week ─────────────────────────────────────────────────── */}
            {data.weekTotal > 0 && (
              <>
                <SectionHeader label="This week" right={fmt(data.weekTotal)} />
                <div className="flex items-start gap-6 px-4">
                  <DonutChart slices={data.weekTags.map(t => ({ label: t.tag, seconds: t.seconds, color: t.color }))} />
                  <div className="flex flex-col gap-2.5 pt-1">
                    {data.weekTags.map(({ tag, seconds, color }) => (
                      <div key={tag} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-muted-foreground">{tag}</span>
                        <span className="text-sm font-medium tabular-nums ml-4">{fmt(seconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Past 14 days ──────────────────────────────────────────────── */}
            {/* <SectionHeader label="Past 14 days" /> */}

            {/* Bar chart */}
            {/* <div className="px-4">
              <div className="flex items-end gap-0.5 h-10">
                {data.past14.map(day => (
                  <div
                    key={day.date}
                    className="flex-1 rounded-sm"
                    style={{
                      height: day.seconds > 0 ? `${Math.max(3, (day.seconds / maxBar) * 40)}px` : '2px',
                      backgroundColor: day.date === dateStr(0)
                        ? 'hsl(var(--foreground))'
                        : day.seconds > 0
                        ? 'hsl(var(--foreground) / 0.25)'
                        : 'hsl(var(--border))',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-0.5 mt-1">
                {data.past14.map(day => (
                  <div key={day.date} className="flex-1 text-center">
                    <span className={`text-[9px] ${day.date === dateStr(0) ? 'text-foreground/60' : 'text-muted-foreground/40'}`}>
                      {dayLabel(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Day breakdown list — only days with data */}
            {/* <div className="mt-3">
              {data.past14
                .filter(d => d.seconds > 0)
                .slice()
                .reverse()
                .map(day => (
                  <div key={day.date} className="flex items-center px-4 py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {day.date === dateStr(0) ? 'Today' : formatDate(day.date)}
                    </span>
                    <div className="flex-1 h-[2px] rounded-full bg-border mx-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground/30"
                        style={{ width: `${(day.seconds / maxBar) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{fmt(day.seconds)}</span>
                  </div>
                ))}
            </div> */}
          </div>
        )}
      </div>
    </div>
  )
}
