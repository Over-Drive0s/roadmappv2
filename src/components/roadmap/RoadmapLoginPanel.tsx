import type { FormEvent } from 'react'

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'

export default function RoadmapLoginPanel({
  mode,
  onSwitchMode,
  error,
  username,
  password,
  confirmPassword,
  workspaceName,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onWorkspaceNameChange,
  onSignIn,
  onCreateAccount,
  onGuestLogin,
  embedded = false,
}: {
  mode: 'sign-in' | 'create'
  onSwitchMode: (mode: 'sign-in' | 'create') => void
  error: string
  username: string
  password: string
  confirmPassword: string
  workspaceName: string
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onWorkspaceNameChange: (value: string) => void
  onSignIn: (event: FormEvent) => void
  onCreateAccount: (event: FormEvent) => void
  onGuestLogin: () => void
  embedded?: boolean
}) {
  const content = (
    <>
      <div className={embedded ? 'mb-6' : 'mb-6'}>
        {!embedded && (
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Over Drive OS</p>
        )}
        <h1 className={`font-bold tracking-tight text-slate-900 ${embedded ? 'text-lg' : 'mt-1 text-xl sm:text-2xl'}`}>
          {mode === 'sign-in' ? 'Sign in to your workspace' : 'Create your profile'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'sign-in'
            ? 'Enter your credentials to open the dashboard.'
            : 'Set up a local profile to start planning and tracking.'}
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        {(['sign-in', 'create'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSwitchMode(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === tab
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'sign-in' ? 'Sign in' : 'Create profile'}
          </button>
        ))}
      </div>

      {mode === 'sign-in' ? (
        <form onSubmit={onSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="roadmap-username"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Username
            </label>
            <input
              id="roadmap-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Enter username"
              className={inputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="roadmap-password"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Password
            </label>
            <input
              id="roadmap-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter password"
              className={inputClassName}
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Open dashboard
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGuestLogin}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700"
          >
            Continue as guest
          </button>
          <p className="text-center text-xs text-slate-500">
            Explore the dashboard without creating an account. Guest data is temporary.
          </p>
        </form>
      ) : (
        <form onSubmit={onCreateAccount} className="space-y-4">
          <div>
            <label
              htmlFor="roadmap-create-username"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Username
            </label>
            <input
              id="roadmap-create-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Choose username"
              className={inputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="roadmap-workspace"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Workspace name
            </label>
            <input
              id="roadmap-workspace"
              type="text"
              value={workspaceName}
              onChange={(event) => onWorkspaceNameChange(event.target.value)}
              placeholder="e.g. Q3 Systems Roadmap"
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">Saved locally on this device.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="roadmap-create-password"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Password
              </label>
              <input
                id="roadmap-create-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="roadmap-confirm-password"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Confirm
              </label>
              <input
                id="roadmap-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Create account
          </button>
        </form>
      )}
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {content}
    </div>
  )
}
