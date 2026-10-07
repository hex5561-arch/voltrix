import { useKumoToastManager } from '@cloudflare/kumo'
import { useAuthenticatedApi } from './AuthContext'
import { useState, useEffect, useRef } from 'react'
import { AiChatAuthorInfo } from '@gadgets/workshop-shared/api'
import { hashPassword } from './passwordHash'
import { CF_ACCESS_MODE } from './useAuth'
import { User, Pencil, Check, X, Lock, Camera, Copy, Eye, EyeSlash, GraduationCap, Plus, Trash } from '@phosphor-icons/react'
import { useAvatar, invalidateAvatarCache } from './useAvatar'
import { compressAvatar, avatarBlobUrl } from './avatarUtils'
import UsageSettings from './components/billing/UsageSettings'
import { useDocumentTitle } from './useDocumentTitle'
import {
  getStudentProfile,
  saveStudentProfile,
  subscribeStudentProfile,
  StudentProfile,
  EnrolledCourse,
  getDefaultStudentProfile,
} from './services/studentProfile'
import {
  CITATION_STYLES,
  SEMESTERS,
  COURSE_COLORS,
} from './data/academicData'

// Shared, on-language control classes (match the rest of the app: Workspaces/Blueprints headers,
// the gatekeepers toolbar, the command palette). Kept here so the profile page reads as part of the
// system rather than a stack of default Kumo cards.
const PRIMARY_BTN =
  'press inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-kumo-brand px-3.5 text-[13px] font-medium tracking-[-0.25px] text-white transition-colors hover:bg-kumo-brand-hover disabled:cursor-not-allowed disabled:opacity-60'
const ICON_BTN =
  'press grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-kumo-inactive transition-colors hover:bg-kumo-tint hover:text-kumo-default'
const INPUT =
  'h-9 w-full rounded-lg border border-kumo-line bg-kumo-base px-3 text-[14px] tracking-[-0.25px] text-kumo-default placeholder:text-kumo-inactive transition-[border-color,box-shadow] focus:border-kumo-ring focus:outline-none focus:ring-[3px] focus:ring-kumo-ring/15'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[12px] font-medium uppercase tracking-[0.08em] text-kumo-inactive">
      {children}
    </h2>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-medium tracking-[-0.1px] text-kumo-subtle">{children}</p>
  )
}

// On-language password field: same input/focus treatment as the rest of the app, with an inline
// show/hide toggle (replacing Kumo's SensitiveInput, which read as dated against the new look).
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  description,
  error,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  description?: string
  error?: string | null
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative mt-1.5">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${INPUT} pr-10 ${error ? 'border-kumo-danger focus:border-kumo-danger' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-kumo-inactive transition-colors hover:text-kumo-default"
        >
          {show ? <EyeSlash size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-[12px] tracking-[-0.1px] text-kumo-danger">{error}</p>
      ) : description ? (
        <p className="mt-1 text-[12px] tracking-[-0.1px] text-kumo-subtle">{description}</p>
      ) : null}
    </div>
  )
}

export default function SettingsPage() {
  useDocumentTitle('Profile')

  const { authenticatedApi } = useAuthenticatedApi()
  const toasts = useKumoToastManager()
  const [userInfo, setUserInfo] = useState<AiChatAuthorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null)

  // Revoke preview blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview)
    }
  }, [localAvatarPreview])

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  // Whether this account has a password (false for OAuth-created accounts). Null while loading.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  // Academic Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    return getStudentProfile() || getDefaultStudentProfile()
  })
  const [isEditingAcademic, setIsEditingAcademic] = useState(false)
  const [academicUni, setAcademicUni] = useState(studentProfile.university)
  const [academicDegree, setAcademicDegree] = useState(studentProfile.degreeProgram)
  const [academicYear, setAcademicYear] = useState(studentProfile.academicYear)
  const [academicSemester, setAcademicSemester] = useState(studentProfile.semester)
  const [academicCitation, setAcademicCitation] = useState(studentProfile.citationStyle)
  const [academicCourses, setAcademicCourses] = useState<EnrolledCourse[]>(studentProfile.courses)
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseColor, setNewCourseColor] = useState(COURSE_COLORS[0])
  const [showAddCourse, setShowAddCourse] = useState(false)

  // WhatsApp linking state
  const [waLinkCode, setWaLinkCode] = useState<string | null>(null)
  const [waLinkLoading, setWaLinkLoading] = useState(false)

  useEffect(() => {
    return subscribeStudentProfile((p) => {
      if (p) {
        setStudentProfile(p)
        setAcademicUni(p.university)
        setAcademicDegree(p.degreeProgram)
        setAcademicYear(p.academicYear)
        setAcademicSemester(p.semester)
        setAcademicCitation(p.citationStyle)
        setAcademicCourses(p.courses)
      }
    })
  }, [])

  const handleSaveAcademic = async () => {
    const patch = {
      university: academicUni.trim() || 'My University',
      degreeProgram: academicDegree.trim() || 'Degree Program',
      academicYear,
      semester: academicSemester,
      citationStyle: academicCitation,
      courses: academicCourses,
    }
    const updated = saveStudentProfile(patch)
    setStudentProfile(updated)
    setIsEditingAcademic(false)
    // Also persist to the DO so the agent picks up changes immediately.
    try {
      await authenticatedApi.setStudentProfile({
        discipline: updated.discipline ?? '',
        disciplineTitle: updated.disciplineTitle ?? '',
        university: updated.university,
        degreeProgram: updated.degreeProgram,
        academicLevel: updated.academicLevel ?? '',
        academicYear: updated.academicYear,
        semester: updated.semester,
        citationStyle: updated.citationStyle,
        courses: updated.courses.map(c => ({ code: c.code, name: c.name })),
        updatedAt: updated.updatedAt,
      })
    } catch { /* non-fatal — localStorage copy is still saved */ }
    toasts.add({ title: 'Academic profile updated', variant: 'success' })
  }

  const handleAddCourse = () => {
    if (!newCourseCode.trim() || !newCourseName.trim()) return
    const course: EnrolledCourse = {
      id: `course-${Date.now()}`,
      code: newCourseCode.trim().toUpperCase(),
      name: newCourseName.trim(),
      color: newCourseColor,
      semester: academicSemester,
      selected: true,
    }
    setAcademicCourses(prev => [...prev, course])
    setNewCourseCode('')
    setNewCourseName('')
    setShowAddCourse(false)
  }

  const handleRemoveCourse = (id: string) => {
    setAcademicCourses(prev => prev.filter(c => c.id !== id))
  }

  const avatarUrl = useAvatar(authenticatedApi, userInfo?.id)

  // Determine whether to show the change-password section.
  useEffect(() => {
    let cancelled = false
    authenticatedApi.hasPasswordLogin()
      .then((v: boolean) => { if (!cancelled) setHasPassword(v) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [authenticatedApi])

  // Fetch user info
  useEffect(() => {
    let cancelled = false
    const fetchUserInfo = async () => {
      try {
        const info = await authenticatedApi.whoami()
        if (cancelled) return
        setUserInfo(info)
        setNameInput(info.name)
      } catch (error) {
        console.error('Failed to fetch user info:', error)
        if (!cancelled) toasts.add({ title: 'Failed to load user information', variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUserInfo()
    return () => { cancelled = true }
  }, [authenticatedApi])

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      toasts.add({ title: 'Display name cannot be empty', variant: 'error' })
      return
    }

    try {
      await authenticatedApi.setOwnDisplayName(nameInput.trim())
      setUserInfo(prev => prev ? { ...prev, name: nameInput.trim() } : null)
      setIsEditingName(false)
      toasts.add({ title: 'Display name updated', variant: 'success' })
    } catch (err) {
      console.error('Failed to update display name:', err)
      toasts.add({ title: 'Failed to update display name', variant: 'error' })
    }
  }

  const handleCancelEdit = () => {
    setNameInput(userInfo?.name || '')
    setIsEditingName(false)
  }

  const handleCopyId = async () => {
    if (!userInfo?.id) return
    try {
      await navigator.clipboard.writeText(userInfo.id)
      toasts.add({ title: 'User ID copied', variant: 'success' })
    } catch {
      toasts.add({ title: 'Failed to copy', variant: 'error' })
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toasts.add({ title: 'Please select an image file', variant: 'error' })
      return
    }
    setAvatarUploading(true)
    try {
      const compressed = await compressAvatar(file)
      // Show preview immediately
      if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview)
      setLocalAvatarPreview(avatarBlobUrl(compressed))
      // Upload
      await authenticatedApi.setAvatar(compressed)
      // Invalidate cache so the hook refetches
      if (userInfo?.id) invalidateAvatarCache(userInfo.id)
      toasts.add({ title: 'Avatar updated', variant: 'success' })
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setLocalAvatarPreview(null)
      toasts.add({ title: 'Failed to upload avatar', variant: 'error' })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!userInfo) return
    if (!currentPassword || !newPassword || !confirmPassword) return
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    setPasswordError(null)

    try {
      const oldHash = await hashPassword(userInfo.id, currentPassword)
      const newHash = await hashPassword(userInfo.id, newPassword)
      await authenticatedApi.changePassword(oldHash, newHash)
      toasts.add({ title: 'Password changed successfully', variant: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
  }

  const displayAvatarUrl = localAvatarPreview || avatarUrl

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center">
        <p className="text-[13px] tracking-[-0.25px] text-kumo-subtle">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-6 pb-16 sm:px-10">
      <header className="px-1 pb-2 pt-10">
        <h1 className="text-2xl font-semibold tracking-tight text-kumo-default">Profile</h1>
        <p className="mt-1 text-[13px] leading-[18px] tracking-[-0.25px] text-kumo-subtle">
          Manage your account details, avatar, and security.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-9">
        {/* Account */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Account</SectionLabel>
          <div className="divide-y divide-kumo-line overflow-hidden rounded-xl border border-kumo-line bg-kumo-base">
            {/* Avatar */}
            <div className="flex items-center gap-4 px-5 py-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="press group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-kumo-fill disabled:cursor-wait"
              >
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={28} className="text-kumo-subtle" />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={18} className="text-white" />
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-kumo-base/80">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-kumo-brand border-t-transparent" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                  e.target.value = ''
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium tracking-[-0.25px] text-kumo-default">
                  {userInfo?.name}
                </p>
                <p className="mt-0.5 text-[12px] leading-4 tracking-[-0.2px] text-kumo-subtle">
                  Click the avatar to upload a new photo
                </p>
              </div>
            </div>

            {/* Display name */}
            <div className="flex items-end gap-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <FieldLabel>Display name</FieldLabel>
                {isEditingName ? (
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    placeholder="Enter display name"
                    autoFocus
                    className={`mt-1.5 ${INPUT}`}
                  />
                ) : (
                  <p className="mt-1 text-[14px] tracking-[-0.25px] text-kumo-default">
                    {userInfo?.name}
                  </p>
                )}
              </div>
              {isEditingName ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={!nameInput.trim()}
                    aria-label="Save display name"
                    className={PRIMARY_BTN}
                  >
                    <Check size={15} weight="bold" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                    className={ICON_BTN}
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  aria-label="Edit display name"
                  className={ICON_BTN}
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {/* User ID */}
            <div className="flex items-center gap-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <FieldLabel>User ID</FieldLabel>
                <p className="mt-1 truncate font-mono text-[12px] tracking-[-0.1px] text-kumo-subtle">
                  {userInfo?.id}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                aria-label="Copy user ID"
                className={ICON_BTN}
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Academic & Student Profile */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <SectionLabel>Academic &amp; Student Profile</SectionLabel>
            <button
              type="button"
              onClick={() => setIsEditingAcademic(!isEditingAcademic)}
              className="text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil size={13} />
              {isEditingAcademic ? 'Cancel' : 'Edit Academic Setup'}
            </button>
          </div>

          <div className="divide-y divide-kumo-line overflow-hidden rounded-xl border border-kumo-line bg-kumo-base">
            {/* Campus & Degree Card */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={22} weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditingAcademic ? (
                    <div className="space-y-2">
                      <FieldLabel>University or College Campus</FieldLabel>
                      <input
                        value={academicUni}
                        onChange={(e) => setAcademicUni(e.target.value)}
                        placeholder="e.g. University of Nairobi, JKUAT, MIT..."
                        className={INPUT}
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-[15px] font-semibold tracking-[-0.25px] text-kumo-default truncate">
                        {studentProfile.university}
                      </h3>
                      <p className="text-[12px] text-indigo-400 font-medium truncate mt-0.5">
                        {studentProfile.degreeProgram} · {studentProfile.academicYear}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {isEditingAcademic && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <FieldLabel>Degree Program</FieldLabel>
                    <input
                      value={academicDegree}
                      onChange={(e) => setAcademicDegree(e.target.value)}
                      placeholder="e.g. B.Sc. Computer Science"
                      className={`mt-1.5 ${INPUT}`}
                    />
                  </div>
                  <div>
                    <FieldLabel>Academic Standing / Year</FieldLabel>
                    <input
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g. 3rd Year (Junior)"
                      className={`mt-1.5 ${INPUT}`}
                    />
                  </div>
                  <div>
                    <FieldLabel>Semester / Term</FieldLabel>
                    <select
                      value={academicSemester}
                      onChange={(e) => setAcademicSemester(e.target.value)}
                      className={`mt-1.5 ${INPUT}`}
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Citation Standard</FieldLabel>
                    <select
                      value={academicCitation}
                      onChange={(e) => setAcademicCitation(e.target.value)}
                      className={`mt-1.5 ${INPUT}`}
                    >
                      {CITATION_STYLES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Enrolled Courses */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Enrolled Courses ({academicCourses.length})</FieldLabel>
                {isEditingAcademic && (
                  <button
                    type="button"
                    onClick={() => setShowAddCourse(!showAddCourse)}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} weight="bold" />
                    Add Course
                  </button>
                )}
              </div>

              {isEditingAcademic && showAddCourse && (
                <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={newCourseCode}
                      onChange={(e) => setNewCourseCode(e.target.value)}
                      placeholder="Code (e.g. CS 301)"
                      className="px-2.5 py-1.5 text-xs rounded-md border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none"
                    />
                    <input
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="Course Name"
                      className="col-span-2 px-2.5 py-1.5 text-xs rounded-md border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {COURSE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCourseColor(c)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${
                            newCourseColor === c ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCourse}
                      disabled={!newCourseCode.trim() || !newCourseName.trim()}
                      className="text-[11px] font-semibold bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Save Course
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {academicCourses.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kumo-line bg-kumo-tint text-[12px] font-medium text-kumo-default"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <strong className="font-semibold">{c.code}</strong>
                    <span className="text-kumo-subtle truncate max-w-[150px]">{c.name}</span>
                    {isEditingAcademic && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(c.id)}
                        className="text-kumo-inactive hover:text-red-400 ml-1 cursor-pointer"
                        title="Remove course"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {academicCourses.length === 0 && (
                  <p className="text-xs text-kumo-subtle italic">No courses currently enrolled.</p>
                )}
              </div>

              {isEditingAcademic && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAcademic}
                    className={PRIMARY_BTN}
                  >
                    <Check size={14} weight="bold" />
                    Save Academic Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Usage & billing — only when the Cloudflare limits flow is enabled server-side */}
        <UsageSettings />

        {/* Security — only for password accounts (hidden under CF Access or gatekeeper sign-in) */}
        {!CF_ACCESS_MODE && hasPassword === true && (
          <section className="flex flex-col gap-3">
            <SectionLabel>Security</SectionLabel>
            <div className="rounded-xl border border-kumo-line bg-kumo-base p-5">
              <div className="flex max-w-sm flex-col gap-4">
                <PasswordField
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />

                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter new password"
                  description="Must be at least 8 characters"
                  autoComplete="new-password"
                />

                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  error={passwordError}
                />

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className={PRIMARY_BTN}
                  >
                    <Lock size={14} weight="bold" />
                    {passwordLoading ? 'Changing…' : 'Change password'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* WhatsApp — link Voltrix account to WhatsApp */}
        <section className="flex flex-col gap-3">
          <SectionLabel>WhatsApp</SectionLabel>
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-5">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-kumo-strong">Link your WhatsApp</p>
                <p className="text-xs text-kumo-subtle">
                  Generate a 6-digit code and send <code className="font-mono bg-kumo-tint px-1 rounded">!link {'<'}code{'>'}</code> to{' '}
                  <strong>+256 752 706 401</strong> on WhatsApp to connect Volt to your phone.
                </p>
              </div>
              {waLinkCode ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center rounded-xl border-2 border-indigo-500/40 bg-indigo-500/5 py-4">
                    <span className="font-mono text-3xl font-bold tracking-[0.3em] text-indigo-400">{waLinkCode}</span>
                  </div>
                  <p className="text-center text-xs text-kumo-subtle">
                    Send <code className="font-mono bg-kumo-tint px-1 rounded">!link {waLinkCode}</code> on WhatsApp. Code expires in 10 minutes.
                  </p>
                  <button
                    onClick={() => setWaLinkCode(null)}
                    className="text-xs text-kumo-subtle hover:text-kumo-default underline text-center"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <button
                  disabled={waLinkLoading}
                  onClick={async () => {
                    setWaLinkLoading(true)
                    try {
                      const code = await authenticatedApi.generateWhatsAppLinkCode()
                      setWaLinkCode(code)
                    } catch {
                      toasts.add({ title: 'Failed to generate code. Please try again.', variant: 'error' })
                    } finally {
                      setWaLinkLoading(false)
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-kumo-tint hover:bg-kumo-fill border border-kumo-line px-4 py-2.5 text-sm font-semibold text-kumo-strong transition-colors disabled:opacity-50"
                >
                  {waLinkLoading ? 'Generating…' : '📱 Generate WhatsApp Link Code'}
                </button>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
