import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { RpcStub } from 'capnweb'
import { Switch, Textarea, Input, Button, Tabs, useKumoToastManager } from '@cloudflare/kumo'
import {
  Hexagon,
  ShieldWarning,
  UserPlus,
  Users,
  GraduationCap,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  BookOpen,
  ChartLineUp,
  Lightning,
  Cpu,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react'
import CommandCenterView from './CommandCenterView'
import { useAuthenticatedApi } from './AuthContext'
import { AdminApi, AdminFormat, AdminResourceVendor, AmbientGatekeeperMode, MAX_INSTANCE_INSTRUCTIONS_LENGTH, MAX_ANNOUNCEMENT_LENGTH, MAX_SITE_NAME_LENGTH, DEFAULT_SITE_NAME, BannerColor, BANNER_COLORS, DEFAULT_BANNER_COLOR, SUGGESTED_MODELS } from '@gadgets/workshop-shared/api'
import { applyAccentColor, DEFAULT_ACCENT_COLOR } from './theme'
import { cacheBustSiteLogoUrl, prepareSiteLogo } from './siteLogoUtils'
import SiteLogo from './components/SiteLogo'
import { useDocumentTitle } from './useDocumentTitle'
import AdminFormatsPanel from './components/format/AdminFormatsPanel'

// Preset accent colors offered in the Theme section ('' = default brand).
const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: 'Default', value: '' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Teal', value: '#0d9488' },
]

// Swatch background per banner color, matching AnnouncementBanner's accent styles.
const BANNER_SWATCH: Record<BannerColor, string> = {
  neutral: 'var(--color-kumo-tint)',
  info: 'var(--color-kumo-info)',
  success: 'var(--color-kumo-success)',
  warning: 'var(--color-kumo-warning)',
  danger: 'var(--color-kumo-danger)',
  brand: 'var(--color-accent-100)',
}

export default function AdminPage() {
  const { authenticatedApi, isAdmin } = useAuthenticatedApi()
  const toasts = useKumoToastManager()
  useDocumentTitle('Admin')

  // The admin capability (minted once via getAdminApi; null until loaded / for non-admins). Wrapped
  // in an object so useState doesn't treat the (callable) RPC stub as a state updater function.
  const [admin, setAdmin] = useState<{ api: RpcStub<AdminApi> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // System-prompt instructions: last-saved value + current editor draft.
  const [savedInstructions, setSavedInstructions] = useState('')
  const [instructionsDraft, setInstructionsDraft] = useState('')
  const [savingInstructions, setSavingInstructions] = useState(false)

  // Top-bar notice: last-saved value + current editor draft.
  const [savedAnnouncement, setSavedAnnouncement] = useState('')
  const [announcementDraft, setAnnouncementDraft] = useState('')
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Full-width banner: last-saved value + current editor draft (text + accent color).
  const [savedBanner, setSavedBanner] = useState<{ text: string; color: BannerColor }>({ text: '', color: DEFAULT_BANNER_COLOR })
  const [bannerTextDraft, setBannerTextDraft] = useState('')
  const [bannerColorDraft, setBannerColorDraft] = useState<BannerColor>(DEFAULT_BANNER_COLOR)
  const [savingBanner, setSavingBanner] = useState(false)

  // Accent (brand) color: '' means the default theme. Live-previewed while editing.
  const [savedAccent, setSavedAccent] = useState('')
  const [accentDraft, setAccentDraft] = useState('')
  const [savingAccent, setSavingAccent] = useState(false)

  // Site name (shown next to the top-bar logo): last-saved value + current editor draft.
  const [savedSiteName, setSavedSiteName] = useState('')
  const [siteNameDraft, setSiteNameDraft] = useState('')
  const [savingSiteName, setSavingSiteName] = useState(false)

  // Current custom logo URL. Uploads are normalized to PNG before crossing the RPC boundary.
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null)
  const [savingSiteLogo, setSavingSiteLogo] = useState(false)
  const siteLogoInputRef = useRef<HTMLInputElement>(null)

  // Whether new account signups are allowed.
  const [signupsEnabled, setSignupsEnabled] = useState(true)
  const [savingSignups, setSavingSignups] = useState(false)

  // Clef model routing pool: which TheHive models Clef may choose between pre-turn.
  const [clefModelPool, setClefModelPool] = useState<string[]>(Object.keys(SUGGESTED_MODELS['thehive']))
  const [savingClef, setSavingClef] = useState(false)

  // Gatekeeper resource config, and the set of resource keys ("vendorId\u0000urlPattern") busy toggling.
  const [resourceVendors, setResourceVendors] = useState<AdminResourceVendor[]>([])
  const [resourceBusy, setResourceBusy] = useState<Set<string>>(new Set())

  const [activeTab, setActiveTab] = useState('general')

  // Promoted output formats, in menu order (see AdminFormatsPanel).
  const [formats, setFormats] = useState<AdminFormat[]>([])

  // App users management state
  interface AdminUserRecord {
    id: string
    displayName: string
    hasPassword: boolean
    created: boolean
    onboardingCompleted: boolean
    studentProfile: import('@gadgets/workshop-shared/api').StudentProfile | null
    workspacesCount: number
    sessionsCount: number
    lastActive?: string
    workspaces?: Array<{
      id: string
      title: string
      created?: string
      lastActive?: string
    }>
    outputs?: Array<{
      workpieceId: string
      workspaceId: string
      title: string
      noun?: string
    }>
    dailyLlmCount?: { day: string; count: number } | null
    connectedAccountsCount?: number
    recentSessions?: Array<{
      created: string
    }>
  }
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSearch, setUsersSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null)

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users?token=captain')
      const data = await res.json() as { success?: boolean; users?: AdminUserRecord[] }
      if (data?.success && data.users) {
        setUsersList(data.users)
      }
    } catch (err) {
      toasts.add({ title: 'Failed to load app users', variant: 'error' })
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers()
    }
  }, [activeTab, isAdmin])

  const resourceKey = (vendorId: string, urlPattern: string) => `${vendorId}\u0000${urlPattern}`

  // Populate all editor state from a freshly-fetched settings view.
  const applySettings = (view: Awaited<ReturnType<RpcStub<AdminApi>['getSettings']>>) => {
    setSignupsEnabled(view.signupsEnabled)
    setSavedSiteName(view.siteName)
    setSiteNameDraft(view.siteName)
    setSiteLogoUrl(view.siteLogo?.url ?? null)
    setResourceVendors(view.resourceVendors)
    setSavedInstructions(view.instanceInstructions)
    setInstructionsDraft(view.instanceInstructions)
    setSavedAnnouncement(view.announcement)
    setAnnouncementDraft(view.announcement)
    setSavedBanner(view.banner)
    setBannerTextDraft(view.banner.text)
    setBannerColorDraft(view.banner.color)
    setSavedAccent(view.accentColor)
    setAccentDraft(view.accentColor)
    setFormats(view.formats)
    setClefModelPool(view.clefModelPool ?? Object.keys(SUGGESTED_MODELS['thehive']))
  }

  // Mint the admin capability once (the access check happens server-side) and load settings.
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }
    let cancelled = false
    let stub: RpcStub<AdminApi> | null = null
    ;(async () => {
      try {
        const api = await authenticatedApi.getAdminApi()
        if (cancelled) {
          api?.[Symbol.dispose]?.()
          return
        }
        if (!api) {
          setLoadError(true)
          return
        }
        stub = api
        setAdmin({ api })
        applySettings(await api.getSettings())
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load admin settings:', err)
          setLoadError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      stub?.[Symbol.dispose]?.()
    }
  }, [isAdmin, authenticatedApi])

  // Live-preview the draft accent color across the whole app while the admin page is open. On leave
  // (or before each change) revert to the last-saved value so an unsaved preview doesn't stick.
  useEffect(() => {
    applyAccentColor(accentDraft)
    return () => { applyAccentColor(savedAccent) }
  }, [accentDraft, savedAccent])

  // Re-fetch just the gatekeeper/resource state (used to revert an optimistic toggle on error).
  // Leaves the General-tab drafts untouched.
  const reloadResources = async () => {
    if (!admin) return
    const view = await admin.api.getSettings()
    setResourceVendors(view.resourceVendors)
  }

  const handleResourceToggle = async (vendorId: string, urlPattern: string, enabled: boolean) => {
    if (!admin) return
    const key = resourceKey(vendorId, urlPattern)
    setResourceBusy((prev) => new Set(prev).add(key))
    // Optimistic update.
    setResourceVendors((prev) =>
      prev.map((v) =>
        v.vendorId !== vendorId || v.autoProvisions
          ? v
          : { ...v, resources: v.resources.map((r) => (r.urlPattern === urlPattern ? { ...r, enabled } : r)) }
      )
    )
    try {
      await admin.api.setResourceEnabled(vendorId, urlPattern, enabled)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      toasts.add({ title: message, variant: 'error' })
      await reloadResources().catch(() => {})
    } finally {
      setResourceBusy((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleGatekeeperToggle = async (vendorId: string, enabled: boolean) => {
    if (!admin) return
    const key = `gk\u0000${vendorId}`
    setResourceBusy((prev) => new Set(prev).add(key))
    setResourceVendors((prev) =>
      prev.map((v) => (v.vendorId === vendorId && !v.autoProvisions ? { ...v, enabled } : v))
    )
    try {
      await admin.api.setGatekeeperMode(vendorId, enabled ? 'enabled' : 'disabled')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      toasts.add({ title: message, variant: 'error' })
      await reloadResources().catch(() => {})
    } finally {
      setResourceBusy((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleGatekeeperMode = async (vendorId: string, mode: AmbientGatekeeperMode) => {
    if (!admin) return
    const key = `gk\u0000${vendorId}`
    setResourceBusy((prev) => new Set(prev).add(key))
    setResourceVendors((prev) =>
      prev.map((v) => (v.vendorId === vendorId && v.autoProvisions ? { ...v, ambientMode: mode } : v))
    )
    try {
      await admin.api.setGatekeeperMode(vendorId, mode)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      toasts.add({ title: message, variant: 'error' })
      await reloadResources().catch(() => {})
    } finally {
      setResourceBusy((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleSaveAnnouncement = async () => {
    if (!admin) return
    setSavingAnnouncement(true)
    try {
      await admin.api.setAnnouncement(announcementDraft)
      setSavedAnnouncement(announcementDraft)
      toasts.add({ title: 'Announcement saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save announcement'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const bannerDirty =
    bannerTextDraft !== savedBanner.text || bannerColorDraft !== savedBanner.color

  const handleSaveBanner = async () => {
    if (!admin) return
    setSavingBanner(true)
    try {
      await admin.api.setBanner(bannerTextDraft, bannerColorDraft)
      setSavedBanner({ text: bannerTextDraft, color: bannerColorDraft })
      toasts.add({ title: 'Banner saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save banner'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingBanner(false)
    }
  }

  const accentDirty = accentDraft !== savedAccent

  const handleSaveAccent = async () => {
    if (!admin) return
    setSavingAccent(true)
    try {
      await admin.api.setAccentColor(accentDraft)
      setSavedAccent(accentDraft)
      toasts.add({ title: 'Accent color saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save accent color'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingAccent(false)
    }
  }

  const handleSignupsToggle = async (enabled: boolean) => {
    if (!admin) return
    setSavingSignups(true)
    setSignupsEnabled(enabled) // optimistic
    try {
      await admin.api.setSignupsEnabled(enabled)
    } catch (err) {
      setSignupsEnabled(!enabled) // revert
      const message = err instanceof Error ? err.message : 'Update failed'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingSignups(false)
    }
  }

  const handleSaveSiteName = async () => {
    if (!admin) return
    setSavingSiteName(true)
    try {
      await admin.api.setSiteName(siteNameDraft)
      setSavedSiteName(siteNameDraft)
      toasts.add({ title: 'Site name saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save site name'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingSiteName(false)
    }
  }

  const handleSiteLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !admin) return

    setSavingSiteLogo(true)
    try {
      const data = await prepareSiteLogo(file)
      const logo = await admin.api.setSiteLogo(data)
      setSiteLogoUrl(logo ? cacheBustSiteLogoUrl(logo.url) : null)
      toasts.add({ title: 'Logo saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save logo'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingSiteLogo(false)
    }
  }

  const handleRemoveSiteLogo = async () => {
    if (!admin) return
    setSavingSiteLogo(true)
    try {
      await admin.api.setSiteLogo(null)
      setSiteLogoUrl(null)
      toasts.add({ title: 'Default logo restored', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove logo'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingSiteLogo(false)
    }
  }

  const handleSaveInstructions = async () => {
    if (!admin) return
    setSavingInstructions(true)
    try {
      await admin.api.setInstanceInstructions(instructionsDraft)
      setSavedInstructions(instructionsDraft)
      toasts.add({ title: 'System prompt instructions saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save instructions'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingInstructions(false)
    }
  }

  const handleSaveClefPool = async (newPool: string[]) => {
    if (!admin) return
    setSavingClef(true)
    try {
      await admin.api.setClefModelPool(newPool)
      setClefModelPool(newPool)
      toasts.add({ title: 'Clef model pool saved', variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save Clef pool'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setSavingClef(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <ShieldWarning size={32} className="mx-auto text-kumo-subtle mb-3" />
        <p className="text-sm text-kumo-default">You don't have access to this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <p className="text-kumo-subtle">Loading admin settings...</p>
      </div>
    )
  }

  if (loadError || !admin) {
    return (
      <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8 py-16 text-center">
        <p className="text-sm text-kumo-danger">Something went wrong loading admin settings.</p>
        <button onClick={() => window.location.reload()} className="text-kumo-brand mt-2 text-sm underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-kumo-default">Admin</h1>
          <p className="text-sm text-kumo-subtle mt-1">
            Deployment-wide settings. Changes apply to all users on their next connection.
          </p>
        </div>
        <a
          href="/admin/command-center"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition shadow-sm w-fit"
        >
          <ShieldCheck size={16} weight="duotone" />
          <span>Launch Command Center</span>
          <ArrowSquareOut size={12} />
        </a>
      </div>

      <Tabs
        variant="underline"
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { value: 'general', label: 'General' },
          { value: 'users', label: 'App Users' },
          { value: 'command-center', label: 'Command Center' },
          { value: 'gatekeepers', label: 'Gatekeepers' },
          { value: 'formats', label: 'Formats' },
          { value: 'access', label: 'Access' },
        ]}
      />

      {/* Embedded Command Center view */}
      {activeTab === 'command-center' && (
        <div className="rounded-3xl border border-kumo-line overflow-hidden shadow-2xl">
          <CommandCenterView />
        </div>
      )}

      {/* Standard output formats */}
      {activeTab === 'formats' && admin && (
        <AdminFormatsPanel
          admin={admin.api}
          formats={formats}
          onChanged={async () => { setFormats((await admin.api.getSettings()).formats) }}
        />
      )}

      {/* App Users & Student Profiles Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-kumo-elevated border border-kumo-line shadow-sm">
              <div className="flex items-center justify-between text-kumo-subtle mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Scholars</span>
                <Users size={16} />
              </div>
              <p className="text-2xl font-bold text-kumo-default">{usersList.length}</p>
              <p className="text-[11px] text-kumo-subtle mt-0.5">Indexed Durable Object accounts</p>
            </div>
            <div className="p-4 rounded-2xl bg-kumo-elevated border border-kumo-line shadow-sm">
              <div className="flex items-center justify-between text-kumo-subtle mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Profiles Active</span>
                <GraduationCap size={16} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-kumo-default">
                {usersList.filter((u) => u.studentProfile !== null).length}
              </p>
              <p className="text-[11px] text-kumo-subtle mt-0.5">With academic context</p>
            </div>
            <div className="p-4 rounded-2xl bg-kumo-elevated border border-kumo-line shadow-sm">
              <div className="flex items-center justify-between text-kumo-subtle mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Workspaces</span>
                <BookOpen size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-kumo-default">
                {usersList.reduce((acc, u) => acc + (u.workspacesCount || 0), 0)}
              </p>
              <p className="text-[11px] text-kumo-subtle mt-0.5">Active research gadgets</p>
            </div>
            <div className="p-4 rounded-2xl bg-kumo-elevated border border-kumo-line shadow-sm">
              <div className="flex items-center justify-between text-kumo-subtle mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Onboarding Done</span>
                <CheckCircle size={16} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-kumo-default">
                {usersList.filter((u) => u.onboardingCompleted).length}
              </p>
              <p className="text-[11px] text-kumo-subtle mt-0.5">Wizard finished</p>
            </div>
          </div>

          {/* Directory Filter & Search */}
          <div className="bg-kumo-elevated border border-kumo-line rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search username, university, degree…"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-kumo-control/50 border border-kumo-line text-xs text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-brand"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="secondary" size="sm" onClick={fetchUsers} loading={usersLoading}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-kumo-elevated border border-kumo-line rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-kumo-line bg-kumo-tint/40 text-kumo-subtle uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Scholar / User</th>
                    <th className="py-3 px-4 font-semibold">Institution &amp; Degree</th>
                    <th className="py-3 px-4 font-semibold">Academic Level</th>
                    <th className="py-3 px-4 font-semibold">Workspaces</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kumo-line">
                  {usersList
                    .filter((u) => {
                      if (!usersSearch.trim()) return true
                      const q = usersSearch.toLowerCase()
                      const matchId = u.id.toLowerCase().includes(q)
                      const matchName = u.displayName.toLowerCase().includes(q)
                      const matchUni = u.studentProfile?.university.toLowerCase().includes(q)
                      const matchDegree = u.studentProfile?.degreeProgram.toLowerCase().includes(q)
                      return matchId || matchName || matchUni || matchDegree
                    })
                    .map((user) => {
                      const prof = user.studentProfile
                      return (
                        <tr key={user.id} className="hover:bg-kumo-tint/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className="flex items-center gap-2.5 text-left group focus:outline-none"
                            >
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                {user.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-kumo-default group-hover:text-kumo-brand transition-colors truncate">
                                    {user.displayName}
                                  </span>
                                  {user.id === 'captain' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-kumo-subtle truncate">@{user.id}</p>
                              </div>
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            {prof ? (
                              <div className="min-w-0">
                                <p className="font-semibold text-kumo-default truncate">{prof.university}</p>
                                <p className="text-[11px] text-kumo-subtle truncate">{prof.degreeProgram}</p>
                              </div>
                            ) : (
                              <span className="text-kumo-inactive italic">No profile linked</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {prof ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-kumo-tint border border-kumo-line text-kumo-default text-[11px] font-medium">
                                <GraduationCap size={12} className="text-indigo-400" />
                                {prof.academicYear || prof.academicLevel || 'Enrolled'}
                              </span>
                            ) : (
                              <span className="text-kumo-inactive">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-kumo-default">{user.workspacesCount}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {user.created ? (
                              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium text-[11px]">
                                <CheckCircle size={13} weight="fill" /> Active DO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-kumo-inactive text-[11px]">
                                <Clock size={13} /> Unprovisioned
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="text-xs"
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {usersList.length === 0 && !usersLoading && (
              <div className="py-12 text-center text-kumo-subtle">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No application users found</p>
                <p className="text-xs mt-1">Users will appear here once they register or sign in.</p>
              </div>
            )}
          </div>

          {/* Full User Picture & Deep Activity Inspect Drawer / Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-2xl bg-kumo-elevated border border-kumo-line rounded-3xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                {/* Header Banner */}
                <div className="flex items-start justify-between border-b border-kumo-line pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {selectedUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-kumo-default">{selectedUser.displayName}</h3>
                        {selectedUser.id === 'captain' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Super Admin
                          </span>
                        )}
                        {selectedUser.created && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle size={10} weight="fill" /> Active DO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-kumo-subtle mt-0.5">
                        Username: <span className="font-mono text-kumo-default">@{selectedUser.id}</span>
                        {selectedUser.lastActive && (
                          <span className="ml-3 text-[11px] text-kumo-inactive">
                            Last Active: {new Date(selectedUser.lastActive).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    Close
                  </Button>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-kumo-tint/40 border border-kumo-line">
                    <div className="flex items-center justify-center gap-1 text-kumo-subtle text-[11px] mb-0.5">
                      <BookOpen size={13} className="text-indigo-400" />
                      <span>Workspaces</span>
                    </div>
                    <p className="text-lg font-bold text-kumo-default">{selectedUser.workspacesCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-kumo-tint/40 border border-kumo-line">
                    <div className="flex items-center justify-center gap-1 text-kumo-subtle text-[11px] mb-0.5">
                      <Cpu size={13} className="text-emerald-400" />
                      <span>Outputs</span>
                    </div>
                    <p className="text-lg font-bold text-kumo-default">{selectedUser.outputs?.length ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-kumo-tint/40 border border-kumo-line">
                    <div className="flex items-center justify-center gap-1 text-kumo-subtle text-[11px] mb-0.5">
                      <Clock size={13} className="text-amber-400" />
                      <span>Sessions</span>
                    </div>
                    <p className="text-lg font-bold text-kumo-default">{selectedUser.sessionsCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-kumo-tint/40 border border-kumo-line">
                    <div className="flex items-center justify-center gap-1 text-kumo-subtle text-[11px] mb-0.5">
                      <Lightning size={13} className="text-purple-400" />
                      <span>LLM Today</span>
                    </div>
                    <p className="text-lg font-bold text-kumo-default">
                      {selectedUser.dailyLlmCount?.count ?? 0}
                    </p>
                  </div>
                </div>

                {/* Section 1: Academic Profile & Context */}
                {selectedUser.studentProfile ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-kumo-subtle flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-indigo-500" /> Academic Dossier
                    </h4>
                    <div className="p-4 rounded-2xl bg-kumo-tint/50 border border-kumo-line text-xs space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-kumo-subtle block">University / Institute</span>
                          <span className="font-bold text-kumo-default text-sm">
                            {selectedUser.studentProfile.university}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-kumo-subtle block">Degree &amp; Program</span>
                          <span className="font-bold text-kumo-default text-sm">
                            {selectedUser.studentProfile.degreeProgram}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-kumo-line/50">
                        <div>
                          <span className="text-[11px] text-kumo-subtle block">Discipline</span>
                          <span className="font-semibold text-kumo-default">
                            {selectedUser.studentProfile.disciplineTitle}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-kumo-subtle block">Level &amp; Year</span>
                          <span className="font-semibold text-kumo-default">
                            {selectedUser.studentProfile.academicYear} · {selectedUser.studentProfile.semester}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-kumo-subtle block">Citation Style</span>
                          <span className="font-semibold text-kumo-default">
                            {selectedUser.studentProfile.citationStyle}
                          </span>
                        </div>
                      </div>

                      {selectedUser.studentProfile.courses && selectedUser.studentProfile.courses.length > 0 && (
                        <div className="pt-2 border-t border-kumo-line/50">
                          <span className="text-[11px] text-kumo-subtle block mb-1">Enrolled Courses:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedUser.studentProfile.courses.map((c) => (
                              <span
                                key={c.code}
                                className="px-2 py-0.5 rounded-lg bg-kumo-base border border-kumo-line text-[11px] font-medium text-kumo-default"
                              >
                                {c.code} · {c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Agent Injected System Prompt Context */}
                    <div>
                      <span className="text-[11px] font-semibold text-kumo-subtle block mb-1">
                        Active Agent System Prompt Injection:
                      </span>
                      <pre className="p-3 rounded-2xl bg-kumo-base border border-kumo-line text-[11px] font-mono text-indigo-400 whitespace-pre-wrap leading-relaxed">
                        {`[Academic Context: Student: ${selectedUser.studentProfile.name || selectedUser.displayName} | ${selectedUser.studentProfile.university} | ${selectedUser.studentProfile.degreeProgram} (${selectedUser.studentProfile.academicYear}) | Discipline: ${selectedUser.studentProfile.disciplineTitle} | Citation Style: ${selectedUser.studentProfile.citationStyle}${
                          selectedUser.studentProfile.courses?.length
                            ? ` | Enrolled: ${selectedUser.studentProfile.courses.map((c) => c.code).join(', ')}`
                            : ''
                        }]`}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-kumo-tint/30 border border-kumo-line text-center text-kumo-subtle text-xs">
                    <p>No student profile registered for this account.</p>
                  </div>
                )}

                {/* Section 2: Research Workspaces Activity */}
                <div className="space-y-2 pt-2 border-t border-kumo-line">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-kumo-subtle flex items-center gap-1.5">
                      <BookOpen size={15} className="text-emerald-500" /> Research Workspaces &amp; Gadgets
                    </h4>
                    <span className="text-[11px] text-kumo-subtle">
                      {selectedUser.workspaces?.length ?? 0} listed
                    </span>
                  </div>

                  {selectedUser.workspaces && selectedUser.workspaces.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedUser.workspaces.map((ws) => (
                        <div
                          key={ws.id}
                          className="p-2.5 rounded-xl bg-kumo-tint/40 border border-kumo-line flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-kumo-default truncate">{ws.title}</p>
                            <p className="text-[10px] text-kumo-subtle font-mono truncate">DO: {ws.id}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            {ws.lastActive && (
                              <span className="text-[10px] text-kumo-subtle block">
                                Active {new Date(ws.lastActive).toLocaleDateString()}
                              </span>
                            )}
                            <a
                              href={`/workspace/${ws.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-kumo-brand hover:underline inline-flex items-center gap-0.5 font-semibold"
                            >
                              <span>Open</span>
                              <ArrowSquareOut size={11} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-kumo-inactive italic">No workspaces created yet.</p>
                  )}
                </div>

                {/* Section 3: Generated Outputs & Artifacts */}
                <div className="space-y-2 pt-2 border-t border-kumo-line">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-kumo-subtle flex items-center gap-1.5">
                      <ChartLineUp size={15} className="text-purple-500" /> Generated Outputs &amp; Artifacts
                    </h4>
                    <span className="text-[11px] text-kumo-subtle">
                      {selectedUser.outputs?.length ?? 0} recorded
                    </span>
                  </div>

                  {selectedUser.outputs && selectedUser.outputs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {selectedUser.outputs.map((out, idx) => (
                        <div
                          key={`${out.workspaceId}-${out.workpieceId}-${idx}`}
                          className="p-2 rounded-xl bg-kumo-tint/40 border border-kumo-line text-xs"
                        >
                          <p className="font-semibold text-kumo-default truncate">{out.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-kumo-subtle">
                            <span className="capitalize">{out.noun || 'artifact'}</span>
                            {out.workspaceId ? (
                              <a
                                href={`/workspace/${out.workspaceId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-kumo-brand hover:underline inline-flex items-center gap-0.5 font-medium"
                              >
                                <span>#{out.workpieceId}</span>
                                <ArrowSquareOut size={10} />
                              </a>
                            ) : (
                              <span className="font-mono">#{out.workpieceId}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-kumo-inactive italic">No outputs exported yet.</p>
                  )}
                </div>

                {/* Section 4: Security & Session Log */}
                <div className="pt-2 border-t border-kumo-line flex items-center justify-between text-xs text-kumo-subtle">
                  <div className="flex items-center gap-4">
                    <span>
                      Password login: <strong className="text-kumo-default">{selectedUser.hasPassword ? 'Enabled' : 'OAuth Only'}</strong>
                    </span>
                    <span>
                      Connected gatekeepers: <strong className="text-kumo-default">{selectedUser.connectedAccountsCount ?? 0}</strong>
                    </span>
                  </div>
                  {selectedUser.recentSessions && selectedUser.recentSessions.length > 0 && (
                    <span className="text-[11px]">
                      Latest session: {new Date(selectedUser.recentSessions[0].created).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign-ups */}
      {activeTab === 'access' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-kumo-tint">
              <UserPlus size={18} className="text-kumo-subtle" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-kumo-strong">Allow new sign-ups</h2>
              <p className="text-sm text-kumo-subtle mt-0.5">
                When off, existing users can still log in but no new accounts can be created.
              </p>
            </div>
            <Switch
              checked={signupsEnabled}
              disabled={savingSignups}
              onCheckedChange={handleSignupsToggle}
            />
          </div>
        </div>
      )}

      {/* Site name */}
      {activeTab === 'general' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Site name</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            Shown next to the logo in the top bar. Leave empty to use the default
            (&ldquo;{DEFAULT_SITE_NAME}&rdquo;). Applies on each user&rsquo;s next connection.
          </p>

          <Input
            value={siteNameDraft}
            onChange={(e) => setSiteNameDraft(e.target.value)}
            placeholder={DEFAULT_SITE_NAME}
            maxLength={MAX_SITE_NAME_LENGTH}
          />

          <div className="flex items-center justify-end mt-4 gap-2">
            {siteNameDraft !== savedSiteName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSiteNameDraft(savedSiteName)}
                disabled={savingSiteName}
              >
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSiteName}
              loading={savingSiteName}
              disabled={siteNameDraft === savedSiteName}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Site logo */}
      {activeTab === 'general' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Logo</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            Shown in the app chrome, sign-in screens, and browser tab. Images are scaled without
            cropping and converted to a static PNG. Square images work best. Applies on each
            user&rsquo;s next connection.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-kumo-line bg-kumo-base p-2">
              <SiteLogo size={40} srcOverride={siteLogoUrl}>
                <Hexagon size={32} weight="bold" className="text-kumo-brand" />
              </SiteLogo>
            </div>
            <input
              ref={siteLogoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={savingSiteLogo}
              onChange={handleSiteLogoChange}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => siteLogoInputRef.current?.click()}
                loading={savingSiteLogo}
                disabled={savingSiteLogo}
              >
                {siteLogoUrl ? 'Change logo' : 'Upload logo'}
              </Button>
              {siteLogoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveSiteLogo}
                  disabled={savingSiteLogo}
                >
                  Restore default
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Theme / accent color */}
      {activeTab === 'general' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Theme</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            Accent color used for buttons, links, and highlights. Changes preview live here; click
            Save to apply for everyone (on their next connection). Backgrounds keep the default
            warm theme.
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {ACCENT_PRESETS.map((preset) => {
              const selected = accentDraft === preset.value
              const swatch = preset.value || DEFAULT_ACCENT_COLOR
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAccentDraft(preset.value)}
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    selected
                      ? 'border-kumo-default text-kumo-default bg-kumo-tint'
                      : 'border-kumo-line text-kumo-subtle hover:bg-kumo-tint'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-kumo-line"
                    style={{ background: swatch }}
                  />
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-kumo-default cursor-pointer">
              <input
                type="color"
                value={accentDraft || DEFAULT_ACCENT_COLOR}
                onChange={(e) => setAccentDraft(e.target.value)}
                className="w-9 h-9 rounded-md border border-kumo-line bg-transparent cursor-pointer p-0.5"
              />
              Custom
            </label>
            <span className="text-xs font-mono text-kumo-subtle">
              {accentDraft || `${DEFAULT_ACCENT_COLOR} (default)`}
            </span>
            <div className="flex-1" />
            {accentDirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccentDraft(savedAccent)}
                disabled={savingAccent}
              >
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAccent}
              loading={savingAccent}
              disabled={!accentDirty}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Full-width banner */}
      {activeTab === 'general' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Banner</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            A dismissible bar across the very top of the app (logged in or not). Markdown is
            supported, so you can include links. Leave empty to hide it. Applies on each
            user&rsquo;s next connection.
          </p>

          <Textarea
            className="w-full"
            value={bannerTextDraft}
            onValueChange={setBannerTextDraft}
            rows={1}
            placeholder={'e.g. \uD83C\uDF89 New: blueprints now support imports \u2014 [learn more](https://example.com).'}
            maxLength={MAX_ANNOUNCEMENT_LENGTH}
            error={
              bannerTextDraft.length > MAX_ANNOUNCEMENT_LENGTH
                ? `Too long by ${bannerTextDraft.length - MAX_ANNOUNCEMENT_LENGTH} characters`
                : undefined
            }
          />

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-kumo-subtle mb-2">Type</p>
              <div className="flex flex-wrap items-center gap-2">
                {BANNER_COLORS.map((c) => {
                  const selected = bannerColorDraft === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBannerColorDraft(c)}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        selected
                          ? 'border-kumo-default text-kumo-default bg-kumo-tint'
                          : 'border-kumo-line text-kumo-subtle hover:bg-kumo-tint'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-kumo-line"
                        style={{ background: BANNER_SWATCH[c] }}
                      />
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {bannerDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBannerTextDraft(savedBanner.text)
                    setBannerColorDraft(savedBanner.color)
                  }}
                  disabled={savingBanner}
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveBanner}
                loading={savingBanner}
                disabled={!bannerDirty || bannerTextDraft.length > MAX_ANNOUNCEMENT_LENGTH}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top-bar notice */}
      {activeTab === 'general' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Top-bar notice</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            Shown centered in the top navigation bar. Markdown is supported, so you can include
            links. Keep it short — it renders on a single line. Leave empty to show nothing. Applies
            on each user&rsquo;s next connection.
          </p>

          <Textarea
            className="w-full"
            value={announcementDraft}
            onValueChange={setAnnouncementDraft}
            rows={1}
            placeholder={'e.g. Heads up: scheduled maintenance Saturday \u2014 see [status](https://status.example.com).'}
            maxLength={MAX_ANNOUNCEMENT_LENGTH}
            error={
              announcementDraft.length > MAX_ANNOUNCEMENT_LENGTH
                ? `Too long by ${announcementDraft.length - MAX_ANNOUNCEMENT_LENGTH} characters`
                : undefined
            }
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-kumo-subtle">
              {announcementDraft.length.toLocaleString()} / {MAX_ANNOUNCEMENT_LENGTH.toLocaleString()} characters
            </span>
            <div className="flex items-center gap-2">
              {announcementDraft !== savedAnnouncement && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnnouncementDraft(savedAnnouncement)}
                  disabled={savingAnnouncement}
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAnnouncement}
                loading={savingAnnouncement}
                disabled={
                  announcementDraft === savedAnnouncement ||
                  announcementDraft.length > MAX_ANNOUNCEMENT_LENGTH
                }
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Agent system prompt additions */}
      {activeTab === 'general' && (
      <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
        <h2 className="text-lg font-semibold text-kumo-strong mb-1">Agent instructions</h2>
        <p className="text-sm text-kumo-subtle mb-5">
          Extra instructions added to every agent&rsquo;s system prompt on this deployment. Use this
          for instance-specific context, conventions, or guardrails.
        </p>

        <Textarea
          className="w-full"
          value={instructionsDraft}
          onValueChange={setInstructionsDraft}
          rows={6}
          placeholder={'e.g. ACME Corp is a logistics company that helps small businesses ship\ninternationally. Our team builds internal tools and dashboards to track shipments.'}
          maxLength={MAX_INSTANCE_INSTRUCTIONS_LENGTH}
          error={
            instructionsDraft.length > MAX_INSTANCE_INSTRUCTIONS_LENGTH
              ? `Too long by ${instructionsDraft.length - MAX_INSTANCE_INSTRUCTIONS_LENGTH} characters`
              : undefined
          }
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-kumo-subtle">
            {instructionsDraft.length.toLocaleString()} / {MAX_INSTANCE_INSTRUCTIONS_LENGTH.toLocaleString()} characters
          </span>
          <div className="flex items-center gap-2">
            {instructionsDraft !== savedInstructions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInstructionsDraft(savedInstructions)}
                disabled={savingInstructions}
              >
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveInstructions}
              loading={savingInstructions}
              disabled={
                instructionsDraft === savedInstructions ||
                instructionsDraft.length > MAX_INSTANCE_INSTRUCTIONS_LENGTH
              }
            >
              Save
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Clef model routing */}
      {activeTab === 'general' && (
      <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-semibold text-kumo-strong">Clef model routing</h2>
            <p className="text-sm text-kumo-subtle mt-1">
              When a user&rsquo;s active model is a TheHive model, Clef-flash automatically picks
              the best model from this pool for each query — without touching the user&rsquo;s
              setting. Requires at least 2 models selected. Deselect all or keep only one to
              disable routing.
            </p>
          </div>
          {savingClef && (
            <span className="text-xs text-kumo-subtle ml-4 mt-1 shrink-0">Saving…</span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {Object.entries(SUGGESTED_MODELS['thehive']).map(([modelId, meta]) => {
            const checked = clefModelPool.includes(modelId)
            const toggle = () => {
              const next = checked
                ? clefModelPool.filter(id => id !== modelId)
                : [...clefModelPool, modelId]
              void handleSaveClefPool(next)
            }
            return (
              <label
                key={modelId}
                className="flex items-start gap-3 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--color-accent-100)]"
                  checked={checked}
                  disabled={savingClef}
                  onChange={toggle}
                />
                <div>
                  <span className="text-sm font-medium text-kumo-strong">{meta.name}</span>
                  <span className="block text-xs text-kumo-subtle font-mono">{modelId}</span>
                </div>
              </label>
            )
          })}
        </div>

        {clefModelPool.length < 2 && (
          <p className="mt-3 text-xs text-kumo-subtle">
            Clef routing is <strong>disabled</strong> — select at least 2 models to enable it.
          </p>
        )}
        {clefModelPool.length >= 2 && (
          <p className="mt-3 text-xs text-kumo-subtle">
            Clef routing is <strong>active</strong> — Clef-flash will choose between{' '}
            {clefModelPool.length} model{clefModelPool.length !== 1 ? 's' : ''} per query.
          </p>
        )}
      </div>
      )}

      {/* Gatekeeper resources */}
      {activeTab === 'gatekeepers' && (
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-kumo-strong mb-1">Gatekeepers</h2>
          <p className="text-sm text-kumo-subtle mb-5">
            Turn connectors and resource types on or off for each service. Auto-provisioned
            gatekeepers (like the Context Library) have three modes &mdash; disabled, optional, or
            enabled for everyone. Changes are soft: they don&rsquo;t revoke access a gadget already
            holds.
          </p>

          {resourceVendors.length === 0 && (
            <p className="text-sm text-kumo-subtle">
              No configurable gatekeepers are installed on this deployment.
            </p>
          )}

          <div className="space-y-6">
            {resourceVendors.map((vendor) => {
              const gkKey = `gk\u0000${vendor.vendorId}`

              // Auto-provisioned ("ambient") gatekeepers use a three-state mode and have no resources.
              if (vendor.autoProvisions) {
                const mode = vendor.ambientMode ?? 'optional'
                const options: { value: AmbientGatekeeperMode; label: string; hint: string }[] = [
                  { value: 'disabled', label: 'Disabled', hint: 'Off for everyone' },
                  { value: 'optional', label: 'Optional', hint: 'Users can add it themselves' },
                  { value: 'enabled', label: 'Enabled', hint: 'On for everyone automatically' },
                ]
                return (
                  <div key={vendor.vendorId}>
                    <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-lg bg-kumo-tint/50">
                      {vendor.logo && (
                        <img
                          src={vendor.logo.url}
                          alt=""
                          className={`w-5 h-5 object-contain transition-[filter,opacity] ${mode === 'disabled' ? 'grayscale opacity-40' : ''}`}
                        />
                      )}
                      <h3 className={`flex-1 text-sm font-semibold ${mode === 'disabled' ? 'text-kumo-subtle' : 'text-kumo-default'}`}>
                        {vendor.displayName}
                      </h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-kumo-tint text-kumo-subtle border border-kumo-line">
                        auto-provisioned
                      </span>
                    </div>
                    <div className="flex gap-2 px-3 py-1">
                      {options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={resourceBusy.has(gkKey)}
                          onClick={() => handleGatekeeperMode(vendor.vendorId, opt.value)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                            mode === opt.value
                              ? 'border-kumo-brand bg-kumo-brand/10'
                              : 'border-kumo-line hover:bg-kumo-tint'
                          }`}
                        >
                          <span className="block text-sm font-medium text-kumo-default">{opt.label}</span>
                          <span className="block text-xs text-kumo-subtle mt-0.5">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
              <div key={vendor.vendorId}>
                {/* The whole header row is a toggle target; the Switch stops propagation so it
                    doesn't double-fire. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !resourceBusy.has(gkKey) && handleGatekeeperToggle(vendor.vendorId, !vendor.enabled)}
                  onKeyDown={(e) => {
                    if (e.currentTarget !== e.target) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!resourceBusy.has(gkKey)) handleGatekeeperToggle(vendor.vendorId, !vendor.enabled)
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 mb-2 px-3 py-2 rounded-lg bg-kumo-tint/50 hover:bg-kumo-tint transition-colors"
                >
                  {vendor.logo && (
                    <img
                      src={vendor.logo.url}
                      alt=""
                      className={`w-5 h-5 object-contain transition-[filter,opacity] ${vendor.enabled ? '' : 'grayscale opacity-40'}`}
                    />
                  )}
                  <h3 className={`flex-1 text-sm font-semibold ${vendor.enabled ? 'text-kumo-default' : 'text-kumo-subtle'}`}>
                    {vendor.displayName}
                    {!vendor.enabled && (
                      <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-kumo-tint text-kumo-subtle border border-kumo-line">
                        disabled
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-kumo-subtle">
                    {vendor.enabled ? 'Enabled' : 'Off'}
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={vendor.enabled}
                      disabled={resourceBusy.has(gkKey)}
                      onCheckedChange={(enabled) => handleGatekeeperToggle(vendor.vendorId, enabled)}
                    />
                  </span>
                </div>
                {/* Resources are hidden while the gatekeeper is disabled — they can't be used
                    until it's re-enabled. */}
                {vendor.enabled ? (
                  <div className="space-y-1">
                    {vendor.resources.map((resource) => {
                      const key = resourceKey(vendor.vendorId, resource.urlPattern)
                      return (
                        <div
                          key={resource.urlPattern}
                          role="button"
                          tabIndex={0}
                          onClick={() => !resourceBusy.has(key) && handleResourceToggle(vendor.vendorId, resource.urlPattern, !resource.enabled)}
                          onKeyDown={(e) => {
                            if (e.currentTarget !== e.target) return
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              if (!resourceBusy.has(key)) handleResourceToggle(vendor.vendorId, resource.urlPattern, !resource.enabled)
                            }
                          }}
                          className="flex cursor-pointer items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-kumo-tint transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-kumo-default truncate">
                              {resource.title}
                            </p>
                            <p className="text-xs text-kumo-subtle mt-0.5">{resource.description}</p>
                          </div>
                          <span onClick={(e) => e.stopPropagation()}>
                            <Switch
                              checked={resource.enabled}
                              disabled={resourceBusy.has(key)}
                              onCheckedChange={(enabled) =>
                                handleResourceToggle(vendor.vendorId, resource.urlPattern, enabled)
                              }
                            />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-kumo-subtle px-3 py-1">
                    {vendor.resources.length} resource{vendor.resources.length === 1 ? '' : 's'} hidden while disabled.
                  </p>
                )}
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
