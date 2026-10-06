/**
 * UpgradeModal — ported from coursehero/PricingModal.jsx
 * Changes from source:
 *  - lucide → @phosphor-icons/react
 *  - useAuth / api → props / direct fetch to https://voltrix.stream/api
 *  - var(--*) CSS tokens → inline dark-theme literals
 *  - JSX → TSX (typed)
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  X, Check, ShieldCheck, Spinner, CheckCircle, CheckCircle as CheckCircle2,
  WarningCircle, CaretRight, CaretLeft, GraduationCap, ArrowsOut, ArrowsIn,
  Sparkle, Star, Lightning, ArrowRight, Question, CaretDown,
  CaretUp, Medal, FileText, CheckFat, PencilSimple,
} from '@phosphor-icons/react'

// ─── Plans ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  label: string
  badge: string | null
  description: string
  monthly: number
  annual: number
  dailyQueries: number
  isPopular: boolean
  active?: boolean
  cta: string
  features: string[]
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Starter',
    badge: null,
    description: 'Essential AI tools & study workspace for individual students',
    monthly: 0, annual: 0, dailyQueries: 10, isPopular: false, active: true,
    cta: 'Current Plan',
    features: [
      '10 AI queries per day',
      'Llama 3.3 & Gemini Flash models',
      'Basic coursework drafting & editor',
      '5 MB file upload limit',
      'LaTeX mathematical equation rendering',
      'Export to Markdown & Plaintext',
    ],
  },
  {
    id: 'pro',
    label: 'Scholar Pro',
    badge: 'Most Popular',
    description: 'Comprehensive research, STEM proofs & coding power for scholars',
    monthly: 9.99, annual: 79.99, dailyQueries: 500, isPopular: true, active: true,
    cta: 'Upgrade to Pro',
    features: [
      '500 AI queries/day (unlimited during exams)',
      'Claude 3.5 Sonnet, GPT-4o & DeepSeek R1',
      'Groq LPU ultra-fast streaming (800+ tok/s)',
      'Multi-document RAG (PDFs, URLs, YouTube)',
      'Socratic Code Review & Big-O breakdown',
      'LaTeX & SymPy step-by-step proofs',
      'Writing Coach & Gradescope Rubric Audit',
      '50 MB document ingestion per upload',
      '1-click Word (.docx) & PDF publication export',
    ],
  },
  {
    id: 'campus',
    label: 'Campus Institutional',
    badge: 'For Cohorts & Labs',
    description: 'Multi-seat access, custom course rubrics & priority compute for study groups',
    monthly: 34.99, annual: 279.99, dailyQueries: 2500, isPopular: false, active: true,
    cta: 'Get Campus Access',
    features: [
      'Everything in Scholar Pro',
      '2,500 queries/day with multi-seat sharing',
      'High-throughput priority queue (0ms wait)',
      'OpenAlex 250M+ literature ingestion',
      'Custom department rubric matching',
      'Admin analytics & cohort audit logging',
      'Dedicated SLA & institutional priority support',
    ],
  },
]

// ─── Currencies & FX ──────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'USD', symbol: '$',   label: 'US Dollar'           },
  { code: 'EUR', symbol: '€',   label: 'Euro'                },
  { code: 'GBP', symbol: '£',   label: 'British Pound'       },
  { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar'   },
  { code: 'CAD', symbol: 'C$',  label: 'Canadian Dollar'     },
  { code: 'ZAR', symbol: 'R',   label: 'South African Rand'  },
  { code: 'KES', symbol: 'KES', label: 'Kenyan Shilling'     },
  { code: 'UGX', symbol: 'UGX', label: 'Ugandan Shilling'    },
  { code: 'TZS', symbol: 'TZS', label: 'Tanzanian Shilling'  },
  { code: 'NGN', symbol: '₦',   label: 'Nigerian Naira'      },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi'       },
  { code: 'RWF', symbol: 'RWF', label: 'Rwandan Franc'       },
  { code: 'ZMW', symbol: 'ZMW', label: 'Zambian Kwacha'      },
  { code: 'INR', symbol: '₹',   label: 'Indian Rupee'        },
  { code: 'JPY', symbol: '¥',   label: 'Japanese Yen'        },
  { code: 'CNY', symbol: '¥',   label: 'Chinese Yuan'        },
]

const FX: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.53, CAD: 1.36,
  ZAR: 18.5, KES: 130, UGX: 3700, TZS: 2550, NGN: 1580,
  GHS: 12.5, RWF: 1280, ZMW: 27, INR: 83, JPY: 149, CNY: 7.2,
}

function localPrice(usd: number, code: string): number {
  const rate = FX[code] ?? 1
  const raw = usd * rate
  if (rate >= 100) return Math.round(raw / 100) * 100
  if (rate >= 10)  return Math.round(raw / 10) * 10
  return parseFloat(raw.toFixed(2))
}

// ─── Comparison Specs ─────────────────────────────────────────────────────────

const COMPARISON_SPECS = [
  {
    category: 'AI Reasoning & Intelligence Models',
    features: [
      { name: 'Foundational Models (Llama 3.3, Gemini Flash)',                          free: '10 queries/day',          pro: 'Unlimited',                        campus: 'Unlimited'                          },
      { name: 'Flagship Reasoning (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1)',            free: '—',                       pro: 'Included',                         campus: 'Included + Dedicated Priority'      },
      { name: 'Groq LPU Ultra-Low Latency (800+ tok/s)',                                free: '—',                       pro: 'Standard',                         campus: 'Priority High-Throughput'           },
      { name: 'OpenAlex 250M+ Academic Literature Grounding',                           free: 'Basic (3 citations)',      pro: 'Full Corpus Search',               campus: 'Deep Literature Ingestion'          },
    ],
  },
  {
    category: 'STEM, Proofs & Academic Workflow',
    features: [
      { name: 'LaTeX Step-by-Step Problem Solver',                                      free: 'Standard',                pro: 'Step-by-Step + SymPy Code',        campus: 'Step-by-Step + SymPy Code'          },
      { name: 'Socratic Code Review & Big-O Complexity Breakdown',                      free: 'Summary',                 pro: 'Full Interactive Socratic',        campus: 'Full Interactive Socratic'          },
      { name: 'Writing Coach & Gradescope Rubric Pre-Audit',                            free: 'Readability only',        pro: 'Comprehensive Diagnostic',         campus: 'Custom Department Rubrics'          },
      { name: 'File Upload & RAG Document Limits',                                      free: '5 MB / file',             pro: '50 MB / file',                     campus: 'Unlimited'                          },
    ],
  },
  {
    category: 'Exporting & Collaboration',
    features: [
      { name: 'Document Exports',                                                       free: 'Markdown, TXT',           pro: 'Word (.docx), PDF, LaTeX, PPTX',   campus: 'Word (.docx), PDF, LaTeX, PPTX'     },
      { name: 'Autonomous Agent UI Skills',                                             free: 'Standard',                pro: 'Full Autonomous Suite',            campus: 'Full Autonomous Suite'              },
      { name: 'Multi-Seat Cohort Sharing & Admin Analytics',                            free: '—',                       pro: '—',                                campus: 'Included'                           },
      { name: 'Support Level',                                                          free: 'Community',               pro: 'Priority Email (<4h)',              campus: 'Dedicated SLA + Account Manager'    },
    ],
  },
]

const FAQS = [
  { q: 'Can I cancel or change my plan anytime?',             a: 'Yes. Cancel anytime in account settings with zero fees. You retain full access until the end of your billing period.' },
  { q: 'How does the academic student discount work?',        a: 'Students with a valid university email (.edu, .ac.uk, .ac.ug, .ac.ke, etc.) or promo code STUDENT30 receive 30% off any tier.' },
  { q: 'Which payment methods are supported in my region?',   a: 'Visa, Mastercard, American Express, M-Pesa, MTN Mobile Money, Airtel Money, and direct bank transfers via Pesapal.' },
  { q: 'What happens to my coursework drafts if I downgrade?',a: 'All projects, notes, flashcards, and citations remain safe. Downgrading only limits daily AI reasoning queries.' },
  { q: 'Can our study group or department get a group discount?', a: 'Yes! The Campus Institutional tier is designed for cohorts and labs with multi-seat licensing and centralized billing.' },
]

const TESTIMONIALS = [
  { quote: "Volt's Socratic code review and LaTeX derivations cut my OS and calculus study time in half.", author: 'Alex T.', role: 'Computer Engineering, Mak', badge: 'Scholar Pro Student' },
  { quote: 'The OpenAlex integration and Gradescope rubric auditor helped me identify gaps before final submission.', author: 'Sarah N.', role: 'Faculty of Law, MUBS', badge: 'Scholar Pro Student' },
  { quote: 'Our distributed systems research group relies on the Campus tier to index lecture videos and synthesize benchmarks.', author: 'David K.', role: 'Distributed Systems Lab, UoN', badge: 'Campus Cohort Lead' },
]

const API = 'https://voltrix.stream/api'

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [plans,             setPlans]             = useState<Plan[]>(DEFAULT_PLANS)
  const [selectedPlanId,    setSelectedPlanId]    = useState('pro')
  const [billing,           setBilling]           = useState<'monthly'|'annual'>('annual')
  const [currency,          setCurrency]          = useState('USD')
  const [email,             setEmail]             = useState('')
  const [name,              setName]              = useState('')
  const [phone,             setPhone]             = useState('')
  const [eduCode,           setEduCode]           = useState('')
  const [discount,          setDiscount]          = useState(false)
  const [promoDiscountPct,  setPromoDiscountPct]  = useState(30)
  const [_promoDesc,        setPromoDesc]         = useState('') // shown in future UI
  const [eduErr,            setEduErr]            = useState(false)
  const [expanded,          setExpanded]          = useState(false)
  const [showComparison,    setShowComparison]    = useState(false)
  const [openFaq,           setOpenFaq]           = useState<number|null>(null)
  const [expandedFeatures,  setExpandedFeatures]  = useState<Record<string,boolean>>({})
  const [editDetails,       setEditDetails]       = useState(false)
  const [step,              setStep]              = useState<'idle'|'loading'|'payment'|'success'|'failed'>('idle')
  const [iframeUrl,         setIframeUrl]         = useState('')
  const [polls,             setPolls]             = useState(0)
  const [errMsg,            setErrMsg]            = useState('')

  const pollRef      = useRef<ReturnType<typeof setInterval>|null>(null)
  const sliderRef    = useRef<HTMLDivElement>(null)
  const emailRef     = useRef<HTMLInputElement>(null)

  // Load plans
  useEffect(() => {
    if (!isOpen) return
    fetch(`${API}/plans`)
      .then(r => r.json())
      .then((d: { plans?: Plan[] } | Plan[]) => {
        const arr = Array.isArray(d) ? d : (d as { plans?: Plan[] }).plans
        if (arr && arr.length > 0) setPlans(arr)
      })
      .catch(() => {})
    setStep('idle'); setIframeUrl(''); setErrMsg(''); setEditDetails(false)
  }, [isOpen])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  if (!isOpen) return null

  const cur           = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
  const activePlans   = plans.filter(p => p.active !== false)
  const selectedPlan  = activePlans.find(p => p.id === selectedPlanId) ?? activePlans.find(p => p.id === 'pro') ?? activePlans[0]
  const usdAmt        = billing === 'annual' ? selectedPlan.annual : selectedPlan.monthly
  const baseAmt       = localPrice(usdAmt, currency)
  const finalAmount   = discount ? Math.round(baseAmt * (1 - promoDiscountPct / 100) * 100) / 100 : baseAmt
  const isLoggedIn    = !!email.trim()

  // ── Handlers ──────────────────────────────────────────────────────────────

  const resetPayment = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('idle'); setIframeUrl(''); setErrMsg(''); setPolls(0)
  }

  const selectPlan = (id: string) => {
    setSelectedPlanId(id)
    if (step === 'payment' || step === 'failed' || step === 'success') resetPayment()
  }

  const scrollSlider = (dir: 'left'|'right') => {
    sliderRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  const toggleFeatureExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleApplyEdu = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = eduCode.trim()
    if (!v) return
    try {
      const res = await fetch(`${API}/payments/validate-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: v, tier: selectedPlan.id, amount: baseAmt, currency }),
      })
      const d = await res.json() as { valid?: boolean; discountPct?: number; description?: string }
      if (d.valid) {
        setDiscount(true); setPromoDiscountPct(d.discountPct ?? 30)
        setPromoDesc(d.description ?? `${d.discountPct}% Discount Applied`)
        setEduErr(false)
      } else { setDiscount(false); setEduErr(true); setPromoDesc('') }
    } catch {
      const lower = v.toLowerCase()
      if (lower.endsWith('.edu') || lower.includes('.ac.') || v.toUpperCase() === 'STUDENT30' || v.toUpperCase() === 'CAMPUS50') {
        setDiscount(true); setPromoDiscountPct(v.toUpperCase() === 'CAMPUS50' ? 50 : 30)
        setPromoDesc('Verified Academic Discount Applied'); setEduErr(false)
      } else { setDiscount(false); setEduErr(true) }
    }
  }

  const proceedToCheckout = async () => {
    if (!email.trim()) { setEditDetails(true); emailRef.current?.focus(); return }
    setStep('loading'); setErrMsg('')
    if (finalAmount <= 0) { setStep('success'); return }
    try {
      const res = await fetch(`${API}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `voltrix-${Date.now()}`,
          tier: selectedPlan.id, currency,
          amount: finalAmount,
          email: email.trim(),
          firstName: name.trim() || 'Scholar',
          phone: phone.trim(),
          countryCode: currency === 'KES' ? 'KE' : currency === 'UGX' ? 'UG' : 'US',
        }),
      })
      const data = await res.json() as { redirect_url?: string; order_tracking_id?: string; error?: string }
      if (!data.redirect_url) throw new Error(data.error ?? 'Payment gateway temporarily unavailable.')
      setIframeUrl(data.redirect_url); setStep('payment'); setPolls(0)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        setPolls(n => n + 1)
        try {
          const sr = await fetch(`${API}/payments/status/${data.order_tracking_id}`)
          const sd = await sr.json() as { completed?: boolean; status_code?: number }
          if (sd.completed || sd.status_code === 1) { clearInterval(pollRef.current!); setStep('success') }
          else if (sd.status_code === 2 || sd.status_code === 3) { clearInterval(pollRef.current!); setErrMsg('Transaction declined. No funds debited.'); setStep('failed') }
        } catch { /* keep polling */ }
      }, 4500)
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Payment initiation failed.')
      setStep('failed')
    }
  }

  const mW = expanded ? '100vw' : '1140px'
  const mH = expanded ? '100vh' : '92vh'

  const inp: React.CSSProperties = {
    width: '100%', background: '#1a1a2e', border: '1px solid #2d2d44',
    borderRadius: 8, padding: '10px 12px', fontSize: '0.83rem',
    color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-2 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}>
      <div className="w-full rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        style={{ background: '#0f0f1a', border: expanded ? 'none' : '1px solid #1e1e33', width: mW, height: mH, maxWidth: '100vw', maxHeight: 'calc(100vh - 16px)', boxShadow: '0 32px 90px rgba(0,0,0,0.75)' }}>

        {/* ── Top Bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 shrink-0 border-b" style={{ borderColor: '#1e1e33', background: '#0f0f1a' }}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' }}>
              <Sparkle weight="fill" className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate" style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  Upgrade Your Academic Velocity
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                  Semester 2026
                </span>
              </div>
              <p className="truncate" style={{ color: '#64748b', fontSize: '0.7rem', margin: '2px 0 0' }}>
                7-day free trial · Cancel anytime with 1-click · Student discounts available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setExpanded(v => !v)} title={expanded ? 'Restore' : 'Full screen'}
              className="hidden sm:flex p-1.5 rounded-lg transition text-slate-400 hover:text-slate-200"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              {expanded ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition text-slate-400 hover:text-slate-200"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Body ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* ══ LEFT: Plan Cards & Extras ══ */}
          <div className="flex-1 lg:overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: '#1e1e33' }}>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl border"
              style={{ background: '#141422', borderColor: '#1e1e33' }}>
              <div className="flex items-center p-1 rounded-xl" style={{ background: '#0f0f1a', border: '1px solid #1e1e33' }}>
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} type="button"
                    onClick={() => { setBilling(b); if (step === 'payment') resetPayment() }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${billing === b ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                    {b === 'monthly' ? 'Monthly Billing' : <>
                      <span>Annual Billing</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)' }}>
                        Save 33% (2 Mo Free)
                      </span>
                    </>}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-slate-400">Currency:</span>
                <select value={currency} onChange={e => { setCurrency(e.target.value); if (step === 'payment') resetPayment() }}
                  style={{ background: '#0f0f1a', border: '1px solid #1e1e33', color: '#e2e8f0', borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>)}
                </select>
                {activePlans.length > 3 && (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => scrollSlider('left')} className="p-1.5 rounded-lg border hover:bg-slate-800 text-slate-300 transition" style={{ background: '#0f0f1a', borderColor: '#1e1e33' }}><CaretLeft size={14} /></button>
                    <button type="button" onClick={() => scrollSlider('right')} className="p-1.5 rounded-lg border hover:bg-slate-800 text-slate-300 transition" style={{ background: '#0f0f1a', borderColor: '#1e1e33' }}><CaretRight size={14} /></button>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Cards */}
            <div ref={sliderRef}
              className={activePlans.length <= 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch' : 'flex overflow-x-auto snap-x snap-mandatory gap-3.5 items-stretch scroll-smooth'}>
              {activePlans.map(p => {
                const isSelected = selectedPlanId === p.id
                const isFree = p.id === 'free' || p.monthly === 0
                const usd = billing === 'annual' ? p.annual : p.monthly
                const loc = localPrice(usd, currency)
                const fin = discount ? Math.round(loc * (1 - promoDiscountPct / 100) * 100) / 100 : loc
                const isExpandedF = !!expandedFeatures[p.id]
                const displayFeatures = isExpandedF ? p.features : p.features.slice(0, 4)
                const hasMore = p.features.length > 4

                return (
                  <div key={p.id} onClick={() => selectPlan(p.id)}
                    className={`relative rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:scale-[1.01] ${activePlans.length > 3 ? 'min-w-[280px] max-w-[320px] flex-shrink-0 snap-start' : ''}`}
                    style={{
                      background: isSelected ? '#141422' : '#0f0f1a',
                      border: isSelected ? '2px solid #6366f1' : p.isPopular ? '1.5px solid rgba(99,102,241,0.5)' : '1px solid #1e1e33',
                      boxShadow: isSelected ? '0 12px 32px rgba(99,102,241,0.25)' : 'none',
                    }}>
                    {p.badge && (
                      <span style={{ position: 'absolute', top: -10, right: 12, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 9px', borderRadius: 20, background: isSelected || p.isPopular ? '#6366f1' : '#1e1e33', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {p.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#818cf8' : '#f1f5f9' }}>{p.label}</span>
                        {p.id === 'free' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#1e2030', color: '#94a3b8' }}>Current</span>}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.35, minHeight: 28, margin: '2px 0 10px' }}>{p.description}</p>

                      {/* Price */}
                      <div className="p-2.5 rounded-xl mb-3" style={{ background: '#0a0a14', border: '1px solid #1e1e33' }}>
                        <div className="flex items-baseline gap-1">
                          <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f1f5f9' }}>
                            {isFree ? 'Free' : `${cur.symbol} ${fin.toLocaleString()}`}
                          </span>
                          {!isFree && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/{billing === 'annual' ? 'yr' : 'mo'}</span>}
                        </div>
                        {!isFree && (
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            {discount && <span className="line-through" style={{ color: '#64748b' }}>{cur.symbol} {loc.toLocaleString()}</span>}
                            <span className="text-emerald-400 font-semibold ml-auto">
                              {billing === 'annual' ? `≈ ${cur.symbol} ${Math.round(fin / 12).toLocaleString()}/mo` : 'Billed monthly'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <button type="button" onClick={e => { e.stopPropagation(); selectPlan(p.id) }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow mb-3 ${isSelected ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : p.isPopular ? 'text-indigo-200 hover:bg-indigo-950' : isFree ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-200 hover:bg-slate-800'}`}
                        style={{ background: isSelected ? undefined : p.isPopular ? '#1e1b4b' : '#1a1a2e', border: isSelected ? 'none' : '1px solid #2d2d44' }}>
                        <span>{isFree ? 'Current Plan' : p.cta}</span>
                        {!isFree && <CaretRight size={14} />}
                      </button>

                      {/* Features */}
                      <div className="pt-2 border-t" style={{ borderColor: '#1e1e33' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
                          {isFree ? 'Included in Starter:' : 'Core Superpowers:'}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {displayFeatures.map((feat, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>
                              <Check size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                        {hasMore && (
                          <button type="button" onClick={e => toggleFeatureExpand(p.id, e)}
                            className="mt-2 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition">
                            <span>{isExpandedF ? 'Show fewer features' : `+${p.features.length - 4} more features`}</span>
                            {isExpandedF ? <CaretUp size={12} /> : <CaretDown size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Student Discount Bar */}
            <div className="p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
              style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: '#6366f1' }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Verified Student & Academic Discount</div>
                  <div className="text-[11px] text-slate-400">
                    Enter your university .edu address or code <code className="font-mono text-emerald-400 font-bold">STUDENT30</code> for 30% off.
                  </div>
                </div>
              </div>
              <form onSubmit={handleApplyEdu} className="flex items-center gap-2">
                <input type="text" value={eduCode} onChange={e => { setEduCode(e.target.value); setEduErr(false) }}
                  placeholder=".edu email or STUDENT30"
                  style={{ ...inp, width: 180, padding: '6px 10px', fontSize: '0.75rem', borderColor: eduErr ? '#ef4444' : discount ? '#10b981' : '#2d2d44' }} />
                <button type="submit" className="px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0"
                  style={{ background: discount ? '#10b981' : '#1e1e33', border: '1px solid #2d2d44', color: discount ? '#fff' : '#e2e8f0' }}>
                  {discount ? 'Applied ✓' : 'Apply'}
                </button>
              </form>
              {eduErr && <span className="text-[11px] text-red-400">Invalid code</span>}
            </div>

            {/* Feature Comparison Toggle */}
            <div>
              <button type="button" onClick={() => setShowComparison(v => !v)}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between border transition hover:bg-slate-800/40"
                style={{ background: '#141422', borderColor: '#1e1e33', color: '#e2e8f0' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Compare Full Tier Specifications & Model Limits</span>
                </div>
                {showComparison ? <CaretUp size={15} /> : <CaretDown size={15} />}
              </button>
              {showComparison && (
                <div className="mt-3 rounded-2xl border overflow-hidden" style={{ background: '#141422', borderColor: '#1e1e33' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: '#0f0f1a', borderBottom: '1px solid #1e1e33' }}>
                        <th className="text-left p-3 font-bold text-slate-400">Capabilities</th>
                        <th className="text-center p-3 font-bold text-slate-400">Starter (Free)</th>
                        <th className="text-center p-3 font-bold text-indigo-400" style={{ background: 'rgba(99,102,241,0.07)' }}>Scholar Pro</th>
                        <th className="text-center p-3 font-bold text-amber-400">Campus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_SPECS.map((cat, ci) => (
                        <React.Fragment key={ci}>
                          <tr style={{ background: '#0a0a14', borderTop: '1px solid #1e1e33' }}>
                            <td colSpan={4} className="px-3 py-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider">{cat.category}</td>
                          </tr>
                          {cat.features.map((f, fi) => (
                            <tr key={fi} style={{ borderTop: '1px solid #1e1e33' }}>
                              <td className="p-3 text-[11px] font-medium text-slate-200">{f.name}</td>
                              <td className="p-3 text-center text-[11px] text-slate-400">{f.free}</td>
                              <td className="p-3 text-center text-[11px] font-semibold text-indigo-300" style={{ background: 'rgba(99,102,241,0.07)' }}>{f.pro}</td>
                              <td className="p-3 text-center text-[11px] font-semibold text-amber-300">{f.campus}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Testimonials */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Medal size={14} className="text-amber-400" /> Trusted by Students & Researchers Worldwide
              </div>
              <div className="grid md:grid-cols-3 gap-2.5">
                {TESTIMONIALS.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl space-y-1.5 border" style={{ background: '#141422', borderColor: '#1e1e33' }}>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} weight="fill" />)}
                    </div>
                    <p className="text-[11px] line-clamp-3 italic text-slate-400">"{t.quote}"</p>
                    <div className="pt-1 border-t flex items-center justify-between" style={{ borderColor: '#1e1e33' }}>
                      <span className="text-[10px] font-bold text-slate-200">{t.author}</span>
                      <span className="text-[9px] font-mono text-slate-500">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Question size={14} className="text-indigo-400" /> Frequently Asked Questions
              </div>
              {FAQS.map((faq, idx) => (
                <div key={idx} className="rounded-xl border overflow-hidden" style={{ background: '#141422', borderColor: '#1e1e33' }}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left p-3 text-xs font-semibold flex items-center justify-between transition text-slate-200">
                    <span>{faq.q}</span>
                    {openFaq === idx ? <CaretUp size={13} /> : <CaretDown size={13} />}
                  </button>
                  {openFaq === idx && (
                    <div className="px-3 pb-3 text-xs border-t pt-2 text-slate-400 leading-relaxed" style={{ borderColor: '#1e1e33' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT: Order Summary & Checkout ══ */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col p-4 sm:p-5 border-t lg:border-t-0"
            style={{ background: '#141422', borderColor: '#1e1e33' }}>

            {/* IDLE */}
            {step === 'idle' && (
              <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                {/* Order Summary */}
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                    Selected Plan Summary
                  </p>
                  <div style={{ background: '#0f0f1a', border: '1px solid #1e1e33', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f1f5f9' }}>Volt {selectedPlan.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Billed {billing} · {cur.code}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f1f5f9' }}>{cur.symbol} {finalAmount.toLocaleString()}</div>
                        {discount && <div className="text-[10px] text-emerald-400 font-bold">{promoDiscountPct}% Student Discount</div>}
                      </div>
                    </div>
                    <div className="pt-2 border-t text-[11px] space-y-1.5" style={{ borderColor: '#1e1e33' }}>
                      <div className="flex justify-between text-slate-400">
                        <span>Standard Price:</span>
                        <span>{cur.symbol} {baseAmt.toLocaleString()}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-emerald-400 font-medium">
                          <span>Academic Savings (-{promoDiscountPct}%):</span>
                          <span>- {cur.symbol} {(baseAmt - finalAmount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-1 border-t" style={{ color: '#f1f5f9', borderColor: '#1e1e33' }}>
                        <span>Total Due Today:</span>
                        <span>{cur.symbol} {finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                      Account & Subscriber Details
                    </p>
                    {isLoggedIn && (
                      <button type="button" onClick={() => setEditDetails(v => !v)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition">
                        <PencilSimple size={11} />
                        <span>{editDetails ? 'Done Editing' : 'Edit Info'}</span>
                      </button>
                    )}
                  </div>
                  {isLoggedIn && !editDetails ? (
                    <div className="p-3 rounded-xl border flex items-center gap-2.5"
                      style={{ background: '#1a1a2e', borderColor: 'rgba(99,102,241,0.3)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow"
                        style={{ background: '#6366f1', color: '#fff' }}>
                        {(name || email).charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                          <span className="truncate">{name || 'Verified Scholar'}</span>
                          <span className="text-[9px] font-bold px-1.5 rounded-full shrink-0"
                            style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                            Ready ✓
                          </span>
                        </div>
                        <div className="text-[11px] font-mono truncate text-slate-500">{email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" style={inp} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                        <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" style={inp} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Mobile / Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" style={inp} />
                      </div>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                  Supports Visa, Mastercard, M-Pesa, MTN MoMo, and Airtel Money depending on country. Automatic 7-day refund guarantee.
                </p>

                {/* Pay Button */}
                <div className="space-y-1.5">
                  <button type="button" onClick={proceedToCheckout}
                    disabled={!email.trim() || selectedPlan.id === 'free'}
                    className="relative w-full py-3.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: email.trim() && selectedPlan.id !== 'free' ? 'linear-gradient(135deg,#6366f1 0%,#4338ca 100%)' : '#1a1a2e',
                      border: `1px solid ${email.trim() && selectedPlan.id !== 'free' ? '#6366f1' : '#2d2d44'}`,
                      color: email.trim() && selectedPlan.id !== 'free' ? '#fff' : '#475569',
                      cursor: email.trim() && selectedPlan.id !== 'free' ? 'pointer' : 'not-allowed',
                      boxShadow: email.trim() && selectedPlan.id !== 'free' ? '0 8px 25px rgba(99,102,241,0.4)' : 'none',
                    }}>
                    {selectedPlan.id === 'free' ? 'Starter Plan is Active (Free)' : (
                      <>
                        <Lightning size={15} className={email.trim() ? 'text-amber-300' : ''} />
                        <span>Pay {cur.symbol} {finalAmount.toLocaleString()} · Upgrade to {selectedPlan.label}</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                  {isLoggedIn && selectedPlan.id !== 'free' && (
                    <div className="text-center text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckFat size={12} />
                      <span>Account verified · 1-click instant upgrade ready</span>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="pt-2 border-t space-y-2" style={{ borderColor: '#1e1e33' }}>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span>256-bit TLS Encryption · PCI-DSS Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle size={14} weight="fill" className="text-indigo-400 shrink-0" />
                    <span>Instant Automated Activation to Workspace</span>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING */}
            {step === 'loading' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30, textAlign: 'center' }}>
                <Spinner size={32} className="text-indigo-400 animate-spin" />
                <div>
                  <h4 style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px' }}>Securing Payment Session</h4>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Connecting to encrypted gateway for {selectedPlan.label}…</p>
                </div>
              </div>
            )}

            {/* PAYMENT */}
            {step === 'payment' && iframeUrl && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #1e1e33', flexShrink: 0 }}>
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span className="font-bold text-slate-200">{cur.symbol} {finalAmount.toLocaleString()} · {selectedPlan.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{polls > 0 ? `Verifying (${polls})` : 'Awaiting Payment'}</span>
                    <button type="button" onClick={resetPayment}
                      className="text-[11px] px-2.5 py-1 rounded border transition text-slate-400 hover:text-slate-200"
                      style={{ borderColor: '#1e1e33' }}>Back</button>
                  </div>
                </div>
                <iframe src={iframeUrl} title="Secure Checkout" style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} allow="payment" />
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={32} weight="fill" className="text-emerald-400" />
                </div>
                <div>
                  <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px' }}>Welcome to Volt {selectedPlan.label}!</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 6px', maxWidth: 300 }}>
                    Your subscription is now active. All flagship models and daily quotas are immediately unlocked.
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0 }}>Receipt sent to {email}.</p>
                </div>
                <button onClick={() => { onClose(); window.location.reload() }}
                  className="mt-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition">
                  <Lightning weight="fill" size={14} /> Start using Voltrix Pro
                </button>
              </div>
            )}

            {/* FAILED */}
            {step === 'failed' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <WarningCircle size={32} weight="fill" className="text-rose-400" />
                </div>
                <div>
                  <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 800, margin: '0 0 6px' }}>Payment Incomplete</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 16px', maxWidth: 280 }}>
                    {errMsg || 'The transaction was cancelled or declined. No charge was made.'}
                  </p>
                  <button type="button" onClick={resetPayment}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition">
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
