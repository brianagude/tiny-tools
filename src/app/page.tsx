import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Tiny Tools</h1>
      <p className="text-muted-foreground text-sm">A collection of small, useful tools.</p>
      <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
        <Link
          href="/to-do"
          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-accent transition-colors"
        >
          <span className="text-lg">✓</span>
          <div>
            <p className="font-medium">To-Do</p>
            <p className="text-muted-foreground text-xs">Manage tasks and ideas</p>
          </div>
        </Link>
      </div>
    </main>
  )
}
