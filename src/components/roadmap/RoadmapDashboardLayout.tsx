import { Bell, Plus, Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { formatRoadmapDisplayName } from '../../lib/roadmap/roadmapDisplay'
import RoadmapSidebar, { RoadmapBrandLogo, RoadmapMobileNav, type RoadmapNavPage } from './RoadmapSidebar'

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()

    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    let intervalId: number | undefined

    const timeoutId = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, 60_000)
    }, msUntilNextMinute)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  return (
    <p className="mt-0.5 text-sm tabular-nums text-slate-500">
      {now.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}
    </p>
  )
}

export default function RoadmapDashboardLayout({
  username,
  workspaceName,
  profilePicture,
  profileRole = "",
  activePage = 'dashboard',
  onLogout,
  onAccount,
  pageTitle,
  pageDescription,
  isGuest = false,
  children,
}: {
  username: string
  workspaceName: string
  profileRole?: string
  profilePicture?: string
  activePage?: RoadmapNavPage
  onLogout: () => void
  onAccount?: () => void
  pageTitle?: string
  pageDescription?: string
  isGuest?: boolean
  children: ReactNode
}) {
  const displayName = formatRoadmapDisplayName(username)
  const title = pageTitle ?? `Welcome back, ${displayName}!`
  const description = pageDescription ?? undefined

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <RoadmapSidebar
        activePage={activePage}
        username={username}
        workspaceName={workspaceName}
        profileRole={profileRole}
        profilePicture={profilePicture}
        onLogout={onLogout}
        onAccount={onAccount}
        isGuest={isGuest}
      />

      <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center border-b border-slate-200 bg-white px-4 pb-2 pt-1 lg:hidden">
          <RoadmapBrandLogo className="h-24 w-auto max-w-[14rem]" />
        </div>

        <header className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            ) : !pageTitle ? (
              <LiveClock />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isGuest && (
              <>
                <button
                  type="button"
                  aria-label="Search"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </>
            )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-20 lg:pb-6">{children}</main>
        <RoadmapMobileNav activePage={activePage} />
      </div>
    </div>
  )
}
