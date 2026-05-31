import type { ReactNode } from 'react'

export default function RoadmapPagePanel({
  children,
  className = '',
  compact = false,
  elevated = false,
}: {
  children: ReactNode
  className?: string
  compact?: boolean
  elevated?: boolean
}) {
  return (
    <div
      className={`mx-auto w-full ${
        compact ? 'max-w-xl' : 'max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8'
      } ${className}`}
    >
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-sm ${
          elevated
            ? 'shadow-xl shadow-indigo-500/10 ring-1 ring-white/70'
            : 'shadow-sm'
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-500" />
        <div className={compact ? 'p-5 sm:p-6' : 'space-y-6 p-5 sm:p-6 lg:p-8'}>{children}</div>
      </div>
    </div>
  )
}
