import type { ReactNode } from 'react'

export default function AccountSection({
  title,
  description,
  children,
  variant = 'default',
  className = '',
}: {
  title: string
  description?: string
  children: ReactNode
  variant?: 'default' | 'nested' | 'danger'
  className?: string
}) {
  const styles =
    variant === 'danger'
      ? 'border-red-200 bg-red-50/40'
      : variant === 'nested'
        ? 'border-slate-100 bg-slate-50/70 shadow-none'
        : 'border-slate-200 bg-white'

  const shadow = variant === 'nested' ? '' : 'shadow-sm'

  return (
    <section className={`rounded-xl border p-5 sm:p-6 ${shadow} ${styles} ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          <h2
            className={`text-base font-semibold ${variant === 'danger' ? 'text-red-900' : 'text-slate-900'}`}
          >
            {title}
          </h2>
          {description && (
            <p className={`mt-1 text-sm ${variant === 'danger' ? 'text-red-700/80' : 'text-slate-500'}`}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

export function AccountFeedback({
  type,
  children,
}: {
  type: 'error' | 'success'
  children: ReactNode
}) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>{children}</p>
  )
}

export const accountSelectClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'

export const accountInputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'

export const accountLabelClassName = 'mb-1.5 block text-xs font-semibold text-slate-600'

export const accountButtonClassName =
  'inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'

export const accountSecondaryButtonClassName =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
