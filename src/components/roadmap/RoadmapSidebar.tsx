import {
  BarChart3,
  Calendar,
  ChevronDown,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useRoadmapAuth } from '../../context/RoadmapAuthContext'
import {
  formatRoadmapDisplayName,
  ROADMAP_LOGO_SRC,
} from '../../lib/roadmap/roadmapDisplay'
import RoadmapProfileAvatar from './RoadmapProfileAvatar'

export type RoadmapNavPage =
  | 'dashboard'
  | 'roadmap'
  | 'tasks'
  | 'calendar'
  | 'projects'
  | 'reports'
  | 'team'
  | 'messages'
  | 'file-manager'
  | 'dreamboard'
  | 'systems'
  | 'account'

const navItems: { id: RoadmapNavPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'file-manager', label: 'File Manager', icon: FolderOpen },
  { id: 'dreamboard', label: 'Dreamboard', icon: Lightbulb },
]

function ProfileMenu({
  username,
  displayName,
  role,
  profilePicture,
  onAccount,
  onLogout,
}: {
  username: string
  displayName: string
  role: string
  profilePicture?: string
  onAccount: () => void
  onLogout: () => void
}) {
  const { profile } = useRoadmapAuth()
  const [open, setOpen] = useState(false)

  const workspaceLabel = profile?.workspaceName?.trim() || 'Workspace name'

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 pb-1">
          <div
            role="menu"
            className="overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onAccount()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <User className="h-4 w-4 shrink-0 text-slate-500" />
              Account
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate-500" />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 p-3">
        <div className="flex items-start gap-3">
          <RoadmapProfileAvatar username={username} profilePicture={profilePicture} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
            {role ? <p className="truncate text-[11px] text-slate-500">{role}</p> : null}
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{workspaceLabel}</p>
          </div>
          <ChevronDown
            aria-hidden
            className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </div>
  )
}

export function RoadmapBrandLogo({ className = 'h-[12rem] w-full' }: { className?: string }) {
  return (
    <img
      src={ROADMAP_LOGO_SRC}
      alt="Over Drive"
      className={`w-auto max-w-full object-contain object-left ${className}`}
    />
  )
}

export default function RoadmapSidebar({
  activePage = 'dashboard',
  username,
  workspaceName: _workspaceName,
  profilePicture,
  profileRole = "",
  onLogout,
  onAccount,
  isGuest = false,
}: {
  activePage?: RoadmapNavPage
  username: string
  workspaceName: string
  profileRole?: string
  profilePicture?: string
  onLogout: () => void
  onAccount?: () => void
  isGuest?: boolean
}) {
  const displayName = formatRoadmapDisplayName(username)

  return (
    <aside className="scrollbar-hidden hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 pb-5 pt-0 lg:flex">
      <div className="-mt-3 mb-2 flex w-full justify-start bg-white px-0">
        <RoadmapBrandLogo />
      </div>

      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          return (
            <button
              key={id}
              type="button"
              disabled={isGuest}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isGuest
                  ? 'cursor-default text-slate-400'
                  : active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </button>
          )
        })}

        <div className="mt-8 border-t border-slate-100 pt-6">
          {isGuest ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center">
              <User className="mx-auto h-5 w-5 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Sign in required</p>
              <p className="mt-1 text-xs text-slate-500">Create a profile or sign in to access your workspace.</p>
            </div>
          ) : (
            <ProfileMenu
              username={username}
              displayName={displayName}
              role={profileRole}
              profilePicture={profilePicture}
              onAccount={() => onAccount?.()}
              onLogout={onLogout}
            />
          )}
          <button
            type="button"
            disabled={isGuest}
            className="group relative mt-5 flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-sky-200/80 bg-gradient-to-br from-sky-100 via-blue-100 to-sky-50 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-sky-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/70 hover:shadow-md hover:shadow-sky-300/40 disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Sparkles className="relative h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span className="relative">Systems</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}

export const mobileNavItems = [
  { id: 'dashboard' as const, label: 'Home', icon: LayoutDashboard },
  { id: 'roadmap' as const, label: 'Roadmap', icon: Map },
  { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
  { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
  { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
]

export function RoadmapMobileNav({ activePage = 'dashboard' }: { activePage?: RoadmapNavPage }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
      {mobileNavItems.map(({ id, label, icon: Icon }) => {
        const active = activePage === id
        return (
          <button
            key={id}
            type="button"
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 ${
              active ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
