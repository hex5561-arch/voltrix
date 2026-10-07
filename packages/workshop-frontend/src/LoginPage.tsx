import { useState, useEffect, FormEvent } from 'react'
import { RpcStub } from 'capnweb'
import { PublicApi } from '@gadgets/workshop-shared/api'
import {
  Hexagon,
  SignIn,
  UserPlus,
  Lightning,
  Eye,
  EyeSlash,
  Sparkle,
  ShieldCheck,
} from '@phosphor-icons/react'
import { Button, Banner, Loader } from '@cloudflare/kumo'
import { hashPassword } from './passwordHash'
import { useServerConfig, useServerConfigError, useSiteName } from './ServerConfigContext'
import { useDocumentTitle } from './useDocumentTitle'
import { useConnectionLost } from './RpcContext'
import OAuthButtons from './components/auth/OAuthButtons'
import SiteLogo from './components/SiteLogo'
import { saveStudentProfile } from './services/studentProfile'

export interface LoginPageProps {
  rpcStub: RpcStub<PublicApi>
  onLoginSuccess?: () => void
  initialTab?: 'signin' | 'signup' | 'demo'
}

const DISCIPLINES = [
  { id: 'computer_science', title: 'Computer Science & Software Engineering' },
  { id: 'mathematics', title: 'Mathematics & Quantitative Sciences' },
  { id: 'medicine', title: 'Medicine & Health Sciences' },
  { id: 'law', title: 'Law & Jurisprudence' },
  { id: 'business', title: 'Business Administration & Economics' },
  { id: 'humanities', title: 'Humanities & Social Sciences' },
  { id: 'general', title: 'General Studies' },
]

const ACADEMIC_LEVELS = [
  'Undergraduate Student',
  'Postgraduate / Master’s Candidate',
  'PhD Scholar / Doctoral Researcher',
  'Independent Scholar',
]

const DEMO_SCHOLARS = [
  {
    id: 'elena',
    name: 'Elena Rostova',
    institution: 'ETH Zürich',
    degree: 'B.Sc. Distributed Computing & Algorithms',
    discipline: 'Computer Science',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    institution: 'London School of Economics',
    degree: 'B.Sc. Quantitative Economics',
    discipline: 'Economics',
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'emma',
    name: 'Emma',
    institution: 'MIT',
    degree: 'B.Sc. Computer Science (Freshman)',
    discipline: 'Computer Science',
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'voltrixtest',
    name: 'Voltrix Scholar',
    institution: 'University of Nairobi',
    degree: 'B.Sc. Computer Science (Year 3)',
    discipline: 'Computer Science',
    color: 'from-emerald-600 to-teal-600',
  },
]

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: 'bg-kumo-line' }
  let score = 0
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' }
  return { score: 4, label: 'Strong & Secure', color: 'bg-emerald-500' }
}

const INPUT_STYLE =
  'w-full rounded-xl border border-kumo-line bg-kumo-base px-3.5 py-2.5 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none transition-colors'

export default function LoginPage({ rpcStub, onLoginSuccess, initialTab = 'signin' }: LoginPageProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'demo'>(initialTab)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Registration state
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [discipline, setDiscipline] = useState(DISCIPLINES[0].id)
  const [academicLevel, setAcademicLevel] = useState(ACADEMIC_LEVELS[0])
  const [university, setUniversity] = useState('')

  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const serverConfig = useServerConfig()
  const serverConfigError = useServerConfigError()
  const siteName = useSiteName()
  const connectionLost = useConnectionLost()
  useDocumentTitle(tab === 'signup' ? 'Create Account' : tab === 'demo' ? 'Demo Scholars' : 'Sign In')

  // Auto-handle OAuth redirect callback if query params contain `code`
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    if (code && (state === 'google' || state === 'github' || window.location.search.includes('code'))) {
      const provider = state === 'github' ? 'github' : 'google'
      const redirectUri = window.location.origin + window.location.pathname
      setLoading(true)
      setError(null)
      fetch('/api/auth/oauth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code, redirectUri }),
      })
        .then((r) => r.json())
        .then((data: any) => {
          if (data.success && data.token) {
            localStorage.setItem('authToken', data.token)
            window.history.replaceState({}, document.title, window.location.pathname)
            if (onLoginSuccess) onLoginSuccess()
            else window.location.reload()
          } else {
            setError(data.error || 'Social sign-in failed. Please try again.')
            setLoading(false)
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Social sign-in network error')
          setLoading(false)
        })
    }
  }, [onLoginSuccess])

  // Handle Social Login button click (Google or GitHub)
  const handleSocialClick = async (provider: 'google' | 'github') => {
    setError(null)
    setOauthLoading(provider)
    try {
      const redirectUri = window.location.origin + window.location.pathname
      const endpoint =
        provider === 'google'
          ? `/api/auth/oauth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`
          : `/api/auth/oauth/github/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      const res = await fetch(endpoint)
      const data = await res.json() as { enabled?: boolean; url?: string }
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error(`Could not generate ${provider} sign-in URL`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`)
      setOauthLoading(null)
    }
  }

  // Handle standard password login
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password || loading) return
    setLoading(true)
    setError(null)

    try {
      const trimmedUser = username.trim()
      const passwordHash = await hashPassword(trimmedUser, password)
      const token = await rpcStub.login(trimmedUser, passwordHash)
      if (token) {
        localStorage.setItem('authToken', token)
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          window.location.reload()
        }
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle registration
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedUser = username.trim().toLowerCase()
    const trimmedName = fullName.trim() || trimmedUser

    if (!trimmedUser || !password) {
      setError('Please provide a username and password')
      return
    }
    if (!/^[a-z0-9_-]+$/i.test(trimmedUser)) {
      setError('Username may only contain letters, numbers, underscores, and hyphens')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const passwordHash = await hashPassword(trimmedUser, password)
      const token = await rpcStub.createAccount(trimmedUser, trimmedName, passwordHash)
      if (token) {
        localStorage.setItem('authToken', token)

        // Seed academic profile
        const activePersona = DISCIPLINES.find((d) => d.id === discipline)
        const profilePayload = {
          name: trimmedName,
          discipline,
          disciplineTitle: activePersona?.title || 'General Studies',
          university: university.trim() || 'My University',
          degreeProgram: `${activePersona?.title || 'Academic Program'} (${academicLevel})`,
          academicLevel: academicLevel.toLowerCase().includes('undergraduate') ? 'undergraduate' : 'postgraduate',
          academicYear: 'Year 1',
          semester: 'Semester 1',
          citationStyle: 'APA',
          courses: [],
          updatedAt: Date.now(),
        }
        saveStudentProfile(profilePayload as any)

        try {
          const authApi = await rpcStub.authenticate(token)
          await authApi.setStudentProfile(profilePayload as any)
        } catch {
          // Best effort sync
        }

        setSuccessNotice('Account created! Entering workspace…')
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess()
          else window.location.href = '/'
        }, 300)
      } else {
        setError('Username already exists. Please pick a different one.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle 1-click Demo scholar login
  const handleDemoLogin = async (demoId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId }),
      })
      const data = await res.json() as { success?: boolean; token?: string; error?: string }
      if (data?.success && data?.token) {
        localStorage.setItem('authToken', data.token)
        if (onLoginSuccess) onLoginSuccess()
        else window.location.reload()
      } else {
        throw new Error(data?.error || 'Demo login failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not launch demo scholar')
      setLoading(false)
    }
  }

  if (!serverConfig) {
    if (serverConfigError && !connectionLost) {
      return (
        <div
          role="alert"
          className="min-h-screen flex flex-col items-center justify-center gap-4 bg-kumo-base px-4"
        >
          <p className="text-sm text-kumo-danger text-center">Couldn&apos;t load deployment settings.</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-kumo-base px-4">
        <Loader size="lg" />
        <p className="text-sm text-kumo-subtle text-center">
          {connectionLost ? "Can't reach the server. Retrying…" : 'Loading…'}
        </p>
      </div>
    )
  }

  const authVendors = serverConfig.authVendors ?? []
  const passwordAuthEnabled = serverConfig.passwordAuthEnabled
  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-kumo-base px-4 py-8 relative overflow-hidden">
      {/* Dot grid — fades from top to bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-kumo-line) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
        }}
      />

      <div className="w-full max-w-md relative bg-kumo-elevated/85 backdrop-blur-xl border border-kumo-line rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <SiteLogo size={42} className="mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-kumo-brand shadow-lg shadow-kumo-brand/20 mb-3">
              <Hexagon size={22} className="text-white" weight="bold" />
            </div>
          </SiteLogo>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-kumo-default tracking-tight">{siteName}</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
              <Sparkle size={10} weight="fill" /> Academic OS
            </span>
          </div>
          <p className="text-xs text-kumo-subtle mt-1.5 max-w-xs">
            Personalized AI research workspace & coursework engine
          </p>
        </div>

        {/* Segmented Tab Controls */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-kumo-control/60 border border-kumo-line mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('signin')
              setError(null)
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signin'
                ? 'bg-kumo-base text-kumo-default shadow-sm border border-kumo-line/60'
                : 'text-kumo-subtle hover:text-kumo-default'
            }`}
          >
            <SignIn size={13} weight="bold" />
            <span>Sign in</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup')
              setError(null)
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-kumo-base text-kumo-default shadow-sm border border-kumo-line/60'
                : 'text-kumo-subtle hover:text-kumo-default'
            }`}
          >
            <UserPlus size={13} weight="bold" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('demo')
              setError(null)
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'demo'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30'
                : 'text-kumo-subtle hover:text-amber-500'
            }`}
          >
            <Lightning size={13} weight="fill" className="text-amber-400" />
            <span>Demos</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {error && <Banner variant="error" title={error} className="mb-4 text-xs" />}
        {successNotice && <Banner variant="secondary" title={successNotice} className="mb-4 text-xs" />}

        {/* TAB 1: SIGN IN */}
        {tab === 'signin' && (
          <div className="space-y-4">
            {/* Social 1-Click Login */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                disabled={loading || oauthLoading !== null}
                className="py-2.5 px-3 rounded-xl bg-kumo-control/50 hover:bg-kumo-control border border-kumo-line hover:border-kumo-line-hover text-xs font-semibold text-kumo-default flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>{oauthLoading === 'google' ? 'Connecting…' : 'Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('github')}
                disabled={loading || oauthLoading !== null}
                className="py-2.5 px-3 rounded-xl bg-kumo-control/50 hover:bg-kumo-control border border-kumo-line hover:border-kumo-line-hover text-xs font-semibold text-kumo-default flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>{oauthLoading === 'github' ? 'Connecting…' : 'GitHub'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-kumo-line" />
              <span className="text-[11px] font-medium text-kumo-subtle uppercase tracking-wider">or with username</span>
              <div className="h-px flex-1 bg-kumo-line" />
            </div>

            {passwordAuthEnabled && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    autoComplete="username"
                    disabled={loading}
                    placeholder="your-username"
                    className={INPUT_STYLE}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={loading}
                      placeholder="••••••••"
                      className={`${INPUT_STYLE} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-inactive hover:text-kumo-default transition-colors p-1"
                    >
                      {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!username || !password || loading}
                  loading={loading}
                  className="w-full justify-center py-2.5 mt-2"
                >
                  Sign in
                </Button>
              </form>
            )}

            {/* Extra gatekeepers if bound */}
            {authVendors.length > 0 && (
              <div className="pt-2">
                <OAuthButtons rpcStub={rpcStub} vendors={authVendors} onSuccess={onLoginSuccess} />
              </div>
            )}

            <p className="text-center text-xs text-kumo-subtle pt-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-kumo-brand hover:underline font-semibold"
              >
                Create one
              </button>
            </p>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'signup' && (
          <div className="space-y-4">
            {/* Social Quick-Register */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                disabled={loading || oauthLoading !== null}
                className="py-2 px-3 rounded-xl bg-kumo-control/50 hover:bg-kumo-control border border-kumo-line text-xs font-semibold text-kumo-default flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('github')}
                disabled={loading || oauthLoading !== null}
                className="py-2 px-3 rounded-xl bg-kumo-control/50 hover:bg-kumo-control border border-kumo-line text-xs font-semibold text-kumo-default flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-kumo-line" />
              <span className="text-[11px] font-medium text-kumo-subtle uppercase tracking-wider">or register academic profile</span>
              <div className="h-px flex-1 bg-kumo-line" />
            </div>

            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-kumo-subtle mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${INPUT_STYLE} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-inactive hover:text-kumo-default p-1"
                  >
                    {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : 'bg-kumo-line'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-kumo-subtle">
                      Strength: <span className="font-semibold text-kumo-default">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-kumo-subtle mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className={`${INPUT_STYLE} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-inactive hover:text-kumo-default p-1"
                  >
                    {showConfirmPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Academic Discipline</label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className={`${INPUT_STYLE} cursor-pointer`}
                  >
                    {DISCIPLINES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-kumo-subtle mb-1">Level</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className={`${INPUT_STYLE} cursor-pointer`}
                  >
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-kumo-subtle mb-1">University / Institute</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. University of Nairobi, MIT, Oxford"
                  className={INPUT_STYLE}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!username || !password || loading}
                loading={loading}
                className="w-full justify-center py-2.5 mt-2"
              >
                Create student account
              </Button>
            </form>

            <p className="text-center text-xs text-kumo-subtle pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('signin')}
                className="text-kumo-brand hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* TAB 3: DEMO SCHOLARS */}
        {tab === 'demo' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500/90 flex items-start gap-2.5 mb-2">
              <Lightning size={16} weight="fill" className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-kumo-default">Instant Scholar Profiles</p>
                <p className="text-[11px] text-kumo-subtle">
                  Tap any profile below to launch an authentic, fully initialized academic workspace with zero setup.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_SCHOLARS.map((scholar) => (
                <div
                  key={scholar.id}
                  className="p-3 rounded-2xl bg-kumo-control/40 hover:bg-kumo-control/80 border border-kumo-line hover:border-kumo-brand/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${scholar.color} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
                    >
                      {scholar.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-kumo-default truncate">{scholar.name}</h3>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-kumo-line text-kumo-subtle">
                          {scholar.discipline}
                        </span>
                      </div>
                      <p className="text-[11px] text-kumo-subtle truncate">{scholar.institution}</p>
                      <p className="text-[10px] text-kumo-inactive truncate">{scholar.degree}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin(scholar.id)}
                    disabled={loading}
                    className="shrink-0 py-1.5 px-3 rounded-xl bg-kumo-brand text-kumo-inverse text-[11px] font-bold hover:bg-kumo-brand-hover active:scale-95 transition flex items-center gap-1 shadow-sm"
                  >
                    <span>Launch</span>
                    <Lightning size={12} weight="fill" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-kumo-subtle pt-3">
              Need your own account?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-kumo-brand hover:underline font-semibold"
              >
                Create one
              </button>
            </p>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-6 pt-4 border-t border-kumo-line flex items-center justify-between text-[11px] text-kumo-inactive">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> Edge Argon2id &amp; HMAC-SHA256
          </span>
          <span>Voltrix OS 2026</span>
        </div>
      </div>
    </div>
  )
}
