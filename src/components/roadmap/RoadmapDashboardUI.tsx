import {
  CheckCircle2,
  Circle,
  FolderOpen,
  LayoutGrid,
  ListTodo,
  Plus,
  Upload,
} from 'lucide-react'
import type { ReactNode } from 'react'

const phases = [
  { id: 'P1', label: 'Phase 1', name: 'Foundation', progress: 0, color: '#4f46e5' },
  { id: 'P2', label: 'Phase 2', name: 'Core Features', progress: 0, color: '#2563eb' },
  { id: 'P3', label: 'Phase 3', name: 'Integrations', progress: 0, color: '#7c3aed' },
  { id: 'P4', label: 'Phase 4', name: 'Scale & Optimize', progress: 0, color: '#0d9488' },
]

const widgetHeight = 'h-[248px] max-h-[248px]'

function Widget({
  title,
  subtitle,
  accent = 'indigo',
  children,
  className = '',
  scrollable = true,
}: {
  title: string
  subtitle?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'violet' | 'sky'
  children: ReactNode
  className?: string
  scrollable?: boolean
}) {
  const barClass = {
    indigo: 'from-indigo-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    violet: 'from-violet-500 to-purple-500',
    sky: 'from-sky-500 to-blue-500',
  }

  return (
    <section
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-lg ${widgetHeight} ${className}`}
    >
      <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${barClass[accent]}`} />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className={`min-h-0 flex-1 ${scrollable ? 'dashboard-widget-scroll overflow-y-auto' : ''}`}>
          {children}
        </div>
      </div>
    </section>
  )
}

function RoadmapSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Roadmap</h3>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
        >
          View Full Roadmap
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((phase) => (
          <div key={phase.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {phase.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{phase.name}</p>
              </div>
              <span className="text-xs font-bold tabular-nums text-slate-600">{phase.progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${phase.progress}%`, backgroundColor: phase.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        No active projects on the roadmap. Completed projects are in the Projects archive.
      </p>
    </section>
  )
}

export default function RoadmapDashboardUI({ showBlankHero = true }: { showBlankHero?: boolean }) {
  const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1)

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      {showBlankHero && (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Blank workspace
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Your dashboard is ready
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                No demo projects, tasks, or calendar events — start fresh by creating your first
                project, then add tasks and milestones as you go.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create first project
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ListTodo className="h-4 w-4" />
                Add a task
              </button>
            </div>
          </div>
        </div>
      )}

      <RoadmapSection />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:auto-rows-[248px]">
        <Widget title="Overall Progress" subtitle="Add a project to begin" accent="indigo">
          <div className="space-y-2.5 pb-1">
            <div className="flex gap-3">
              <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-slate-100">
                <span className="text-xl font-bold tabular-nums text-slate-900">
                  0<span className="text-sm font-semibold text-slate-400">%</span>
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <span className="mb-0.5 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 ring-inset">
                  No active projects
                </span>
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-center text-[9px] font-bold text-slate-500">
                      {phase.id.replace('P', 'P')}
                    </span>
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${phase.progress}%`, backgroundColor: phase.color }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[9px] font-bold tabular-nums text-slate-600">
                      {phase.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Tasks', value: '0%', sub: '0/0 done', tone: 'indigo' },
                { label: 'Phases', value: '0%', sub: '0/0 complete', tone: 'violet' },
                { label: 'Elapsed', value: '00:00', sub: 'Portfolio time', tone: 'slate' },
                { label: 'On track', value: '0/0', sub: '0 at risk · 0 hold', tone: 'emerald' },
              ].map(({ label, value, sub, tone }) => (
                <div
                  key={label}
                  className={`rounded-lg px-2 py-1.5 ring-1 ring-inset ${
                    tone === 'indigo'
                      ? 'bg-indigo-50/80 ring-indigo-100'
                      : tone === 'violet'
                        ? 'bg-violet-50/80 ring-violet-100'
                        : tone === 'emerald'
                          ? 'bg-emerald-50/80 ring-emerald-100'
                          : 'bg-slate-50 ring-slate-100'
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{value}</p>
                  <p className="text-[9px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </Widget>

        <Widget title="Projects" subtitle="0 active in portfolio" accent="emerald">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total', value: '0', icon: LayoutGrid },
              { label: 'On Track', value: '0', icon: CheckCircle2 },
              { label: 'At Risk', value: '0', icon: Circle },
              { label: 'On Hold', value: '0', icon: FolderOpen },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">No projects on hold</p>
        </Widget>

        <Widget title="Team Workload" subtitle="Synced from tasks and project jobs" accent="violet">
          <p className="text-sm font-semibold text-slate-700">No workload yet</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Assign tasks or add project jobs to track team capacity
          </p>
        </Widget>

        <Widget title="Upcoming Milestones" subtitle="Calendar events and project dates" accent="amber">
          <p className="text-sm font-semibold text-slate-700">No upcoming milestones</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Add events on the calendar or set phase dates on projects
          </p>
        </Widget>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:auto-rows-[248px]">
        <div className={`${widgetHeight} min-h-0 overflow-hidden lg:col-start-1 lg:row-start-1`}>
          <Widget title="My Tasks" accent="indigo" scrollable={false} className="h-full max-h-none">
            <div className="mb-3 flex flex-wrap gap-2">
              {['All 0', 'To Do 0', 'In Progress 0', 'Completed 0'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <span>Task</span>
              <span>Project</span>
              <span>Due Date</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">No tasks yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Add a task assigned to you, or create one from a project
            </p>
          </Widget>
        </div>

        <div className={`${widgetHeight} min-h-0 overflow-hidden lg:col-start-1 lg:row-start-2`}>
          <Widget
            title="Portfolio file bin"
            subtitle="Upload documents to your portfolio"
            accent="sky"
            scrollable={false}
            className="h-full max-h-none"
          >
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
              <Upload className="mx-auto h-5 w-5 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-800">Upload files</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Drag & drop or click to attach · up to 8 files · 5 MB max each
              </p>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open File Manager
            </button>
          </Widget>
        </div>

        <div
          className={`${widgetHeight} min-h-0 overflow-hidden lg:col-span-2 lg:row-span-2 lg:col-start-2 lg:row-start-1 lg:h-auto lg:max-h-none`}
        >
          <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-indigo-500 to-blue-500" />
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">May 2026</h3>
                <button
                  type="button"
                  className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  Jump to today
                </button>
              </div>
              <div className="grid flex-1 grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day) => (
                  <div
                    key={day}
                    className={`rounded-md py-2 text-xs ${
                      day === 28
                        ? 'bg-indigo-600 font-semibold text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
