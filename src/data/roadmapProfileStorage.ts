import { ADMIN_PASSWORD, ADMIN_USERNAME } from '../config/admin'
import { formatRoadmapDisplayName } from '../lib/roadmap/roadmapDisplay'

export interface RoadmapGoogleAccount {
  sub: string
  email: string
  name: string
  picture?: string
  connectedAt: string
}

export type RoadmapSocialProvider = 'apple' | 'slack' | 'discord'

export interface RoadmapSocialAccount {
  id: string
  label: string
  detail?: string
  connectedAt: string
}

export interface RoadmapProfile {
  id: string
  username: string
  password: string
  workspaceName: string
  fullName?: string
  role?: string
  email?: string
  phoneNumber?: string
  timezone?: string
  profilePicture?: string
  googleAccount?: RoadmapGoogleAccount
  appleAccount?: RoadmapSocialAccount
  slackAccount?: RoadmapSocialAccount
  discordAccount?: RoadmapSocialAccount
  createdAt: string
  lastLoginAt: string
}

const PROFILES_KEY = 'overdrive-roadmap-profiles'
const SESSION_KEY = 'overdrive-roadmap-session'
const GUEST_PROFILE_KEY = 'overdrive-roadmap-guest-profile'
export const GUEST_SESSION_PREFIX = 'guest-'

function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function readProfiles(): RoadmapProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RoadmapProfile[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeProfiles(profiles: RoadmapProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

function createId() {
  return crypto.randomUUID?.() ?? `roadmap-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function buildDefaultProfileEmail(username: string) {
  return `${username.trim().toLowerCase()}@overdrive.os`
}

function isValidProfileEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function getRoadmapProfileEmail(
  profile: Pick<RoadmapProfile, 'email' | 'username' | 'googleAccount'>,
) {
  if (profile.email?.trim()) return profile.email.trim().toLowerCase()
  if (profile.googleAccount?.email?.trim()) {
    return profile.googleAccount.email.trim().toLowerCase()
  }
  return buildDefaultProfileEmail(profile.username)
}

export function getRoadmapProfileFullName(
  profile: Pick<RoadmapProfile, 'fullName' | 'username'>,
  options?: { fallbackToUsername?: boolean },
) {
  const trimmed = profile.fullName?.trim()
  if (trimmed) return trimmed
  if (options?.fallbackToUsername !== false) {
    return formatRoadmapDisplayName(profile.username)
  }
  return ''
}

export function getRoadmapProfileRole(profile: Pick<RoadmapProfile, 'role'>) {
  return profile.role?.trim() ?? ''
}

export function isGuestSessionId(sessionId: string | null | undefined): boolean {
  return Boolean(sessionId?.startsWith(GUEST_SESSION_PREFIX))
}

export function isGuestProfile(profile: Pick<RoadmapProfile, 'id'> | null | undefined): boolean {
  return isGuestSessionId(profile?.id ?? null)
}

function readGuestProfile(): RoadmapProfile | null {
  try {
    const raw = sessionStorage.getItem(GUEST_PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RoadmapProfile
  } catch {
    return null
  }
}

function writeGuestProfile(profile: RoadmapProfile) {
  sessionStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile))
}

export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_PROFILE_KEY)
}

export function createGuestProfile(): RoadmapProfile {
  const now = new Date().toISOString()
  return {
    id: `${GUEST_SESSION_PREFIX}${createId()}`,
    username: 'Guest',
    password: '',
    workspaceName: 'Guest Workspace',
    fullName: 'Guest',
    role: 'Viewer',
    email: 'guest@overdrive.os',
    timezone: getDefaultTimezone(),
    createdAt: now,
    lastLoginAt: now,
  }
}

export function loginGuest(): RoadmapProfile {
  const profile = createGuestProfile()
  writeGuestProfile(profile)
  setRoadmapSessionId(profile.id)
  return profile
}

export function getRoadmapProfiles(): RoadmapProfile[] {
  return readProfiles()
}

export function findRoadmapProfileByUsername(username: string): RoadmapProfile | undefined {
  const normalized = username.trim().toLowerCase()
  return readProfiles().find((profile) => profile.username.toLowerCase() === normalized)
}

export function createRoadmapProfile(input: {
  username: string
  password: string
  workspaceName: string
}): { profile: RoadmapProfile } | { error: string } {
  const username = input.username.trim()
  const password = input.password.trim()
  const workspaceName = input.workspaceName.trim()

  if (!username) return { error: 'Username is required.' }
  if (username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }
  if (!workspaceName) return { error: 'Workspace name is required.' }
  if (findRoadmapProfileByUsername(username)) return { error: 'That username is already taken.' }

  const now = new Date().toISOString()
  const profile: RoadmapProfile = {
    id: createId(),
    username,
    password,
    workspaceName,
    email: buildDefaultProfileEmail(username),
    timezone: getDefaultTimezone(),
    createdAt: now,
    lastLoginAt: now,
  }

  writeProfiles([...readProfiles(), profile])
  return { profile }
}

export function authenticateRoadmapProfile(username: string, password: string): RoadmapProfile | null {
  const profile = findRoadmapProfileByUsername(username)
  if (!profile || profile.password !== password.trim()) return null

  const updated: RoadmapProfile = {
    ...profile,
    lastLoginAt: new Date().toISOString(),
  }

  writeProfiles(readProfiles().map((item) => (item.id === profile.id ? updated : item)))
  return updated
}

export function loginRoadmapAdmin(username: string, password: string): RoadmapProfile | null {
  const normalized = username.trim().toLowerCase()
  if (normalized !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return null

  let profile = findRoadmapProfileByUsername(ADMIN_USERNAME)
  if (!profile) {
    const created = createRoadmapProfile({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      workspaceName: 'Admin Workspace',
    })
    if ('error' in created) {
      profile = findRoadmapProfileByUsername(ADMIN_USERNAME)
      if (!profile) return null
    } else {
      profile = created.profile
    }
  }

  const updated: RoadmapProfile = {
    ...profile,
    lastLoginAt: new Date().toISOString(),
  }

  writeProfiles(readProfiles().map((item) => (item.id === profile!.id ? updated : item)))
  setRoadmapSessionId(updated.id)
  return updated
}

export function getRoadmapSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY)
}

export function setRoadmapSessionId(profileId: string | null) {
  if (profileId) {
    sessionStorage.setItem(SESSION_KEY, profileId)
  } else {
    sessionStorage.removeItem(SESSION_KEY)
    clearGuestSession()
  }
}

export function getActiveRoadmapProfile(): RoadmapProfile | null {
  const sessionId = getRoadmapSessionId()
  if (!sessionId) return null
  if (isGuestSessionId(sessionId)) {
    const guest = readGuestProfile()
    if (guest?.id === sessionId) return guest
    return null
  }
  return readProfiles().find((profile) => profile.id === sessionId) ?? null
}

export function updateRoadmapProfile(
  profileId: string,
  updates: {
    username?: string
    workspaceName?: string
    fullName?: string | null
    role?: string | null
    email?: string | null
    phoneNumber?: string | null
    timezone?: string
    profilePicture?: string | null
  },
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const current = profiles[index]
  const username = updates.username !== undefined ? updates.username.trim() : current.username
  const workspaceName =
    updates.workspaceName !== undefined ? updates.workspaceName.trim() : current.workspaceName
  const timezone =
    updates.timezone !== undefined ? updates.timezone.trim() : current.timezone ?? getDefaultTimezone()

  if (!username) return { error: 'Username is required.' }
  if (username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (!workspaceName) return { error: 'Workspace name is required.' }
  if (!timezone) return { error: 'Time zone is required.' }

  const duplicate = profiles.find(
    (profile) => profile.id !== profileId && profile.username.toLowerCase() === username.toLowerCase(),
  )
  if (duplicate) return { error: 'That username is already taken.' }

  const updated: RoadmapProfile = { ...current, username, workspaceName, timezone }

  if (updates.fullName !== undefined) {
    const fullName = updates.fullName?.trim() ?? ''
    if (!fullName) {
      delete updated.fullName
    } else {
      updated.fullName = fullName
    }
  }

  if (updates.role !== undefined) {
    const role = updates.role?.trim() ?? ''
    if (!role) {
      delete updated.role
    } else {
      updated.role = role
    }
  }

  if (updates.email !== undefined) {
    const email = updates.email?.trim().toLowerCase() ?? ''
    if (!email) return { error: 'Email is required.' }
    if (!isValidProfileEmail(email)) return { error: 'Enter a valid email address.' }
    updated.email = email
  }

  if (updates.phoneNumber !== undefined) {
    const phoneNumber = updates.phoneNumber?.trim() ?? ''
    if (!phoneNumber) {
      delete updated.phoneNumber
    } else {
      updated.phoneNumber = phoneNumber
    }
  }

  if (updates.profilePicture !== undefined) {
    if (updates.profilePicture === null) {
      delete updated.profilePicture
    } else {
      updated.profilePicture = updates.profilePicture
    }
  }

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

export function changeRoadmapPassword(
  profileId: string,
  currentPassword: string,
  newPassword: string,
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const current = profiles[index]
  if (current.password !== currentPassword.trim()) {
    return { error: 'Current password is incorrect.' }
  }

  const password = newPassword.trim()
  if (!password) return { error: 'New password is required.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }

  const updated: RoadmapProfile = { ...current, password }
  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

export function deleteRoadmapProfile(profileId: string, password: string): { ok: true } | { error: string } {
  const profiles = readProfiles()
  const profile = profiles.find((item) => item.id === profileId)
  if (!profile) return { error: 'Profile not found.' }
  if (profile.password !== password.trim()) return { error: 'Password is incorrect.' }

  writeProfiles(profiles.filter((item) => item.id !== profileId))
  return { ok: true }
}

export function adminUpdateRoadmapProfile(
  profileId: string,
  updates: {
    username?: string
    password?: string
    workspaceName?: string
  },
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const current = profiles[index]
  const username = updates.username !== undefined ? updates.username.trim() : current.username
  const workspaceName =
    updates.workspaceName !== undefined ? updates.workspaceName.trim() : current.workspaceName
  const password =
    updates.password !== undefined ? updates.password.trim() : current.password

  if (!username) return { error: 'Username is required.' }
  if (username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }
  if (!workspaceName) return { error: 'Workspace name is required.' }

  const duplicate = profiles.find(
    (profile) => profile.id !== profileId && profile.username.toLowerCase() === username.toLowerCase(),
  )
  if (duplicate) return { error: 'That username is already taken.' }

  const updated: RoadmapProfile = {
    ...current,
    username,
    password,
    workspaceName,
  }

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

export function adminDeleteRoadmapProfile(profileId: string): { ok: true } | { error: string } {
  const profiles = readProfiles()
  if (!profiles.some((profile) => profile.id === profileId)) {
    return { error: 'Profile not found.' }
  }

  writeProfiles(profiles.filter((profile) => profile.id !== profileId))
  return { ok: true }
}

export function connectRoadmapGoogleAccount(
  profileId: string,
  account: { sub: string; email: string; name: string; picture?: string },
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const duplicate = profiles.find(
    (profile) => profile.id !== profileId && profile.googleAccount?.sub === account.sub,
  )
  if (duplicate) {
    return { error: 'This Google account is already linked to another profile on this device.' }
  }

  const updated: RoadmapProfile = {
    ...profiles[index],
    googleAccount: {
      ...account,
      connectedAt: new Date().toISOString(),
    },
  }

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

export function disconnectRoadmapGoogleAccount(
  profileId: string,
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const current = profiles[index]
  if (!current.googleAccount) return { error: 'No Google account is connected.' }

  const updated: RoadmapProfile = { ...current }
  delete updated.googleAccount

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

const SOCIAL_ACCOUNT_KEYS: Record<
  RoadmapSocialProvider,
  'appleAccount' | 'slackAccount' | 'discordAccount'
> = {
  apple: 'appleAccount',
  slack: 'slackAccount',
  discord: 'discordAccount',
}

export function connectRoadmapSocialAccount(
  profileId: string,
  provider: RoadmapSocialProvider,
  account: { label: string; detail?: string },
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const label = account.label.trim()
  if (!label) return { error: 'A display name is required to connect this account.' }

  const key = SOCIAL_ACCOUNT_KEYS[provider]
  const updated: RoadmapProfile = {
    ...profiles[index],
    [key]: {
      id: `${provider}-${Date.now()}`,
      label,
      detail: account.detail?.trim() || undefined,
      connectedAt: new Date().toISOString(),
    },
  }

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}

export function disconnectRoadmapSocialAccount(
  profileId: string,
  provider: RoadmapSocialProvider,
): { profile: RoadmapProfile } | { error: string } {
  const profiles = readProfiles()
  const index = profiles.findIndex((profile) => profile.id === profileId)
  if (index === -1) return { error: 'Profile not found.' }

  const key = SOCIAL_ACCOUNT_KEYS[provider]
  const current = profiles[index]
  if (!current[key]) return { error: 'This account is not connected.' }

  const updated: RoadmapProfile = { ...current }
  delete updated[key]

  profiles[index] = updated
  writeProfiles(profiles)
  return { profile: updated }
}
