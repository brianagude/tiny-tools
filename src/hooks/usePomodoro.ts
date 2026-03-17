'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PomodoroSettings,
  getPomodoroSettings,
  savePomodoroSettings,
  getTimeSpentForTodo,
  addTimeSpent,
} from '@/lib/pomodoroStorage'

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused'

export interface UsePomodoroReturn {
  phase: PomodoroPhase
  selectedTodoId: string | null
  selectedTodoTitle: string | null
  secondsLeft: number
  totalSeconds: number
  settings: PomodoroSettings
  canChangeTask: boolean
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skipBreak: () => void
  selectTodo: (id: string, title: string) => void
  updateSettings: (s: PomodoroSettings) => void
  getTimeSpentForTodo: (id: string) => number
}

function beep(ctx: AudioContext, frequency: number, duration: number, startTime: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.3, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playWorkDone(ctx: AudioContext) {
  const t = ctx.currentTime
  beep(ctx, 880, 0.3, t)
  beep(ctx, 880, 0.3, t + 0.4)
}

function playBreakDone(ctx: AudioContext) {
  beep(ctx, 660, 0.3, ctx.currentTime)
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

export function usePomodoro(): UsePomodoroReturn {
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [selectedTodoTitle, setSelectedTodoTitle] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings>(() => getPomodoroSettings())

  // Store phase in ref so interval callback can read current value
  const phaseRef = useRef<PomodoroPhase>('idle')
  phaseRef.current = phase

  const selectedTodoIdRef = useRef<string | null>(null)
  selectedTodoIdRef.current = selectedTodoId

  const totalSecondsRef = useRef(0)
  totalSecondsRef.current = totalSeconds

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const audioCtxRef = useRef<AudioContext | null>(null)

  // handlePhaseComplete stored in ref so interval never captures stale closure
  const handlePhaseCompleteRef = useRef<() => void>(() => {})

  handlePhaseCompleteRef.current = useCallback(() => {
    const currentPhase = phaseRef.current
    const todoId = selectedTodoIdRef.current
    const ctx = audioCtxRef.current

    if (currentPhase === 'work') {
      if (todoId) addTimeSpent(todoId, settingsRef.current.workMins * 60)
      if (ctx) playWorkDone(ctx)
      sendNotification('Work session complete!', 'Time for a break.')
      const breakSecs = settingsRef.current.breakMins * 60
      setTotalSeconds(breakSecs)
      setSecondsLeft(breakSecs)
      setPhase('break')
    } else if (currentPhase === 'break') {
      if (ctx) playBreakDone(ctx)
      sendNotification('Break over!', 'Ready for another session?')
      setPhase('idle')
      setSecondsLeft(0)
      setTotalSeconds(0)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return

    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          // Use timeout to avoid setState-inside-setState issues
          setTimeout(() => handlePhaseCompleteRef.current(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [phase])

  const start = useCallback(() => {
    if (!selectedTodoIdRef.current) return

    // Create AudioContext on first user gesture (iOS requirement)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }

    // Request notification permission in user-gesture context
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const secs = settingsRef.current.workMins * 60
    setTotalSeconds(secs)
    setSecondsLeft(secs)
    setPhase('work')
  }, [])

  const pause = useCallback(() => {
    setPhase('paused')
  }, [])

  const resume = useCallback(() => {
    setPhase('work')
  }, [])

  const stop = useCallback(() => {
    const todoId = selectedTodoIdRef.current
    const current = secondsLeft  // captured at call time
    const total = totalSecondsRef.current
    const elapsed = total - current
    if (todoId && phaseRef.current === 'work' && elapsed > 0) {
      addTimeSpent(todoId, elapsed)
    }
    setPhase('idle')
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [secondsLeft])

  const skipBreak = useCallback(() => {
    setPhase('idle')
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [])

  const selectTodo = useCallback((id: string, title: string) => {
    if (phaseRef.current === 'work') return
    setSelectedTodoId(id)
    setSelectedTodoTitle(title)
  }, [])

  const updateSettings = useCallback((s: PomodoroSettings) => {
    setSettings(s)
    savePomodoroSettings(s)
  }, [])

  const canChangeTask = phase === 'idle' || phase === 'break'

  return {
    phase,
    selectedTodoId,
    selectedTodoTitle,
    secondsLeft,
    totalSeconds,
    settings,
    canChangeTask,
    start,
    pause,
    resume,
    stop,
    skipBreak,
    selectTodo,
    updateSettings,
    getTimeSpentForTodo,
  }
}
