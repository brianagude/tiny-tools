# Tiny Tools

A growing collection of small, useful tools built by [Briana Gude](https://www.brianagude.com).

## Tools

| Tool | Route | Description |
|---|---|---|
| To-Do | `/to-do` | Task manager with priorities, tags, deadlines, and daily habits |

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: shadcn/ui (Base UI) + Tailwind CSS
- **Icons**: Phosphor Icons (duotone)
- **Font**: Spline Sans
- **Storage**: localStorage (no backend)
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    page.tsx          # Home — tool cards
    layout.tsx        # Root layout, metadata, fonts
    sitemap.ts        # Auto-generated sitemap
    robots.ts         # robots.txt
    to-do/
      page.tsx        # To-do app
  components/
    todo/             # TodoList, TodoItem, TodoModal, StatusButton
    ui/               # shadcn primitives
  hooks/
    useTodos.ts       # CRUD + localStorage persistence
  lib/
    types.ts          # Todo types, tag palette
    storage.ts        # localStorage helpers, startup cleanup
    dates.ts          # Relative deadline formatting
    utils.ts          # cn()
```
