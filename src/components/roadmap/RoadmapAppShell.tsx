import type { ReactNode } from 'react'

export default function RoadmapAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="roadmap-app min-h-dvh bg-slate-50 text-slate-900 antialiased">{children}</div>
  )
}
