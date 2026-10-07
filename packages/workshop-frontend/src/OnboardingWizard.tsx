import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useKumoToastManager } from '@cloudflare/kumo'
import { useAuthenticatedApi } from './AuthContext'
import {
  AiChatAuthorInfo,
  AiGatewayInfo,
} from '@gadgets/workshop-shared/api'
import {
  GraduationCap,
  CheckCircle,
  Plus,
  Trash,
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  Camera,
  Lightning,
  X,
} from '@phosphor-icons/react'
import AddModelModal from './AddModelModal'
import { persistSelectedModel } from './modelSelection'
import { compressAvatar, avatarBlobUrl } from './avatarUtils'
import { invalidateAvatarCache } from './useAvatar'
import { useSiteName } from './ServerConfigContext'
import SiteLogo from './components/SiteLogo'
import { useDocumentTitle } from './useDocumentTitle'
import {
  UNIVERSITIES,
  PERSONAS,
  ACADEMIC_LEVELS,
  SEMESTERS,
  CITATION_STYLES,
  COURSE_COLORS,
  University,
  Persona,
} from './data/academicData'
import {
  getStudentProfile,
  saveStudentProfile,
  EnrolledCourse,
} from './services/studentProfile'

const TOTAL_STEPS = 5

export default function OnboardingWizard({
  onComplete,
}: {
  onComplete: () => void
}) {
  const { authenticatedApi, currentUser } = useAuthenticatedApi()
  const toasts = useKumoToastManager()
  const siteName = useSiteName()
  useDocumentTitle('Academic Setup')

  // Existing profile (if any)
  const existing = useMemo(() => getStudentProfile(), [])

  // Wizard step (0 to 4)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // ── Step 0: Profile & Discipline ──────────────────────────────────────────
  const [displayName, setDisplayName] = useState(currentUser?.name || '')
  const [originalDisplayName, setOriginalDisplayName] = useState(currentUser?.name || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarData, setAvatarData] = useState<Uint8Array | null>(null)
  const [avatarProcessing, setAvatarProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(
    existing?.discipline || PERSONAS[0].id
  )

  const activePersona: Persona = useMemo(() => {
    return PERSONAS.find((p) => p.id === selectedDiscipline) || PERSONAS[0]
  }, [selectedDiscipline])

  // ── Step 1: Campus & Degree Standing ──────────────────────────────────────
  const [universitySearch, setUniversitySearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    existing?.university || 'University of Nairobi'
  )
  const [selectedUniversityDetails, setSelectedUniversityDetails] = useState<University | null>(
    existing?.universityDetails || UNIVERSITIES.find(u => u.name.includes('Nairobi')) || UNIVERSITIES[0]
  )
  const [isCustomUniversity, setIsCustomUniversity] = useState(false)
  const [customUniversityName, setCustomUniversityName] = useState('')

  const [degreeProgram, setDegreeProgram] = useState<string>(
    existing?.degreeProgram || activePersona.defaultDegrees[0]
  )
  const [academicLevel, setAcademicLevel] = useState<string>(
    existing?.academicLevel || ACADEMIC_LEVELS[0].id
  )
  const [academicYear, setAcademicYear] = useState<string>(
    existing?.academicYear || ACADEMIC_LEVELS[0].years[0]
  )
  const [semester, setSemester] = useState<string>(
    existing?.semester || SEMESTERS[0]
  )

  // ── Step 2: Enrolled Courses & Citation Standards ─────────────────────────
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>(() => {
    if (existing?.courses && existing.courses.length > 0) {
      return existing.courses
    }
    return activePersona.defaultCourses.map((c) => ({
      id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: c.code,
      name: c.name,
      instructor: c.instructor,
      color: c.color,
      semester: SEMESTERS[0],
      description: `${c.code} · ${c.name}`,
      selected: c.selected,
    }))
  })

  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseColor, setNewCourseColor] = useState(COURSE_COLORS[0])
  const [showAddCourseForm, setShowAddCourseForm] = useState(false)

  const [citationStyle, setCitationStyle] = useState<string>(
    existing?.citationStyle || activePersona.citation
  )
  const [citationManuallySet, setCitationManuallySet] = useState(Boolean(existing?.citationStyle))

  // ── Step 3: AI Engine Selection ───────────────────────────────────────────
  const [models, setModels] = useState<AiChatAuthorInfo[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [aiConfig, setAiConfig] = useState<AiGatewayInfo | null>(null)
  const [addModelOpen, setAddModelOpen] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(true)

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Revoke avatar blob URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  // Populate display name from currentUser
  useEffect(() => {
    if (currentUser?.name && !displayName) {
      setDisplayName(currentUser.name)
      setOriginalDisplayName(currentUser.name)
    }
  }, [currentUser, displayName])

  // When persona changes, update default degree, courses, and citation (if not manually overridden)
  const handleSelectDiscipline = (personaId: string) => {
    setSelectedDiscipline(personaId)
    const p = PERSONAS.find((x) => x.id === personaId) || PERSONAS[0]
    setDegreeProgram(p.defaultDegrees[0])
    if (!citationManuallySet) {
      setCitationStyle(p.citation)
    }
    setEnrolledCourses(
      p.defaultCourses.map((c) => ({
        id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: c.code,
        name: c.name,
        instructor: c.instructor,
        color: c.color,
        semester,
        description: `${c.code} · ${c.name}`,
        selected: c.selected,
      }))
    )
  }

  // Close university dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Filtered universities matching character search across full registry
  const filteredUniversities = useMemo(() => {
    const q = universitySearch.toLowerCase().trim()
    if (!q) return []

    const cleanQ = q.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    const tokens = cleanQ.split(/\s+/).filter(Boolean)
    const compactQ = q.replace(/[^a-z0-9]/g, '')

    return UNIVERSITIES.filter((u) => {
      const nameLower = u.name.toLowerCase()
      const codeLower = u.code.toLowerCase()
      const countryLower = u.country.toLowerCase()
      const cityLower = (u.city || '').toLowerCase()
      const acronymsLower = (u.acronyms || []).map((a) => a.toLowerCase())
      const domainsLower = (u.domains || []).map((d) => d.toLowerCase())

      // 1. Exact or compact acronym/code match (e.g. "uon", "dekut", "tuk", "ku", "mku")
      if (compactQ) {
        if (acronymsLower.some((a) => a.replace(/[^a-z0-9]/g, '').includes(compactQ))) return true
        if (codeLower.replace(/[^a-z0-9]/g, '').includes(compactQ)) return true
      }

      // 2. Full query substring match across name, code, city, country, acronyms, or domains
      if (
        nameLower.includes(q) ||
        codeLower.includes(q) ||
        countryLower.includes(q) ||
        cityLower.includes(q) ||
        acronymsLower.some((a) => a.includes(q) || q.includes(a)) ||
        domainsLower.some((d) => d.includes(q))
      ) {
        return true
      }

      // 3. Multi-token match (all words appear somewhere in institution metadata)
      if (tokens.length > 1) {
        return tokens.every(
          (token) =>
            nameLower.includes(token) ||
            codeLower.includes(token) ||
            countryLower.includes(token) ||
            cityLower.includes(token) ||
            acronymsLower.some((a) => a.includes(token)) ||
            domainsLower.some((d) => d.includes(token))
        )
      }

      return false
    }).sort((a, b) => {
      // Relevance sorting: exact acronym or code match ranked first
      const aAcrMatch =
        (a.acronyms || []).some(
          (acr) => acr.toLowerCase() === q || (compactQ && acr.toLowerCase().replace(/[^a-z0-9]/g, '') === compactQ)
        ) ||
        a.code.toLowerCase() === q ||
        (compactQ && a.code.toLowerCase().replace(/[^a-z0-9]/g, '') === compactQ)

      const bAcrMatch =
        (b.acronyms || []).some(
          (acr) => acr.toLowerCase() === q || (compactQ && acr.toLowerCase().replace(/[^a-z0-9]/g, '') === compactQ)
        ) ||
        b.code.toLowerCase() === q ||
        (compactQ && b.code.toLowerCase().replace(/[^a-z0-9]/g, '') === compactQ)

      if (aAcrMatch && !bAcrMatch) return -1
      if (!aAcrMatch && bAcrMatch) return 1

      // Prefix name match ranked next
      const aStarts = a.name.toLowerCase().startsWith(q)
      const bStarts = b.name.toLowerCase().startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return 0
    })
  }, [universitySearch])

  // Current academic level years list
  const activeLevelYears = useMemo(() => {
    const lvl = ACADEMIC_LEVELS.find((l) => l.id === academicLevel)
    return lvl ? lvl.years : ACADEMIC_LEVELS[0].years
  }, [academicLevel])

  // Load models
  const fetchModels = useCallback(async () => {
    try {
      const [modelList, cfg] = await Promise.all([
        authenticatedApi.listModels(),
        authenticatedApi.getAiConfig(),
      ])
      setModels(modelList)
      setAiConfig(cfg)
      if (modelList.length > 0) {
        // Prefer GLM 5.3 Flash or first available
        const preferred = modelList.find(m => m.id.includes('glm-5.3') || m.id.includes('deepseek'))
        setSelectedModelId(preferred ? preferred.id : modelList[0].id)
      }
    } catch (err) {
      console.error('Failed to load models:', err)
    } finally {
      setModelsLoading(false)
    }
  }, [authenticatedApi])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // ── Avatar Handlers ───────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toasts.add({ title: 'Please select an image file', variant: 'error' })
      return
    }
    setAvatarProcessing(true)
    try {
      const compressed = await compressAvatar(file)
      setAvatarData(compressed)
      setAvatarPreview(avatarBlobUrl(compressed))
    } catch (err) {
      console.error('Failed to process avatar:', err)
      toasts.add({ title: 'Failed to process image', variant: 'error' })
    } finally {
      setAvatarProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // ── Course Handlers ───────────────────────────────────────────────────────
  const handleToggleCourse = (id: string) => {
    setEnrolledCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    )
  }

  const handleAddCustomCourse = () => {
    if (!newCourseCode.trim() || !newCourseName.trim()) return
    const newCourse: EnrolledCourse = {
      id: `course-custom-${Date.now()}`,
      code: newCourseCode.trim().toUpperCase(),
      name: newCourseName.trim(),
      color: newCourseColor,
      semester,
      instructor: 'Faculty / Lecturer',
      selected: true,
    }
    setEnrolledCourses((prev) => [newCourse, ...prev])
    setNewCourseCode('')
    setNewCourseName('')
    setShowAddCourseForm(false)
  }

  const handleRemoveCourse = (id: string) => {
    setEnrolledCourses((prev) => prev.filter((c) => c.id !== id))
  }

  // ── Finish & Provision ────────────────────────────────────────────────────
  const finalUniversity = isCustomUniversity
    ? customUniversityName.trim() || 'My University'
    : selectedUniversity

  const activeEnrolledCourses = enrolledCourses.filter((c) => c.selected)

  const handleFinish = async () => {
    setFinishing(true)
    try {
      // 1. Save student profile — localStorage for instant client reads, DO for agent injection
      const trimmedName = displayName.trim()
      const studentName = trimmedName || currentUser?.name || ''

      saveStudentProfile({
        name: studentName,
        discipline: selectedDiscipline,
        disciplineTitle: activePersona.title,
        university: finalUniversity,
        universityDetails: isCustomUniversity ? null : selectedUniversityDetails,
        degreeProgram,
        academicLevel,
        academicYear,
        semester,
        citationStyle,
        courses: activeEnrolledCourses,
        updatedAt: Date.now(),
      })
      // Persist to the user's Durable Object so the agent gets it on every turn automatically.
      await authenticatedApi.setStudentProfile({
        name: studentName,
        discipline: selectedDiscipline,
        disciplineTitle: activePersona.title,
        university: finalUniversity,
        degreeProgram,
        academicLevel,
        academicYear,
        semester,
        citationStyle,
        courses: activeEnrolledCourses.map(c => ({ code: c.code, name: c.name })),
        updatedAt: Date.now(),
      })

      // 2. Save user display name if changed
      if (trimmedName && trimmedName !== originalDisplayName) {
        await authenticatedApi.setOwnDisplayName(trimmedName)
      }

      // 3. Save avatar
      if (avatarData) {
        await authenticatedApi.setAvatar(avatarData)
        if (currentUser?.id) invalidateAvatarCache(currentUser.id)
      }

      // 4. Save preferred model
      await authenticatedApi.setPreferredModel(selectedModelId)
      persistSelectedModel(selectedModelId)

      // 5. Complete onboarding flag
      await authenticatedApi.completeOnboarding()

      toasts.add({
        title: 'Academic workspace ready!',
        variant: 'success',
      })

      onComplete()
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
      toasts.add({
        title: 'Something went wrong. Please try again.',
        variant: 'error',
      })
      setFinishing(false)
    }
  }

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <>
      <div className="fixed inset-0 bg-kumo-base dotted-bg flex items-center justify-center overflow-y-auto py-8 z-50">
        {/* Soft radial glow */}
        <div
          className="absolute inset-x-0 top-0 h-[50vh] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 0%, color-mix(in srgb, var(--color-kumo-brand) 10%, transparent) 0%, transparent 70%)',
          }}
        />

        <div
          className={`relative w-full max-w-2xl mx-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Brand header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <SiteLogo size={24}>
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <GraduationCap size={16} weight="fill" />
              </div>
            </SiteLogo>
            <span className="text-base font-bold tracking-tight text-kumo-default">
              {siteName} Academic Copilot
            </span>
          </div>

          {/* Stepper Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-kumo-default tracking-tight">
              {step === 0 && 'Select Your Academic Discipline'}
              {step === 1 && 'Campus & Degree Standing'}
              {step === 2 && 'Courses & Citation Standards'}
              {step === 3 && 'AI Engine & Profile'}
              {step === 4 && 'Launch Your Academic Workspace'}
            </h1>
            <p className="mt-1 text-xs text-kumo-subtle">
              {step === 0 && 'Customize Volt for your discipline, proofs, derivations and terminology'}
              {step === 1 && 'Configure your institution, degree program and academic level'}
              {step === 2 && 'Enroll semester courses and set your institutional citation format'}
              {step === 3 && 'Select your default AI model and customize how you appear in chats'}
              {step === 4 && 'Review your academic copilot configuration before takeoff'}
            </p>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              'Discipline',
              'Campus',
              'Courses',
              'AI Engine',
              'Launch',
            ].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center justify-center text-[10px] font-bold rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 h-6 bg-indigo-600 text-white ring-2 ring-indigo-400/40 shadow-sm'
                      : i < step
                      ? 'w-5 h-5 bg-emerald-500 text-white'
                      : 'w-5 h-5 bg-kumo-line text-kumo-subtle'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:inline ${
                    i === step
                      ? 'text-indigo-400 font-semibold'
                      : 'text-kumo-subtle'
                  }`}
                >
                  {label}
                </span>
                {i < TOTAL_STEPS - 1 && (
                  <div className="w-4 h-[1px] bg-kumo-line mx-1 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          {/* Card Body with Sliding/Dynamic Panels */}
          <div className="overflow-hidden rounded-2xl border border-kumo-line bg-kumo-elevated shadow-2xl">
            <div className="p-6 sm:p-8 min-h-[440px] max-h-[70vh] overflow-y-auto">

              {/* ══════════════════════════════════════════════════════════════
                  STEP 0: DISCIPLINE & FIELD OF STUDY
              ══════════════════════════════════════════════════════════════ */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERSONAS.map((p) => {
                      const Icon = p.icon
                      const isSelected = selectedDiscipline === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectDiscipline(p.id)}
                          className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                              : 'border-kumo-line bg-kumo-base hover:border-kumo-fill hover:bg-kumo-tint'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${p.color}20`, color: p.color }}
                            >
                              <Icon size={20} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-kumo-default truncate">
                                  {p.title}
                                </h3>
                                {isSelected && (
                                  <CheckCircle
                                    size={16}
                                    weight="fill"
                                    className="text-indigo-500 shrink-0"
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-kumo-subtle mt-0.5 line-clamp-2 leading-relaxed">
                                {p.subtitle}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-kumo-tint font-mono text-kumo-subtle">
                                  {p.citation} Standard
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Focus Highlights Callout */}
                  <div className="rounded-xl border border-kumo-line bg-kumo-tint p-3.5 flex items-center gap-3">
                    <Sparkle size={18} className="text-indigo-400 shrink-0" weight="fill" />
                    <div className="text-xs text-kumo-subtle">
                      <strong className="text-kumo-default font-semibold">{activePersona.title} Mode:</strong>{' '}
                      {activePersona.focusFeatures.join(' · ')}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 1: CAMPUS & DEGREE STANDING
              ══════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* University / Campus Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-kumo-default">
                        University or College Campus
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomUniversity(!isCustomUniversity)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {isCustomUniversity ? 'Select from registry' : 'Enter custom campus'}
                      </button>
                    </div>

                    {isCustomUniversity ? (
                      <input
                        type="text"
                        value={customUniversityName}
                        onChange={(e) => setCustomUniversityName(e.target.value)}
                        placeholder="e.g. University of Cape Coast, Dedan Kimathi University..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <div className="relative" ref={dropdownRef}>
                        {/* Search Bar */}
                        <div className="relative">
                          <MagnifyingGlass
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kumo-inactive pointer-events-none"
                          />
                          <input
                            type="text"
                            value={universitySearch}
                            onChange={(e) => {
                              const val = e.target.value
                              setUniversitySearch(val)
                              setIsDropdownOpen(val.trim().length > 0)
                            }}
                            onFocus={() => {
                              if (universitySearch.trim().length > 0) {
                                setIsDropdownOpen(true)
                              }
                            }}
                            placeholder="Type to search university (e.g. UoN, JKUAT, DeKUT, Harvard, Oxford)..."
                            className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                          />
                          {universitySearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setUniversitySearch('')
                                setIsDropdownOpen(false)
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-kumo-inactive hover:text-kumo-default text-xs transition-colors"
                              aria-label="Clear search"
                            >
                              <X size={12} weight="bold" />
                            </button>
                          )}
                        </div>

                        {/* Current Selected Campus Badge (visible when closed) */}
                        {selectedUniversity && !isDropdownOpen && (
                          <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                <GraduationCap size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-kumo-default truncate">{selectedUniversity}</p>
                                {selectedUniversityDetails && (
                                  <p className="text-[10px] text-kumo-subtle truncate">
                                    {selectedUniversityDetails.city}, {selectedUniversityDetails.country} · {selectedUniversityDetails.code}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full shrink-0">
                              Selected
                            </span>
                          </div>
                        )}

                        {/* Dropdown Menu - only opens once user starts typing */}
                        {isDropdownOpen && universitySearch.trim().length > 0 && (
                          <div className="mt-1.5 border border-kumo-line rounded-xl bg-kumo-base shadow-xl overflow-hidden z-20">
                            <div className="px-3 py-1.5 bg-kumo-tint/50 border-b border-kumo-line flex items-center justify-between text-[11px] text-kumo-subtle">
                              <span>
                                Matching universities ({filteredUniversities.length})
                              </span>
                              <span className="text-[10px]">Select your campus</span>
                            </div>

                            <div className="max-h-52 overflow-y-auto p-1.5 space-y-1">
                              {filteredUniversities.slice(0, 50).map((u) => {
                                const isChosen = selectedUniversity === u.name
                                return (
                                  <div
                                    key={u.id}
                                    onClick={() => {
                                      setSelectedUniversity(u.name)
                                      setSelectedUniversityDetails(u)
                                      setIsDropdownOpen(false)
                                      setUniversitySearch('')
                                    }}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                      isChosen
                                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30'
                                        : 'hover:bg-kumo-tint text-kumo-default'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="truncate font-medium">{u.name}</p>
                                      <p className="text-[10px] text-kumo-subtle">
                                        {u.city}, {u.country} · {u.code}
                                        {u.acronyms && u.acronyms.length > 0 && (
                                          <span className="ml-1 text-indigo-400/80">({u.acronyms.join(', ')})</span>
                                        )}
                                      </p>
                                    </div>
                                    {isChosen && (
                                      <CheckCircle
                                        size={14}
                                        weight="fill"
                                        className="text-indigo-400 shrink-0"
                                      />
                                    )}
                                  </div>
                                )
                              })}

                              {filteredUniversities.length === 0 && (
                                <div className="py-4 px-3 text-center">
                                  <p className="text-xs text-kumo-subtle">
                                    No universities matching &ldquo;{universitySearch}&rdquo;
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCustomUniversity(true)
                                      setCustomUniversityName(universitySearch)
                                      setIsDropdownOpen(false)
                                      setUniversitySearch('')
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                                  >
                                    <Plus size={12} /> Use &ldquo;{universitySearch}&rdquo; as custom campus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Degree Program & Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-kumo-default mb-1.5">
                        Degree Program
                      </label>
                      <input
                        type="text"
                        value={degreeProgram}
                        onChange={(e) => setDegreeProgram(e.target.value)}
                        placeholder="e.g. B.Sc. Computer Science"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-indigo-500"
                      />
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activePersona.defaultDegrees.slice(0, 3).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDegreeProgram(d)}
                            className="text-[10px] text-kumo-subtle hover:text-indigo-400 truncate max-w-full"
                          >
                            • {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-kumo-default mb-1.5">
                        Academic Standing / Year
                      </label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-kumo-line bg-kumo-base text-kumo-default focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {activeLevelYears.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>

                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={academicLevel}
                          onChange={(e) => {
                            setAcademicLevel(e.target.value)
                            const found = ACADEMIC_LEVELS.find((l) => l.id === e.target.value)
                            if (found && found.years.length > 0) {
                              setAcademicYear(found.years[0])
                            }
                          }}
                          className="flex-1 px-2 py-1 text-[11px] rounded-lg border border-kumo-line bg-kumo-tint text-kumo-subtle focus:outline-none"
                        >
                          {ACADEMIC_LEVELS.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="flex-1 px-2 py-1 text-[11px] rounded-lg border border-kumo-line bg-kumo-tint text-kumo-subtle focus:outline-none"
                        >
                          {SEMESTERS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 2: ENROLLED COURSES & CITATION STANDARDS
              ══════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Courses */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-kumo-default">
                        Enrolled Courses &amp; Subjects ({activeEnrolledCourses.length} active)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <Plus size={12} weight="bold" />
                        Add Course Code
                      </button>
                    </div>

                    {showAddCourseForm && (
                      <div className="p-3 mb-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newCourseCode}
                            onChange={(e) => setNewCourseCode(e.target.value)}
                            placeholder="Code (e.g. CS 301)"
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            placeholder="Course Name (e.g. Distributed Systems)"
                            className="col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {COURSE_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewCourseColor(c)}
                                className={`w-4 h-4 rounded-full transition-transform ${
                                  newCourseColor === c ? 'ring-2 ring-white scale-110' : ''
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddCourseForm(false)}
                              className="text-[11px] text-kumo-subtle px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCustomCourse}
                              disabled={!newCourseCode.trim() || !newCourseName.trim()}
                              className="text-[11px] font-semibold bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                            >
                              Save Course
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Course items */}
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {enrolledCourses.map((c) => (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                            c.selected
                              ? 'border-kumo-line bg-kumo-base'
                              : 'border-kumo-line/40 bg-kumo-tint opacity-60'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleCourse(c.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-kumo-default mr-2">{c.code}</span>
                              <span className="text-kumo-subtle truncate">{c.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="checkbox"
                              checked={Boolean(c.selected)}
                              onChange={() => handleToggleCourse(c.id)}
                              className="rounded border-kumo-line text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCourse(c.id)}
                              className="text-kumo-inactive hover:text-red-400 p-1"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citation Standards */}
                  <div>
                    <label className="block text-xs font-semibold text-kumo-default mb-2">
                      Academic Citation Standard
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CITATION_STYLES.map((cs) => {
                        const isSelected = citationStyle === cs.id
                        return (
                          <div
                            key={cs.id}
                            onClick={() => {
                              setCitationStyle(cs.id)
                              setCitationManuallySet(true)
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                                : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default'
                            }`}
                          >
                            <p className="text-xs font-semibold">{cs.label}</p>
                            <p className="text-[10px] text-kumo-subtle mt-0.5 line-clamp-1">{cs.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 3: AI ENGINE & PROFILE
              ══════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Avatar & Display Name */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-kumo-line bg-kumo-base">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className={`relative w-16 h-16 rounded-full border-2 border-dashed transition-all group cursor-pointer shrink-0 ${
                        avatarPreview
                          ? 'border-indigo-500'
                          : 'border-kumo-line hover:border-indigo-500/50 hover:bg-kumo-tint'
                      }`}
                    >
                      {avatarPreview ? (
                        <>
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full rounded-full object-cover"
                          />
                          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={16} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Camera size={20} className="text-kumo-inactive" />
                        </div>
                      )}
                      {avatarProcessing && (
                        <div className="absolute inset-0 rounded-full bg-kumo-elevated/80 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                        if (file) handleFileSelect(file)
                        e.target.value = ''
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-kumo-default mb-1">
                        Student / Researcher Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="How Volt should address you"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-kumo-line bg-kumo-elevated text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[10px] text-kumo-subtle mt-1">
                        Used in academic papers, technical reports, and chat dialogue.
                      </p>
                    </div>
                  </div>

                  {/* AI Model Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-kumo-default">
                        Primary Academic AI Engine
                      </label>
                      <button
                        type="button"
                        onClick={() => setAddModelOpen(true)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        + Add Custom Model
                      </button>
                    </div>

                    {modelsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {models.map((model) => {
                          const isSelected = selectedModelId === model.id
                          const isGlm = model.id.includes('glm-5.3')
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => setSelectedModelId(model.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                  : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-kumo-tint text-kumo-subtle'
                                  }`}
                                >
                                  ⚡
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-kumo-default truncate">
                                      {model.name}
                                    </p>
                                    {isGlm && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                                        Academic Primary
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-kumo-subtle truncate">{model.id}</p>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle
                                  size={16}
                                  weight="fill"
                                  className="text-indigo-500 shrink-0"
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 4: LAUNCH REVIEW & SHOWCASE
              ══════════════════════════════════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  {/* Identity Review Card */}
                  <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-kumo-base to-kumo-base p-5 space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/30 shrink-0 overflow-hidden">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayName.slice(0, 2).toUpperCase() || 'ST'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-kumo-default truncate">
                            {displayName || 'Student Scholar'}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                            Verified Scholar
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">
                          {finalUniversity}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-kumo-line/60">
                      <div className="p-2.5 rounded-xl bg-kumo-tint">
                        <p className="text-[10px] text-kumo-subtle">Degree Program</p>
                        <p className="text-xs font-semibold text-kumo-default truncate mt-0.5">
                          {degreeProgram}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-kumo-tint">
                        <p className="text-[10px] text-kumo-subtle">Standing &amp; Term</p>
                        <p className="text-xs font-semibold text-kumo-default truncate mt-0.5">
                          {academicYear}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-kumo-tint">
                        <p className="text-[10px] text-kumo-subtle">Citation Standard</p>
                        <p className="text-xs font-semibold text-indigo-400 truncate mt-0.5">
                          {citationStyle} Standard
                        </p>
                      </div>
                    </div>

                    {/* Enrolled Courses Badges */}
                    <div>
                      <p className="text-[10px] font-semibold text-kumo-subtle uppercase tracking-wider mb-1.5">
                        Enrolled Courses ({activeEnrolledCourses.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeEnrolledCourses.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-kumo-line bg-kumo-base"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                            {c.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capabilities Banner */}
                  <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-kumo-default">
                      <Sparkle size={14} className="text-indigo-400" weight="fill" />
                      What Volt Will Do For You
                    </div>
                    <ul className="text-xs text-kumo-subtle space-y-1 pl-4 list-disc leading-relaxed">
                      <li>Solve STEM equations with step-by-step LaTeX derivations and proofs.</li>
                      <li>Generate formatted academic research papers using your {citationStyle} standard.</li>
                      <li>Predict university exam questions tailored to your enrolled courses.</li>
                      <li>Keep all chats and documents scoped to {finalUniversity}.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-kumo-line bg-kumo-elevated">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs font-semibold text-kumo-subtle hover:text-kumo-default transition-colors px-3 py-2"
                >
                  <ArrowLeft size={13} weight="bold" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {step < TOTAL_STEPS - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25"
                  >
                    Continue
                    <ArrowRight size={13} weight="bold" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {finishing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Provisioning Workspace...
                      </>
                    ) : (
                      <>
                        <Lightning size={14} weight="fill" />
                        Launch Academic Workspace
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddModelModal
        visible={addModelOpen}
        onCancel={() => setAddModelOpen(false)}
        onSuccess={() => {
          setAddModelOpen(false)
          fetchModels()
        }}
        authenticatedApi={authenticatedApi}
        aiConfig={aiConfig}
      />
    </>
  )
}
