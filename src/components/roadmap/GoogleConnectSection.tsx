import { useState, type ReactNode } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import AccountSection, { AccountFeedback } from './AccountSection'
import GoogleIcon from './GoogleIcon'
import { AppleIcon, DiscordIcon, SlackIcon } from './ProviderIcons'
import { isGoogleConnectConfigured } from '../../config/google'
import { useRoadmapAuth } from '../../context/RoadmapAuthContext'
import { fetchGoogleUserInfo } from '../../lib/roadmap/googleAuth'
import type { RoadmapGoogleAccount, RoadmapSocialAccount, RoadmapSocialProvider } from '../../data/roadmapProfileStorage'

const compactSecondaryButtonClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function GoogleConnectActions({
  googleAccount,
  onMessage,
  onError,
}: {
  googleAccount?: RoadmapGoogleAccount
  onMessage: (message: string) => void
  onError: (message: string) => void
}) {
  const { connectGoogle, disconnectGoogle } = useRoadmapAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  const googleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setIsConnecting(true)
      onMessage('')
      onError('')

      try {
        const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token)
        const result = connectGoogle(userInfo)
        if (!result.ok) {
          onError(result.error)
          return
        }

        onMessage('Google account connected.')
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not connect Google account.')
      } finally {
        setIsConnecting(false)
      }
    },
    onError: () => {
      onError('Google sign-in was cancelled or failed.')
      setIsConnecting(false)
    },
  })

  const handleDisconnect = () => {
    onMessage('')
    onError('')

    const confirmed = window.confirm('Disconnect your Google account from this profile?')
    if (!confirmed) return

    const result = disconnectGoogle()
    if (!result.ok) {
      onError(result.error)
      return
    }

    onMessage('Google account disconnected.')
  }

  if (googleAccount) {
    return (
      <button type="button" onClick={handleDisconnect} className={compactSecondaryButtonClassName}>
        Disconnect
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        onMessage('')
        onError('')
        setIsConnecting(true)
        googleLogin()
      }}
      disabled={isConnecting}
      className={`${compactSecondaryButtonClassName} shadow-sm`}
    >
      <GoogleIcon />
      {isConnecting ? 'Connecting…' : 'Connect'}
    </button>
  )
}

function SocialConnectActions({
  provider,
  account,
  onConnect,
  onDisconnect,
}: {
  provider: RoadmapSocialProvider
  account?: RoadmapSocialAccount
  onConnect: () => void
  onDisconnect: () => void
}) {
  if (account) {
    return (
      <button type="button" onClick={onDisconnect} className={compactSecondaryButtonClassName}>
        Disconnect
      </button>
    )
  }

  return (
    <button type="button" onClick={onConnect} className={`${compactSecondaryButtonClassName} shadow-sm`}>
      {provider === 'apple' && <AppleIcon className="h-4 w-4 text-slate-900" />}
      {provider === 'slack' && <SlackIcon className="h-4 w-4" />}
      {provider === 'discord' && <DiscordIcon className="h-4 w-4" />}
      Connect
    </button>
  )
}

function ProviderRow({
  icon,
  name,
  account,
  action,
}: {
  icon: ReactNode
  name: string
  account?: { label: string; detail?: string; connectedAt: string }
  action: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-2 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          {account ? (
            <>
              <p className="truncate text-sm font-medium leading-tight text-slate-900">{account.label}</p>
              <p className="truncate text-[11px] leading-snug text-slate-500">
                {account.detail ?? name}
                <span className="text-emerald-600"> · Connected {formatDate(account.connectedAt)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium leading-tight text-slate-900">{name}</p>
              <p className="text-[11px] leading-snug text-slate-500">Not connected</p>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 sm:pl-3">{action}</div>
    </div>
  )
}

export default function GoogleConnectSection() {
  const { profile, connectSocial, disconnectSocial } = useRoadmapAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!profile) return null

  const googleAccount = profile.googleAccount

  const handleSocialConnect = (provider: RoadmapSocialProvider) => {
    setMessage('')
    setError('')

    let label = ''
    let detail: string | undefined

    if (provider === 'apple') {
      const confirmed = window.confirm('Connect your Apple ID to this profile?')
      if (!confirmed) return
      label = profile.username
      detail = 'Apple ID'
    }

    if (provider === 'slack') {
      const workspace = window.prompt('Enter your Slack workspace name:', profile.workspaceName)?.trim()
      if (workspace === null) return
      if (!workspace) {
        setError('A Slack workspace name is required.')
        return
      }
      label = workspace
      detail = 'Slack workspace'
    }

    if (provider === 'discord') {
      const username = window.prompt('Enter your Discord username:')?.trim()
      if (username === null) return
      if (!username) {
        setError('A Discord username is required.')
        return
      }
      label = username.startsWith('@') ? username : `@${username}`
      detail = 'Discord'
    }

    const result = connectSocial(provider, { label, detail })
    if (!result.ok) {
      setError(result.error)
      return
    }

    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)
    setMessage(`${providerLabel} account connected.`)
  }

  const handleSocialDisconnect = (provider: RoadmapSocialProvider) => {
    setMessage('')
    setError('')

    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)
    const confirmed = window.confirm(`Disconnect your ${providerLabel} account from this profile?`)
    if (!confirmed) return

    const result = disconnectSocial(provider)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setMessage(`${providerLabel} account disconnected.`)
  }

  return (
    <AccountSection
      variant="nested"
      title="Connected accounts"
      description="Link accounts for faster sign-in, notifications, and integrations."
      className="h-full !p-4 sm:!p-4 [&>div:first-child]:mb-3"
    >
      <div className="flex h-full flex-col gap-2">
        <ProviderRow
          name="Google"
          account={
            googleAccount
              ? {
                  label: googleAccount.name,
                  detail: googleAccount.email,
                  connectedAt: googleAccount.connectedAt,
                }
              : undefined
          }
          icon={
            googleAccount?.picture ? (
              <img
                src={googleAccount.picture}
                alt={googleAccount.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )
          }
          action={
            isGoogleConnectConfigured ? (
              <GoogleConnectActions
                googleAccount={googleAccount}
                onMessage={setMessage}
                onError={setError}
              />
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400"
              >
                <GoogleIcon />
                Connect
              </button>
            )
          }
        />

        <ProviderRow
          name="Apple"
          account={profile.appleAccount}
          icon={<AppleIcon className="h-5 w-5 text-slate-900" />}
          action={
            <SocialConnectActions
              provider="apple"
              account={profile.appleAccount}
              onConnect={() => handleSocialConnect('apple')}
              onDisconnect={() => handleSocialDisconnect('apple')}
            />
          }
        />

        <ProviderRow
          name="Slack"
          account={profile.slackAccount}
          icon={<SlackIcon className="h-5 w-5" />}
          action={
            <SocialConnectActions
              provider="slack"
              account={profile.slackAccount}
              onConnect={() => handleSocialConnect('slack')}
              onDisconnect={() => handleSocialDisconnect('slack')}
            />
          }
        />

        <ProviderRow
          name="Discord"
          account={profile.discordAccount}
          icon={<DiscordIcon className="h-5 w-5" />}
          action={
            <SocialConnectActions
              provider="discord"
              account={profile.discordAccount}
              onConnect={() => handleSocialConnect('discord')}
              onDisconnect={() => handleSocialDisconnect('discord')}
            />
          }
        />

        {error && <AccountFeedback type="error">{error}</AccountFeedback>}
        {message && <AccountFeedback type="success">{message}</AccountFeedback>}
      </div>
    </AccountSection>
  )
}
