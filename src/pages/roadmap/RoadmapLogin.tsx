import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AdminLoginModal from '../../components/roadmap/AdminLoginModal'
import RoadmapLoginPanel from '../../components/roadmap/RoadmapLoginPanel'
import RoadmapPagePanel from '../../components/roadmap/RoadmapPagePanel'
import { useRoadmapAuth } from '../../context/RoadmapAuthContext'
import { LOGO_FULL_URL } from '../../lib/assetUrl'
import { reloadToHashRoute } from '../../lib/reloadToHashRoute'

type LoginMode = 'sign-in' | 'create'

type LoginLocationState = {
  from?: string
}

export default function RoadmapLogin() {
  const location = useLocation()
  const { login, loginAdmin, loginGuest, register, isAuthenticated } = useRoadmapAuth()

  const redirectTo =
    (location.state as LoginLocationState | null)?.from &&
    (location.state as LoginLocationState).from !== '/login'
      ? (location.state as LoginLocationState).from!
      : '/dashboard'

  const [mode, setMode] = useState<LoginMode>('sign-in')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminError, setAdminError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const resetForm = () => {
    setError('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setWorkspaceName('')
  }

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    resetForm()
  }

  const handleSignIn = (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const result = login(username, password)
    if (!result.ok) {
      setError(result.error)
      return
    }

    reloadToHashRoute(redirectTo)
  }

  const handleCreateAccount = (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const result = register({ username, password, workspaceName })
    if (!result.ok) {
      setError(result.error)
      return
    }

    reloadToHashRoute(redirectTo)
  }

  const handleGuestLogin = () => {
    setError('')
    loginGuest()
    reloadToHashRoute('/dashboard')
  }

  const handleAdminLogin = (adminUsername: string, adminPassword: string) => {
    setAdminError('')
    const result = loginAdmin(adminUsername, adminPassword)
    if (!result.ok) {
      setAdminError(result.error)
      return
    }

    setAdminOpen(false)
    reloadToHashRoute(redirectTo)
  }

  return (
    <div className="roadmap-login-screen flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="roadmap-login-screen__content flex w-full max-w-xl flex-col items-center">
      <img
        src={LOGO_FULL_URL}
        alt="Over Drive"
        className="-mb-3 h-auto w-full max-w-[220px] sm:max-w-[260px]"
        draggable={false}
      />

      <RoadmapPagePanel compact elevated>
        <RoadmapLoginPanel
          embedded
          mode={mode}
          onSwitchMode={switchMode}
          error={error}
          username={username}
          password={password}
          confirmPassword={confirmPassword}
          workspaceName={workspaceName}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onWorkspaceNameChange={setWorkspaceName}
          onSignIn={handleSignIn}
          onCreateAccount={handleCreateAccount}
          onGuestLogin={handleGuestLogin}
        />
      </RoadmapPagePanel>

      <button
        type="button"
        onClick={() => {
          setAdminError('')
          setAdminOpen(true)
        }}
        className="mt-4 text-xs font-medium text-slate-500/90 transition hover:text-indigo-600"
      >
        Admin login
      </button>
      </div>

      <AdminLoginModal
        open={adminOpen}
        onClose={() => {
          setAdminOpen(false)
          setAdminError('')
        }}
        onSubmit={handleAdminLogin}
        error={adminError}
      />
    </div>
  )
}
