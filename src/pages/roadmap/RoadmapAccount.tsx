import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { User } from 'lucide-react'
import { reloadToHashRoute } from '../../lib/reloadToHashRoute'
import { cleanupDeletedRoadmapProfile } from '../../lib/profileDeletionCleanup'
import AccountSection, {
  AccountFeedback,
  accountButtonClassName,
  accountInputClassName,
  accountLabelClassName,
  accountSecondaryButtonClassName,
  accountSelectClassName,
} from '../../components/roadmap/AccountSection'
import GoogleConnectSection from '../../components/roadmap/GoogleConnectSection'
import RoadmapProfileAvatar from '../../components/roadmap/RoadmapProfileAvatar'
import { useRoadmapAuth } from '../../context/RoadmapAuthContext'
import {
  getRoadmapProfileEmail,
  getRoadmapProfileFullName,
  getRoadmapProfiles,
} from '../../data/roadmapProfileStorage'
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  PHONE_INPUT_PLACEHOLDER,
} from '../../lib/roadmap/phoneFormat'
import {
  PROFILE_PICTURE_ACCEPT,
  readProfilePictureFile,
} from '../../lib/roadmap/roadmapDisplay'
import { getDefaultTimezone, getTimezoneGroups, getTimezoneOptions } from '../../lib/roadmap/timezones'

function normalizeUsernameInput(value: string) {
  return value.replace(/^@+/, '')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

export function RoadmapAccountContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile, updateProfile, changePassword, deleteAccount } = useRoadmapAuth()

  const [username, setUsername] = useState(profile?.username ?? '')
  const [workspaceName, setWorkspaceName] = useState(profile?.workspaceName ?? '')
  const [email, setEmail] = useState(() =>
    profile ? getRoadmapProfileEmail(profile) : '',
  )
  const [phoneNumber, setPhoneNumber] = useState(
    profile?.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : '',
  )
  const [timezone, setTimezone] = useState(profile?.timezone ?? getDefaultTimezone())
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [pictureMessage, setPictureMessage] = useState('')
  const [pictureError, setPictureError] = useState('')

  const timezoneGroups = useMemo(() => getTimezoneGroups(getTimezoneOptions()), [])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  if (!profile) {
    return null
  }

  const savedFullName = getRoadmapProfileFullName(profile, { fallbackToUsername: false })

  const handleProfileSave = (event: FormEvent) => {
    event.preventDefault()
    setProfileMessage('')
    setProfileError('')

    if (!isValidPhoneNumber(phoneNumber)) {
      setProfileError('Enter a valid phone number.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setProfileError('Email is required.')
      return
    }

    const formattedPhone = phoneNumber.trim() ? formatPhoneNumber(phoneNumber) : null

    const result = updateProfile({
      username,
      workspaceName,
      email: normalizedEmail,
      phoneNumber: formattedPhone,
      timezone,
    })
    if (!result.ok) {
      setProfileError(result.error)
      return
    }

    if (formattedPhone) {
      setPhoneNumber(formattedPhone)
    }

    setEmail(normalizedEmail)
    setProfileMessage('Profile updated.')
  }

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(event.target.value))
  }

  const handlePictureSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setPictureMessage('')
    setPictureError('')

    const readResult = await readProfilePictureFile(file)
    if ('error' in readResult) {
      setPictureError(readResult.error)
      return
    }

    const result = updateProfile({ profilePicture: readResult.dataUrl })
    if (!result.ok) {
      setPictureError(result.error)
      return
    }

    setPictureMessage('Profile picture updated.')
  }

  const handleRemovePicture = () => {
    setPictureMessage('')
    setPictureError('')

    const result = updateProfile({ profilePicture: null })
    if (!result.ok) {
      setPictureError(result.error)
      return
    }

    setPictureMessage('Profile picture removed.')
  }

  const handlePasswordSave = (event: FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    const result = changePassword({ currentPassword, newPassword, confirmPassword })
    if (!result.ok) {
      setPasswordError(result.error)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Password updated.')
  }

  const handleDeleteAccount = async (event: FormEvent) => {
    event.preventDefault()
    setDeleteError('')

    const confirmed = window.confirm(
      'Delete this profile permanently? This removes the account and all workspace data from this device.',
    )
    if (!confirmed) return

    const deletingProfileId = profile.id
    const result = deleteAccount(deletePassword)
    if (!result.ok) {
      setDeleteError(result.error)
      return
    }

    try {
      await cleanupDeletedRoadmapProfile(
        deletingProfileId,
        getRoadmapProfiles().map((item) => item.id),
      )
    } catch (err) {
      console.warn('Could not fully remove profile workspace data:', err)
    }

    reloadToHashRoute('/login')
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-indigo-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-base font-bold text-indigo-700 ring-1 ring-indigo-500/15">
              <User className="h-5 w-5" />
              Account
            </div>
            <p className="max-w-xl text-sm font-semibold text-slate-600">
              Manage your profile, workspace, and security settings.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-500" />
        <div className="space-y-6 p-5 sm:p-6 lg:p-8">
        <AccountSection
          variant="nested"
          title="Profile"
          description="Your identity and workspace details across Over Drive OS."
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6 lg:w-52 lg:shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <RoadmapProfileAvatar
                username={profile.username}
                profilePicture={profile.profilePicture}
                size="lg"
              />
              <div className="text-center lg:text-left">
                {savedFullName ? (
                  <p className="text-sm font-semibold text-slate-900">{savedFullName}</p>
                ) : (
                  <p className="text-sm font-semibold text-slate-900">@{profile.username}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={PROFILE_PICTURE_ACCEPT}
                className="hidden"
                onChange={handlePictureSelect}
              />
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${accountButtonClassName} w-full`}
                >
                  {profile.profilePicture ? 'Change photo' : 'Upload photo'}
                </button>
                {profile.profilePicture && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    className={`${accountSecondaryButtonClassName} w-full`}
                  >
                    Remove photo
                  </button>
                )}
              </div>
              {(pictureError || pictureMessage) && (
                <div className="w-full space-y-2">
                  {pictureError && <AccountFeedback type="error">{pictureError}</AccountFeedback>}
                  {pictureMessage && (
                    <AccountFeedback type="success">{pictureMessage}</AccountFeedback>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatItem label="Created" value={formatDate(profile.createdAt)} />
                <StatItem label="Last sign in" value={formatDate(profile.lastLoginAt)} />
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="account-username" className={accountLabelClassName}>
                      Username
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        @
                      </span>
                      <input
                        id="account-username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(normalizeUsernameInput(event.target.value))}
                        className={`${accountInputClassName} pl-8`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="account-workspace" className={accountLabelClassName}>
                      Workspace name
                    </label>
                    <input
                      id="account-workspace"
                      type="text"
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      className={accountInputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="account-email" className={accountLabelClassName}>
                      Email
                    </label>
                    <input
                      id="account-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@overdrive.os"
                      className={accountInputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="account-phone" className={accountLabelClassName}>
                      Phone number
                    </label>
                    <input
                      id="account-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={PHONE_INPUT_PLACEHOLDER}
                      className={accountInputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="account-timezone" className={accountLabelClassName}>
                      Time zone
                    </label>
                    <select
                      id="account-timezone"
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                      className={accountSelectClassName}
                    >
                      {timezoneGroups.map(([group, options]) => (
                        <optgroup key={group} label={group}>
                          {options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
                {profileError && <AccountFeedback type="error">{profileError}</AccountFeedback>}
                {profileMessage && (
                  <AccountFeedback type="success">{profileMessage}</AccountFeedback>
                )}
                <div className="flex justify-end">
                  <button type="submit" className={accountButtonClassName}>
                    Save profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AccountSection>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <GoogleConnectSection />

          <AccountSection variant="nested" title="Security" description="Update your sign-in password.">
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label htmlFor="account-current-password" className={accountLabelClassName}>
                  Current password
                </label>
                <input
                  id="account-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={accountInputClassName}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-new-password" className={accountLabelClassName}>
                    New password
                  </label>
                  <input
                    id="account-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={accountInputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="account-confirm-password" className={accountLabelClassName}>
                    Confirm new password
                  </label>
                  <input
                    id="account-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={accountInputClassName}
                  />
                </div>
              </div>
              {passwordError && <AccountFeedback type="error">{passwordError}</AccountFeedback>}
              {passwordMessage && (
                <AccountFeedback type="success">{passwordMessage}</AccountFeedback>
              )}
              <div className="flex justify-end">
                <button type="submit" className={accountButtonClassName}>
                  Change password
                </button>
              </div>
            </form>
          </AccountSection>
        </div>

        <AccountSection
          variant="danger"
          title="Delete account"
          description="Permanently remove this profile from local storage on this device."
        >
          <form onSubmit={handleDeleteAccount} className="space-y-4 sm:max-w-xl">
            <div>
              <label htmlFor="account-delete-password" className={accountLabelClassName}>
                Confirm with password
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="account-delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className={`${accountInputClassName} min-w-0 flex-1`}
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete profile
                </button>
              </div>
            </div>
            {deleteError && <AccountFeedback type="error">{deleteError}</AccountFeedback>}
          </form>
        </AccountSection>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapAccount() {
  return <RoadmapAccountContent />
}
