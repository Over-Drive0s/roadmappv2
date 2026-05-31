export interface TimezoneOption {
  value: string
  label: string
  group: string
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

function getSupportedTimeZones(): string[] {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[]
  }

  if (typeof intlWithSupportedValues.supportedValuesOf === 'function') {
    return intlWithSupportedValues.supportedValuesOf('timeZone')
  }

  return COMMON_TIMEZONES
}

function formatTimezoneLabel(timeZone: string) {
  const now = new Date()
  const offset =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value ?? ''

  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone
  return `${city} · ${offset}`
}

export function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

let cachedTimezoneOptions: TimezoneOption[] | undefined

export function getTimezoneOptions(): TimezoneOption[] {
  if (cachedTimezoneOptions) return cachedTimezoneOptions

  cachedTimezoneOptions = getSupportedTimeZones()
    .map((timeZone: string) => ({
      value: timeZone,
      label: formatTimezoneLabel(timeZone),
      group: timeZone.split('/')[0] ?? 'Other',
    }))
    .sort((a: TimezoneOption, b: TimezoneOption) => a.label.localeCompare(b.label))

  return cachedTimezoneOptions
}

export function getTimezoneGroups(options: TimezoneOption[]) {
  const groups = new Map<string, TimezoneOption[]>()

  for (const option of options) {
    const existing = groups.get(option.group) ?? []
    existing.push(option)
    groups.set(option.group, existing)
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}
