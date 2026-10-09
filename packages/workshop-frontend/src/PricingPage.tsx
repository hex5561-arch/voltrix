import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useDocumentTitle } from './useDocumentTitle'
import { useOptionalAuthenticatedApi } from './AuthContext'
import { getStudentProfile } from './services/studentProfile'
import {
  BookOpen, FileText, CheckCircle, ArrowRight, ArrowLeft,
  X, Hexagon, GraduationCap, ShieldCheck,
  Key, Lock, Check,
  CreditCard, DeviceMobile, Tray, CalendarBlank
} from '@phosphor-icons/react'
import InboxModal from './components/InboxModal'

// ─── Types ───────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual'
type AcademicSector = 'higher_ed' | 'secondary'

interface Plan {
  id: string
  sector?: AcademicSector
  label: string
  tagline: string
  monthlyUsd: number
  annualUsd: number
  perSeatMonthly?: number
  minSeats?: number
  dailyQueries: number
  features: string[]
  highlighted: boolean
  cta: string
}

interface PlanReason {
  id: string
  icon: string
  title: string
  summary: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSEHERO_API = '/api'

// Hardcoded FX rates. Localized for East Africa and global markets.
const FX: Record<string, { rate: number; symbol: string; code: string }> = {
  UGX: { rate: 3750,  symbol: 'USh ', code: 'UGX' },
  KES: { rate: 130,   symbol: 'KSh ', code: 'KES' },
  TZS: { rate: 2650,  symbol: 'TSh ', code: 'TZS' },
  RWF: { rate: 1350,  symbol: 'FRw ', code: 'RWF' },
  NGN: { rate: 1550,  symbol: '₦',    code: 'NGN' },
  GHS: { rate: 15.5,  symbol: '₵',    code: 'GHS' },
  USD: { rate: 1,     symbol: '$',    code: 'USD' },
  GBP: { rate: 0.79,  symbol: '£',    code: 'GBP' },
  EUR: { rate: 0.92,  symbol: '€',    code: 'EUR' },
  ZAR: { rate: 18.5,  symbol: 'R',    code: 'ZAR' },
}

const PLANS: Plan[] = [
  // ── Higher Education Sector ──
  {
    id: 'free',
    sector: 'higher_ed',
    label: 'Starter',
    tagline: 'Essential AI tools & study workspace for individual scholars',
    monthlyUsd: 0,
    annualUsd: 0,
    dailyQueries: 10,
    highlighted: false,
    cta: 'Your current plan',
    features: [
      '10 AI queries per day',
      'Llama 3.3 & Gemini Flash models',
      'Coursework research drafting & editor',
      '5 MB file upload limit',
      'LaTeX mathematical equation rendering',
      'Export to Markdown & Plaintext',
    ],
  },
  {
    id: 'scholar',
    sector: 'higher_ed',
    label: 'Scholar Pro',
    tagline: 'Comprehensive research, STEM proofs & coding power for university scholars',
    monthlyUsd: 9.99,
    annualUsd: 79.99,
    dailyQueries: 500,
    highlighted: true,
    cta: 'Start now',
    features: [
      '500 AI queries per day (unlimited during exams)',
      'Reasoning Models: Claude 3.5 Sonnet, GPT-4o, DeepSeek R1',
      'Ultra-fast token streaming (800+ tok/s)',
      'Multi-document RAG (PDFs, URLs, YouTube lectures)',
      'Socratic Code Review & Big-O breakdown',
      'LaTeX & SymPy math derivations with proofs',
      'Writing Coach & Academic Paraphraser',
      '50 MB document ingestion per upload',
      '1-click Word (.docx) & PDF publication export',
    ],
  },
  {
    id: 'cohort',
    sector: 'higher_ed',
    label: 'Study Cohort / Group',
    tagline: 'Collaborative research, shared lecture RAG & 6-char PIN join code for 5–25 students',
    monthlyUsd: 22.45,
    annualUsd: 179.99,
    perSeatMonthly: 4.49,
    minSeats: 5,
    dailyQueries: 1500,
    highlighted: false,
    cta: 'Start now',
    features: [
      '5 to 25 shared student seats with instant 6-char PIN join codes',
      'Shared Cohort Document Vault (upload textbook/slides once)',
      'Shared query pool (1,500 queries/day pooled)',
      'Collaborative coursework revision & study group chat',
      'Department / Lead Student admin dashboard',
      'Split billing & Mobile Money / Card checkout',
    ],
  },
  {
    id: 'campus',
    sector: 'higher_ed',
    label: 'Campus Institutional',
    tagline: 'Departmental oversight, Socratic cheating lock, custom rubrics & LMS sync',
    monthlyUsd: 149.00,
    annualUsd: 1190.00,
    dailyQueries: 10000,
    highlighted: false,
    cta: 'Start now',
    features: [
      'Unlimited student enrollments under departmental domain',
      'Educator Cockpit: Socratic Guidance toggle (prevents direct answer copy-pasting)',
      'Class struggle detection & topic mastery heatmaps',
      'Moodle / Canvas LMS roster sync plugin endpoints',
      'Custom faculty grading rubric importer & audit presets',
      'Bulk multi-language academic document translation',
      'Dedicated SLA, institutional compliance & audit logs',
    ],
  },

  // ── Secondary / High School Sector ──
  {
    id: 'secondary_candidate',
    sector: 'secondary',
    label: 'Candidate Revision Pass',
    tagline: 'Targeted syllabus mastery, step-by-step math solver & past paper breakdown',
    monthlyUsd: 4.99,
    annualUsd: 39.99,
    dailyQueries: 200,
    highlighted: true,
    cta: 'Start now',
    features: [
      'National past paper breakdowns (UNEB / KCSE / WAEC / GCSE)',
      'Step-by-step formula explanations for Physics, Chemistry & Math',
      'Socratic hint tutor: guides student thinking without spoiling answers',
      'Audio & diagram explainer for biology & geography cycles',
      'Parent & Guardian weekly progress summary export',
    ],
  },
  {
    id: 'secondary_stream',
    sector: 'secondary',
    label: 'Class Stream / Study Squad',
    tagline: 'Teacher broadcast hub & instant PIN joining for classes (10–45 pupils)',
    monthlyUsd: 24.90,
    annualUsd: 199.00,
    perSeatMonthly: 2.49,
    minSeats: 10,
    dailyQueries: 3500,
    highlighted: false,
    cta: 'Start now',
    features: [
      '10 to 45 student seats with simple 6-character class join code',
      'Teacher Variable Levers: daily query caps & Exam Lockout during tests',
      'Curriculum alignment: UNEB UCE/UACE, KNEC KCSE, WAEC, GCSE',
      'Class announcement broadcaster directly to student screens',
      'Automatic homework feedback & concept explanation generator',
    ],
  },
  {
    id: 'secondary_academy',
    sector: 'secondary',
    label: 'Whole-School Academy',
    tagline: 'Complete secondary institution deployment with grade-level oversight',
    monthlyUsd: 199.00,
    annualUsd: 1590.00,
    dailyQueries: 25000,
    highlighted: false,
    cta: 'Start now',
    features: [
      'Whole-school access across all streams and grade levels',
      'Teacher AI Assistant: 1-click lesson planning, quiz & worksheet generation',
      'Strict Academic Integrity: locked Socratic mode for students',
      'Principal & Head of Department curriculum coverage dashboard',
      'Offline/low-bandwidth compressed responses for school computer labs',
      'Multi-teacher co-admin permissions & centralized school billing',
    ],
  },
]

const PROMO_CODES: Record<string, number> = {
  STUDENT30: 30,
  CAMPUS50:  50,
  EXAM2026:  40,
  VOLT20:    20,
}

const FALLBACK_REASONS: PlanReason[] = [
  {
    id: 'integrity',
    icon: 'ShieldCheck',
    title: 'Guaranteed Academic Integrity & Socratic Mode',
    summary: 'Prevent AI from writing homework for students. Educators can lock the cohort to Socratic Mode, compelling the model to ask guiding questions, verify student working, and scaffold conceptual mastery rather than outputting raw solutions.'
  },
  {
    id: 'curriculum',
    icon: 'BookOpen',
    title: 'Regional Exam Board & Curriculum Calibration',
    summary: 'Pre-calibrated for national curricula—including UNEB (UCE/UACE), KNEC (KCSE), WAEC (WASSCE), Cambridge GCSE/A-Levels, and AP. Learner queries match authentic marking guides and local syllabus depth.'
  },
  {
    id: 'levers',
    icon: 'ChartBar',
    title: 'Educator Variable Control Levers',
    summary: 'Department heads and teachers gain precise control over AI tools: dial daily query caps per learner, toggle solution generation on/off, schedule Exam Mode lockouts during live assessments, and upload custom grading rubrics.'
  },
  {
    id: 'struggle',
    icon: 'Brain',
    title: 'Early Struggle Detection & Mastery Heatmaps',
    summary: 'Know which topics pupils or undergrads are finding difficult before exam results arrive. The educator cockpit tracks aggregated question themes (e.g. Organic Chemistry, Calculus, Data Structures) in real time without compromising individual student privacy.'
  },
  {
    id: 'provisioning',
    icon: 'Key',
    title: 'Frictionless 6-Char PIN & Magic Link Join',
    summary: 'Eliminate tedious student account setup. Instructors generate a simple 6-character PIN code (e.g. MAK-26, BDO-19) that students type on their phone or laptop to instantly bind to the cohort plan and shared syllabus library.'
  },
  {
    id: 'savings',
    icon: 'Coins',
    title: 'Up to 60% Multi-Seat Cost Advantage',
    summary: 'Pooled licenses drop per-learner rates as low as $2.49/month, with unified institutional invoicing, split student contributions, and direct Mobile Money (MTN, Airtel, M-Pesa) or card payment.'
  }
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localPrice(usd: number, currencyCode: string): number {
  const fx = FX[currencyCode] ?? FX.USD
  const raw = usd * fx.rate
  if (fx.rate >= 1000) return Math.round(raw / 100) * 100
  if (fx.rate >= 100)  return Math.round(raw / 10) * 10
  if (fx.rate >= 10)   return Math.round(raw)
  return parseFloat(raw.toFixed(2))
}

function formatPrice(usd: number, currencyCode: string): string {
  if (usd === 0) return 'Free'
  const fx = FX[currencyCode] ?? FX.USD
  const price = localPrice(usd, currencyCode)
  return `${fx.symbol}${price.toLocaleString()}`
}

// ─── Checkout State Machine ───────────────────────────────────────────────────

type CheckoutStep = 'idle' | 'form' | 'loading' | 'payment' | 'success' | 'failed'

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  currency,
  discount,
  selected,
  onSelect,
  isCurrentPlan,
}: {
  plan: Plan
  billing: BillingCycle
  currency: string
  discount: number
  selected: boolean
  onSelect: () => void
  isCurrentPlan?: boolean
}) {
  const baseUsd = billing === 'annual' ? plan.annualUsd / 12 : plan.monthlyUsd
  const discountedUsd = baseUsd * (1 - discount / 100)
  const isFree = plan.id === 'free'

  return (
    <div
      onClick={isCurrentPlan ? undefined : onSelect}
      className={[
        'relative rounded-2xl border p-6 transition-all duration-200 flex flex-col',
        plan.highlighted
          ? 'border-indigo-500 bg-zinc-900/90 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700',
        selected && !plan.highlighted ? 'border-indigo-400' : '',
        isCurrentPlan ? 'opacity-80' : 'cursor-pointer hover:-translate-y-0.5',
      ].join(' ')}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow">
          Recommended
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-base font-bold text-white mb-1">{plan.label}</h3>
        <p className="text-zinc-400 text-xs min-h-[32px]">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {isFree ? (
          <div>
            <p className="text-3xl font-extrabold text-white">$0</p>
            <p className="text-xs text-zinc-500 mt-1">Free forever</p>
          </div>
        ) : plan.perSeatMonthly ? (
          <div>
            <p className="text-3xl font-extrabold text-white">
              {formatPrice(plan.perSeatMonthly, currency)}
              <span className="text-xs font-normal text-zinc-400"> /seat/mo</span>
            </p>
            <p className="text-xs text-indigo-400 mt-1 font-mono">
              from {formatPrice(discountedUsd, currency)}/mo ({plan.minSeats || 5}+ seats pooled)
            </p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-extrabold text-white">
              {formatPrice(discountedUsd, currency)}
              <span className="text-xs font-normal text-zinc-400"> /month</span>
            </p>
            {billing === 'annual' && (
              <p className="text-xs text-emerald-400 mt-1">
                Billed annually ({formatPrice(plan.annualUsd * (1 - discount / 100), currency)}/yr)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mb-6">
        {isCurrentPlan ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-xl font-semibold text-xs border border-zinc-700 bg-zinc-800/40 text-zinc-400 cursor-default"
          >
            Your current plan
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              plan.highlighted
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white'
            }`}
          >
            <span>Start now</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2.5 text-xs flex-1">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Features Included</p>
        {plan.features.map((feat, i) => (
          <div key={i} className="flex items-start gap-2 text-zinc-300">
            <Check size={14} weight="bold" className="text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{feat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PricingPage() {
  useDocumentTitle('Upgrade Your Plan · Voltrix OS')

  const auth = useOptionalAuthenticatedApi()
  const currentUser = auth?.currentUser
  const studentProfile = getStudentProfile()

  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [currency, setCurrency] = useState('UGX')
  const [sector, setSector] = useState<AcademicSector>('higher_ed')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('scholar')
  const [promoInput, setPromoInput] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [promoApplied, setPromoApplied] = useState('')

  // Join Cohort State
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joinEmailInput, setJoinEmailInput] = useState('')
  const [joiningCohort, setJoiningCohort] = useState(false)
  const [joinResult, setJoinResult] = useState<{ success?: boolean; error?: string; cohortName?: string } | null>(null)

  // Checkout state: auto-fill from user profile
  const [step, setStep] = useState<CheckoutStep>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState(() => (currentUser?.id?.includes('@') ? currentUser.id : '') || '')
  const [name, setName] = useState(() => studentProfile?.name || currentUser?.name || '')
  const [institution, setInstitution] = useState(() => studentProfile?.university || '')
  const [phone, setPhone] = useState('')
  const [, setIframeUrl] = useState('')
  const [trackId, setTrackId] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Multi-month duration & discount formula
  const [months, setMonths] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card')
  const [autoRenew, setAutoRenew] = useState(true)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardCountry, setCardCountry] = useState('UG')
  const [postalCode, setPostalCode] = useState('')
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'airtel' | 'mpesa'>('mtn')
  const [inboxOpen, setInboxOpen] = useState(false)
  const [formulaTiers] = useState<Array<{ minMonths: number, discountPct: number, label: string }>>([
    { minMonths: 1, discountPct: 0, label: "1 Month" },
    { minMonths: 2, discountPct: 5, label: "2 Months (5% off)" },
    { minMonths: 3, discountPct: 10, label: "3 Months (10% off)" },
    { minMonths: 6, discountPct: 20, label: "6 Months (20% off)" },
    { minMonths: 12, discountPct: 33, label: "12 Months (33% off · 2 Mo Free)" },
    { minMonths: 24, discountPct: 40, label: "24 Months (40% off)" }
  ])

  const [plans, setPlans] = useState<Plan[]>(PLANS)
  const [reasons, setReasons] = useState<PlanReason[]>([])
  const [promos, setPromos] = useState<Record<string, number>>(PROMO_CODES)

  // Auto-fill profile whenever loaded
  useEffect(() => {
    if (!email && currentUser?.id?.includes('@')) {
      setEmail(currentUser.id)
    }
    if (!name && (studentProfile?.name || currentUser?.name)) {
      setName(studentProfile?.name || currentUser?.name || '')
    }
    if (!institution && studentProfile?.university) {
      setInstitution(studentProfile.university)
    }
    if (!joinEmailInput && currentUser?.id?.includes('@')) {
      setJoinEmailInput(currentUser.id)
    }
  }, [currentUser, studentProfile])

  // Silent Edge Geo-Intelligence: fetch geo context without exposing country banner to user
  useEffect(() => {
    fetch('/api/geo/context')
      .then((r) => r.json())
      .then((d: any) => {
        if (d?.success && d.geo?.currency?.code) {
          setCurrency(d.geo.currency.code)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch live plans and promos from backend KV
  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((d: any) => {
        if (d?.success && Array.isArray(d.plans) && d.plans.length > 0) {
          const mapped: Plan[] = d.plans.map((p: any) => ({
            id: p.id === 'pro' ? 'scholar' : p.id,
            sector: p.sector || (p.id.startsWith('secondary_') ? 'secondary' : 'higher_ed'),
            label: p.label || (p.id === 'pro' ? 'Scholar Pro' : p.id === 'campus' ? 'Campus' : 'Starter'),
            tagline: p.description || p.tagline || '',
            monthlyUsd: p.monthly ?? (p.monthlyUsd ?? 0),
            annualUsd: p.annual ?? (p.annualUsd ?? 0),
            perSeatMonthly: p.perSeatMonthly,
            minSeats: p.minSeats,
            dailyQueries: p.dailyQueries ?? 10,
            features: p.features || [],
            highlighted: !!p.isPopular || !!p.highlighted,
            cta: p.cta || (p.monthly === 0 ? 'Your current plan' : 'Start now'),
          }))
          setPlans(mapped)
          if (Array.isArray(d.reasons)) {
            setReasons(d.reasons)
          }
        }
      })
      .catch(() => {})

    fetch('/api/promos')
      .then((r) => r.json())
      .then((d: any) => {
        if (d?.success && Array.isArray(d.promos) && d.promos.length > 0) {
          const promoMap: Record<string, number> = { ...PROMO_CODES }
          for (const pr of d.promos) {
            if (pr.code && pr.active !== false && typeof pr.discountPct === 'number') {
              promoMap[pr.code.toUpperCase()] = pr.discountPct
            }
          }
          setPromos(promoMap)
        }
      })
      .catch(() => {})
  }, [])

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1] || PLANS[1]

  // Handle joining cohort via 6-character PIN
  async function handleJoinCohort(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCodeInput.trim() || !joinEmailInput.trim()) return
    setJoiningCohort(true)
    setJoinResult(null)
    try {
      const res = await fetch('/api/cohorts/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCodeInput.trim().toUpperCase(),
          studentEmail: joinEmailInput.trim().toLowerCase(),
          studentName: name || undefined,
        })
      })
      const data = await res.json() as any
      if (data && data.success) {
        setJoinResult({ success: true, cohortName: data.cohortName })
      } else {
        setJoinResult({ success: false, error: data?.error || 'Invalid or expired cohort PIN code' })
      }
    } catch (err: any) {
      setJoinResult({ success: false, error: err?.message || 'Network error connecting to cohort' })
    } finally {
      setJoiningCohort(false)
    }
  }

  // ── Auto-detect .edu / academic domain discount ─────────────────────────────
  useEffect(() => {
    if (!email || promoApplied) return
    const lower = email.toLowerCase()
    if (
      lower.endsWith('.edu') ||
      lower.includes('.ac.') ||
      lower.includes('mak.ac.ug') ||
      lower.includes('uonbi.ac.ke') ||
      lower.includes('iuea.ac.ug')
    ) {
      setDiscount(30)
    } else {
      setDiscount(0)
    }
  }, [email, promoApplied])

  // ── Promo code ────────────────────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    const pct = promos[code]
    if (pct === undefined) {
      setPromoError('Invalid promo code')
      return
    }
    setDiscount(pct)
    setPromoApplied(code)
    setPromoError('')
    setPromoInput('')
  }

  function clearPromo() {
    setDiscount(0)
    setPromoApplied('')
    setPromoInput('')
    setPromoError('')
  }

  // ── Multi-Month Duration & Dynamic Formula Calculation ──────────────────────
  const getMonthsDiscountPct = (m: number): number => {
    const sorted = [...formulaTiers].sort((a, b) => b.minMonths - a.minMonths)
    const match = sorted.find(t => m >= t.minMonths)
    return match ? match.discountPct : 0
  }

  const termDiscountPct = getMonthsDiscountPct(months)
  const totalDiscountPct = Math.min(100, termDiscountPct + discount)

  const baseMonthlyUsd = selectedPlan.monthlyUsd
  const rawSubtotalUsd = baseMonthlyUsd * months
  const termDiscountUsd = rawSubtotalUsd * (termDiscountPct / 100)
  const finalUsd = parseFloat(Math.max(0, (rawSubtotalUsd * (1 - totalDiscountPct / 100))).toFixed(2))

  async function initiatePayment() {
    if (!email) { setCheckoutError('Email address is required'); return }
    if (paymentMethod === 'card' && !cardNumber.trim()) {
      setCheckoutError('Please enter your card number')
      return
    }
    setIsSubmitting(true)
    setStep('loading')
    setCheckoutError('')
    try {
      const [firstName, ...rest] = name.trim().split(' ')
      const targetCurrency = currency === 'UGX' ? 'UGX' : currency === 'KES' ? 'KES' : currency === 'TZS' ? 'TZS' : 'USD'
      const convertedAmount = targetCurrency === 'UGX' ? Math.round(finalUsd * 3750) : targetCurrency === 'KES' ? Math.round(finalUsd * 129) : targetCurrency === 'TZS' ? Math.round(finalUsd * 2590) : finalUsd

      const res = await fetch(`${COURSEHERO_API}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: email,
          tier: selectedPlan.id === 'scholar' ? 'pro' : selectedPlan.id,
          currency: targetCurrency,
          amount: convertedAmount,
          email,
          phone: phone || '',
          firstName: firstName || 'Scholar',
          lastName: rest.join(' ') || '',
          countryCode: cardCountry,
          planLabel: selectedPlan.label,
          months,
          paymentMethod,
          autoRenew,
          cardDetails: paymentMethod === 'card' ? {
            last4: cardNumber.replace(/\s+/g, '').slice(-4) || '4242',
            postalCode
          } : undefined
        }),
      })
      const data = await res.json() as any
      if (!data.success) {
        throw new Error(data.error ?? 'Payment could not be processed')
      }
      if (data.completed) {
        setTrackId(data.order_tracking_id ?? `ORD-${Date.now().toString().slice(-6)}`)
        setStep('success')
      } else if (data.redirect_url) {
        setIframeUrl(data.redirect_url)
        setTrackId(data.order_tracking_id ?? '')
        setStep('payment')
        startPolling(data.order_tracking_id ?? '')
      }
      setIsSubmitting(false)
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
      setIsSubmitting(false)
    }
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${COURSEHERO_API}/payments/status/${id}`)
        const data = await res.json() as { completed?: boolean; status_code?: number }
        if (data.completed || data.status_code === 1) {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setStep('success')
        }
      } catch { /* keep polling */ }
    }, 4500)
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <Hexagon weight="fill" size={22} className="text-indigo-400" />
          <span className="font-bold text-sm tracking-wide text-white">Voltrix OS</span>
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors font-medium">
            Open Workspaces
          </Link>
        </div>
      </nav>

      {/* ══ VIEW 1: PLAN BROWSING (Matching ChatGPT Screencast 00:03 - 00:08) ══ */}
      {step === 'idle' ? (
        <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
          
          {/* ChatGPT Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Upgrade your plan
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Select the intelligence tier, reasoning models, and collaboration limits tailored for your study workflow.
            </p>
          </div>

          {/* ChatGPT Segment Tab: Higher Education vs Secondary Schools */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl gap-1">
              <button
                onClick={() => {
                  setSector('higher_ed')
                  setSelectedPlanId('scholar')
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition ${
                  sector === 'higher_ed'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GraduationCap weight={sector === 'higher_ed' ? 'fill' : 'regular'} size={15} />
                Higher Education
              </button>
              <button
                onClick={() => {
                  setSector('secondary')
                  setSelectedPlanId('secondary_candidate')
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition ${
                  sector === 'secondary'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen weight={sector === 'secondary' ? 'fill' : 'regular'} size={15} />
                Secondary &amp; High Schools
              </button>
            </div>
          </div>

          {/* Billing Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-xs">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
                  billing === 'monthly' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  billing === 'annual' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Annual
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                  Save 33%
                </span>
              </button>
            </div>

            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {Object.entries(FX).map(([code, { symbol }]) => (
                <option key={code} value={code}>{symbol} {code}</option>
              ))}
            </select>
          </div>

          {/* Plan Cards Grid: Clean, Uncongested */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {plans.filter(p => !p.sector || p.sector === sector).map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                currency={currency}
                discount={discount}
                selected={selectedPlanId === plan.id}
                isCurrentPlan={plan.id === 'free'}
                onSelect={() => {
                  setSelectedPlanId(plan.id)
                  setStep('form')
                }}
              />
            ))}
          </div>

          {/* Cohort PIN Code Quick Join Banner */}
          <div className="max-w-2xl mx-auto mb-14 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Key size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Have a Department, Class, or Study Group PIN?</h3>
                <p className="text-xs text-zinc-400">Enter your 6-character code (e.g. MAK-48, GHS-22, UON-91) to bind to your cohort plan.</p>
              </div>
            </div>
            <form onSubmit={handleJoinCohort} className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                type="text"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="PIN (e.g. MAK-48)"
                className="w-full sm:w-40 uppercase bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs font-bold tracking-wider px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="email"
                value={joinEmailInput}
                onChange={e => setJoinEmailInput(e.target.value)}
                placeholder="Your student email address"
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={joiningCohort}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                {joiningCohort ? 'Joining...' : 'Join Cohort'}
              </button>
            </form>
            {joinResult && (
              <div className={`mt-3 text-xs p-3 rounded-xl flex items-center gap-2 ${
                joinResult.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' : 'bg-red-950/60 text-red-300 border border-red-800/50'
              }`}>
                {joinResult.success ? (
                  <>
                    <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                    <span>Successfully joined <strong>{joinResult.cohortName}</strong>! Your account has been provisioned with cohort privileges.</span>
                  </>
                ) : (
                  <>
                    <X size={16} weight="bold" className="text-red-400 shrink-0" />
                    <span>{joinResult.error}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Institutional Values Accordion */}
          <div className="max-w-4xl mx-auto mb-14">
            <h2 className="text-xl font-bold text-center mb-6">Why Institutions &amp; Groups Choose Voltrix OS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(reasons.length > 0 ? reasons : FALLBACK_REASONS).map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <ShieldCheck size={16} weight="fill" />
                    <h3>{r.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{r.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ══ VIEW 2: DEDICATED CONFIGURE YOUR PLAN (Matching ChatGPT Paywall & Screencast) ══ */
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          
          {/* Back Header */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80 mb-8">
            <button
              type="button"
              onClick={() => {
                setStep('idle')
                setIframeUrl('')
              }}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back to plans</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Lock size={14} />
              <span className="text-zinc-300">Voltrix 256-bit Encrypted Checkout</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT COLUMN: Subscriber Details, Duration & ChatGPT Paywall ── */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white">Configure your plan</h1>
                <p className="text-xs text-zinc-400">
                  Select your subscription duration and payment method. Auto-filled from your scholar profile.
                </p>
              </div>

              {step === 'success' ? (
                /* ── CLEAN CONFIRMATION (No Cluttering Invoices) ── */
                <div className="bg-zinc-900 border border-emerald-800/60 rounded-2xl p-8 text-center space-y-5">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
                    <CheckCircle weight="fill" size={32} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Payment Confirmed!</h2>
                    <p className="text-xs text-zinc-300">
                      Your subscription to <strong className="text-indigo-400">{selectedPlan.label}</strong> is active for <strong className="text-white">{months} month(s)</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-left space-y-2 text-zinc-400">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Check size={14} weight="bold" />
                      <span>Payment receipt sent to your email ({email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                      <FileText size={14} weight="fill" />
                      <span>Official Tax Invoice saved to your Voltrix Inbox</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 pt-1">
                      Reference: <span className="font-mono text-zinc-300">{trackId || 'CONFIRMED'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setInboxOpen(true)}
                      className="px-5 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Tray size={15} weight="fill" />
                      View Invoice in Inbox
                    </button>
                    <Link
                      to="/"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                    >
                      Open Workspaces
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── SCHOLAR DETAILS & CHATGPT PAYWALL ── */
                <div className="space-y-6">
                  
                  {/* Subscriber Details */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Scholar Information
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                        <span>Email address</span>
                        {email && (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Check size={10} weight="bold" /> Autofilled from profile
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. scholar@university.ac.ug"
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                          <span>Full name</span>
                          {name && <span className="text-[10px] text-emerald-400 font-mono">Autofilled</span>}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Kato John"
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                          <span>Institution / University</span>
                          {institution && <span className="text-[10px] text-emerald-400 font-mono">Autofilled</span>}
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={e => setInstitution(e.target.value)}
                          placeholder="e.g. Makerere University"
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Month Duration Selector */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarBlank size={14} className="text-indigo-400" />
                        <span>Subscription Duration</span>
                      </div>
                      {termDiscountPct > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {termDiscountPct}% Term Discount Applied
                        </span>
                      )}
                    </div>

                    {/* Quick selection chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { count: 1, label: '1 Month', note: 'Standard' },
                        { count: 3, label: '3 Months', note: '10% off' },
                        { count: 6, label: '6 Months', note: '20% off' },
                        { count: 12, label: '12 Months', note: '33% off' },
                      ].map(chip => (
                        <button
                          key={chip.count}
                          type="button"
                          onClick={() => setMonths(chip.count)}
                          className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center cursor-pointer ${
                            months === chip.count
                              ? 'border-indigo-500 bg-indigo-950/40 text-white shadow'
                              : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-xs font-bold">{chip.label}</span>
                          <span className={`text-[10px] mt-0.5 font-medium ${months === chip.count ? 'text-indigo-300' : 'text-zinc-500'}`}>
                            {chip.note}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom typed months input */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400">Or type custom number of months:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={36}
                          value={months}
                          onChange={e => setMonths(Math.max(1, Math.min(36, parseInt(e.target.value) || 1)))}
                          className="w-20 bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-center text-xs px-2 py-1.5 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-400">months</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Native ChatGPT Paywall (Card & Mobile Money) ── */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Payment Method
                    </div>

                    {/* Tabs: Card vs Mobile Money */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-zinc-800 text-white shadow'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <CreditCard size={15} />
                        <span>Credit / Debit Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile_money')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                          paymentMethod === 'mobile_money'
                            ? 'bg-zinc-800 text-white shadow'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <DeviceMobile size={15} />
                        <span>Mobile Money</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      /* Card Paywall Fields (ChatGPT / Stripe style) */
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                            <span>Card number</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">VISA</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">MC</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">AMEX</span>
                            </div>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              maxLength={19}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                                setCardNumber(val)
                              }}
                              placeholder="1234 5678 9012 3456"
                              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none tracking-wider"
                            />
                            <div className="absolute right-3 top-2.5 text-zinc-500">
                              <Lock size={14} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                              Expiration Date
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={e => {
                                let v = e.target.value.replace(/\D/g, '')
                                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`
                                setCardExpiry(v)
                              }}
                              placeholder="MM / YY"
                              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                              Security Code (CVC)
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              value={cardCvc}
                              onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                              placeholder="CVC"
                              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none text-center"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                              Country / Region
                            </label>
                            <select
                              value={cardCountry}
                              onChange={e => setCardCountry(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                            >
                              <option value="UG">Uganda</option>
                              <option value="KE">Kenya</option>
                              <option value="TZ">Tanzania</option>
                              <option value="RW">Rwanda</option>
                              <option value="US">United States</option>
                              <option value="GB">United Kingdom</option>
                              <option value="ZA">South Africa</option>
                              <option value="NG">Nigeria</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                              Postal / ZIP code
                            </label>
                            <input
                              type="text"
                              value={postalCode}
                              onChange={e => setPostalCode(e.target.value)}
                              placeholder="e.g. 00256"
                              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* ChatGPT Recurring Consent Checkbox */}
                        <div className="pt-3 border-t border-zinc-800/60">
                          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300 select-none">
                            <input
                              type="checkbox"
                              checked={autoRenew}
                              onChange={e => setAutoRenew(e.target.checked)}
                              className="mt-0.5 rounded border-zinc-700 text-indigo-600 focus:ring-0 focus:outline-none cursor-pointer accent-indigo-600"
                            />
                            <span className="leading-relaxed text-[11px] text-zinc-400">
                              Authorize automatic recurring charges: Save my payment details and charge this card automatically every {months > 1 ? `${months} months` : 'month'} until I cancel in settings.
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Money Paywall Fields */
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">
                            Mobile Money Operator
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'mtn', label: 'MTN MoMo' },
                              { id: 'airtel', label: 'Airtel Money' },
                              { id: 'mpesa', label: 'M-Pesa' }
                            ].map(op => (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() => setMomoProvider(op.id as any)}
                                className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                                  momoProvider === op.id
                                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {op.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">
                            Subscriber Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder={currency === 'KES' ? '+254 700 000000' : '+256 770 000000'}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                          <p className="text-[11px] text-zinc-500 mt-1.5">
                            You will receive an instant payment prompt on your phone to input your PIN and authorize the transfer.
                          </p>
                        </div>
                      </div>
                    )}

                    {checkoutError && (
                      <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs">
                        {checkoutError}
                      </div>
                    )}

                    <div className="pt-2 text-[10px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60">
                      <span>256-bit Bank-Grade Encryption</span>
                      <span>PCI-DSS Level 1 Secure</span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Plan Summary Card (Matches ChatGPT Right Card) ── */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl sticky top-24">
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-white">{selectedPlan.label}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                    {months === 1 ? 'Monthly' : `${months} Months`}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{selectedPlan.tagline}</p>
              </div>

              {/* Top Features */}
              <div className="space-y-2 border-t border-b border-zinc-800 py-4 text-xs">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Top Features</p>
                {selectedPlan.features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-zinc-300">
                    <Check size={14} weight="bold" className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown with Multi-Month Duration */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Duration:</span>
                  <span className="text-zinc-200">{months} month(s)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Monthly base rate:</span>
                  <span>{formatPrice(baseMonthlyUsd, currency)}/mo</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span>{formatPrice(rawSubtotalUsd, currency)}</span>
                </div>
                {termDiscountPct > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Multi-Month Discount:</span>
                    <span>-{termDiscountPct}% (-{formatPrice(termDiscountUsd, currency)})</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Promo Discount:</span>
                    <span>-{discount}%</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>VAT / Processing Fees:</span>
                  <span>{formatPrice(0, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                  <span className="font-sans">Total due today:</span>
                  <span className="text-emerald-400 font-extrabold">{formatPrice(finalUsd, currency)}</span>
                </div>
              </div>

              {/* Promo Input */}
              {discount === 0 ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo or campus code"
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-xs px-3 py-2 rounded-xl text-zinc-100 uppercase font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <span>Code <strong>{promoApplied}</strong> applied ({discount}% off)</span>
                  <button type="button" onClick={clearPromo} className="text-zinc-400 hover:text-white">✕</button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-400">{promoError}</p>}

              {/* Primary CTA Button (ChatGPT Style) */}
              {step !== 'success' && (
                <button
                  type="button"
                  disabled={!email || isSubmitting}
                  onClick={initiatePayment}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Secure Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} weight="bold" />
                      <span>Subscribe · {formatPrice(finalUsd, currency)}</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                Billed for {months} month(s). Cancel anytime from your account settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Inbox & Invoices Modal */}
      <InboxModal isOpen={inboxOpen} onClose={() => setInboxOpen(false)} />
    </div>
  )
}
