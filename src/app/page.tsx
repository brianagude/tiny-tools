import Link from 'next/link'
import { CheckSquareOffset, CaretCircleRightIcon } from '@phosphor-icons/react/dist/ssr'

const tools = [
  {
    href: '/to-do',
    icon: CheckSquareOffset,
    name: 'To-Do',
    description: 'Manage your tasks, daily habits, and ideas in one place.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">

        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tiny Tools</h1>
          <p className="text-muted-foreground">A growing collection of small things created by <a href="https://www.brianagude.com" target="_blank" rel="noopener noreferrer" className="underline text-foreground">briana gude</a>.</p>
        </header>

        {/* Tool cards */}
        <div className="flex flex-col gap-3">
          {tools.map(({ href, icon: Icon, name, description }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-5 rounded-xl border border-border bg-card px-6 py-5 hover:bg-accent transition-colors group"
            >
              <div className="shrink-0 w-11 h-11 rounded-lg bg-background border border-border flex items-center justify-center group-hover:border-foreground/20 transition-colors">
                <Icon size={24} weight="duotone" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-base">{name}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
              <div className="ml-auto">
                <CaretCircleRightIcon size={20} weight="duotone" />
              </div>
              {/* <span className="ml-auto text-muted-foreground/40 text-lg">→</span> */}
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
