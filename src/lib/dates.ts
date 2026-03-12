export function formatRelativeDeadline(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  if (diff >= 7 && diff < 14) return 'Next ' + date.toLocaleDateString('en-US', { weekday: 'long' })
  if (diff < 0) return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  // Same year: "March 15", different year: "March 15, 2027"
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
