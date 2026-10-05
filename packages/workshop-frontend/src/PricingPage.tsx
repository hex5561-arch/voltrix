import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useDocumentTitle } from './useDocumentTitle'
import {
  BookOpen, Brain, FileText, Lightning, CheckCircle, ArrowRight,
  X, Hexagon, CurrencyDollar, Sparkle,
} from '@phosphor-icons/react'

// ─── Types ───────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual'

interface Plan {
  id: 'free' | 'scholar' | 'campus'
  label: string
  tagline: string
  monthlyUsd: number
  annualUsd: number
  dailyQueries: number
  features: string[]
  highlighted: boolean
  cta: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSEHERO_API = 'https://voltrix.stream/api'

// Hardcoded FX rates (same as coursehero). KES is the hero currency.
const FX: Record<string, { rate: number; symbol: string; code: string }> = {
  KES: { rate: 130,   symbol: 'KSh', code: 'KES' },
  USD: { rate: 1,     symbol: '$',   code: 'USD' },
  UGX: { rate: 3700,  symbol: 'USh', code: 'UGX' },
  TZS: { rate: 2650,  symbol: 'TSh', code: 'TZS' },
  NGN: { rate: 1600,  symbol: '₦',   code: 'NGN' },
  GHS: { rate: 15.5,  symbol: '₵',   code: 'GHS' },
  ZAR: { rate: 18.5,  symbol: 'R',   code: 'ZAR' },
  EUR: { rate: 0.92,  symbol: '€',   code: 'EUR' },
  GBP: { rate: 0.79,  symbol: '£',   code: 'GBP' },
}

const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Starter',
    tagline: 'Try Volt free, no card needed',
    monthlyUsd: 0,
    annualUsd: 0,
    dailyQueries: 10,
    highlighted: false,
    cta: 'Start for free',
    features: [
      '10 AI prompts per day',
      'Essay & report drafting',
      'Flashcard generation',
      'Math solver',
      'Plagiarism audit',
    ],
  },
  {
    id: 'scholar',
    label: 'Scholar Pro',
    tagline: 'Unlimited Volt for serious students',
    monthlyUsd: 9.99,
    annualUsd: 79.99,
    dailyQueries: 500,
    highlighted: true,
    cta: 'Upgrade to Scholar Pro',
    features: [
      '500 AI prompts per day',
      'Everything in Starter',
      'Exam prediction & past papers',
      'Research & literature review',
      'Full document & slide creation',
      'Priority model access (DeepSeek + GLM)',
      'Video file attachments',
      'Email receipt & billing history',
    ],
  },
  {
    id: 'campus',
    label: 'Campus',
    tagline: 'For departments, clubs, and study groups',
    monthlyUsd: 34.99,
    annualUsd: 279.99,
    dailyQueries: 2500,
    highlighted: false,
    cta: 'Get Campus plan',
    features: [
      '2,500 AI prompts per day',
      'Everything in Scholar Pro',
      'Shared team workspace',
      'Admin dashboard',
      'Custom knowledge base (Kenya syllabi)',
      'Bulk promo codes',
      'Priority support',
    ],
  },
]

const PROMO_CODES: Record<string, number> = {
  STUDENT30: 30,
  CAMPUS50:  50,
  EXAM2026:  40,
  VOLT20:    20,
}

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
}: {
  plan: Plan
  billing: BillingCycle
  currency: string
  discount: number
  selected: boolean
  onSelect: () => void
}) {
  const baseUsd = billing === 'annual' ? plan.annualUsd / 12 : plan.monthlyUsd
  const discountedUsd = baseUsd * (1 - discount / 100)
  const isFree = plan.id === 'free'

  return (
    <div
      onClick={onSelect}
      className={[
        'relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200',
        plan.highlighted
          ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-900/30'
          : 'border-zinc-700/60 bg-zinc-900/60 hover:border-zinc-600',
        selected && !plan.highlighted ? 'border-indigo-400' : '',
      ].join(' ')}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Most popular
        </span>
      )}

      <div className="mb-4">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">{plan.label}</p>
        <p className="text-zinc-400 text-sm">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        {isFree ? (
          <p className="text-3xl font-bold text-white">Free</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-white">
              {formatPrice(discountedUsd, currency)}
              <span className="text-base font-normal text-zinc-400">/mo</span>
            </p>
            {billing === 'annual' && (
              <p className="text-xs text-indigo-400 mt-1">
                billed {formatPrice(plan.annualUsd * (1 - discount / 100), currency)}/year
              </p>
            )}
            {discount > 0 && (
              <p className="text-xs text-zinc-500 line-through mt-0.5">
                was {formatPrice(baseUsd, currency)}/mo
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
            <CheckCircle weight="fill" className="text-indigo-400 mt-0.5 shrink-0" size={15} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className={[
          'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
          plan.highlighted
            ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
            : isFree
            ? 'border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white'
            : 'bg-zinc-700 hover:bg-zinc-600 text-white',
        ].join(' ')}
      >
        {plan.cta}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PricingPage() {
  useDocumentTitle('Pricing')

  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [currency, setCurrency] = useState('KES')
  const [selectedPlanId, setSelectedPlanId] = useState<Plan['id']>('scholar')
  const [promoInput, setPromoInput] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [promoApplied, setPromoApplied] = useState('')

  // Checkout state
  const [step, setStep] = useState<CheckoutStep>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [iframeUrl, setIframeUrl] = useState('')
  const [_trackId, setTrackId] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId)!

  // ── Auto-detect .edu / Kenyan university email discount ──────────────────
  useEffect(() => {
    if (!email || promoApplied) return
    const lower = email.toLowerCase()
    if (
      lower.endsWith('.edu') ||
      lower.includes('.ac.') ||
      lower.includes('mak.ac.ug') ||
      lower.includes('uonbi.ac.ke')
    ) {
      setDiscount(30)
    } else {
      setDiscount(0)
    }
  }, [email, promoApplied])

  // ── Promo code ────────────────────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    const pct = PROMO_CODES[code]
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

  // ── Checkout ──────────────────────────────────────────────────────────────
  const baseUsd = billing === 'annual' ? selectedPlan.annualUsd : selectedPlan.monthlyUsd * 12
  const finalUsd = parseFloat((baseUsd * (1 - discount / 100)).toFixed(2))

  async function initiatePayment() {
    if (!email) { setCheckoutError('Email is required'); return }
    setIsSubmitting(true)
    setStep('loading')
    setCheckoutError('')
    try {
      const [firstName, ...rest] = name.trim().split(' ')
      const res = await fetch(`${COURSEHERO_API}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `voltrix-${Date.now()}`,
          tier: selectedPlan.id === 'scholar' ? 'pro' : selectedPlan.id,
          currency: 'USD',
          amount: finalUsd,
          email,
          phone: phone || '',
          firstName: firstName || 'Student',
          lastName: rest.join(' ') || '',
          countryCode: currency === 'KES' ? 'KE' : 'US',
        }),
      })
      const data = await res.json() as { success?: boolean; redirect_url?: string; order_tracking_id?: string; error?: string }
      if (!data.success || !data.redirect_url) {
        throw new Error(data.error ?? 'Payment initiation failed')
      }
      setIframeUrl(data.redirect_url)
      setTrackId(data.order_tracking_id ?? '')
      setStep('payment')
      setIsSubmitting(false)
      startPolling(data.order_tracking_id ?? '')
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <Link to="/" className="flex items-center gap-2">
          <Hexagon weight="fill" size={22} className="text-indigo-400" />
          <span className="font-semibold text-sm tracking-wide">Voltrix</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/signup" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign up free
          </Link>
          <Link
            to="/"
            className="text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Open app
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Sparkle weight="fill" size={12} />
            Powered by DeepSeek 4.1 Flash &amp; GLM 5.3 Flash
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Your AI copilot for{' '}
            <span className="text-indigo-400">every assignment</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Essays, flashcards, exam prediction, code, math — Volt handles it all.
            Start free, upgrade when you need more.
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {/* Billing toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700/60 rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                billing === 'annual' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Annual
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-semibold">
                Save 33%
              </span>
            </button>
          </div>

          {/* Currency selector */}
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/60 text-zinc-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {Object.entries(FX).map(([code, { symbol }]) => (
              <option key={code} value={code}>{symbol} {code}</option>
            ))}
          </select>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              currency={currency}
              discount={discount}
              selected={selectedPlanId === plan.id}
              onSelect={() => {
                setSelectedPlanId(plan.id)
                if (plan.id !== 'free') setStep('form')
                else setStep('idle')
              }}
            />
          ))}
        </div>

        {/* Promo code bar */}
        {selectedPlanId !== 'free' && step !== 'success' && (
          <div className="max-w-md mx-auto mb-10">
            {promoApplied ? (
              <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-700/50 rounded-xl px-4 py-2.5">
                <span className="text-sm text-indigo-300 flex items-center gap-2">
                  <CheckCircle weight="fill" size={15} />
                  <strong>{promoApplied}</strong> — {discount}% off applied
                </span>
                <button onClick={clearPromo} className="text-zinc-500 hover:text-zinc-300">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  placeholder="Promo or student code"
                  className="flex-1 bg-zinc-900 border border-zinc-700/60 text-zinc-200 text-sm rounded-xl px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={applyPromo}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
            {promoError && <p className="text-red-400 text-xs mt-1.5 pl-1">{promoError}</p>}
          </div>
        )}

        {/* Checkout panel */}
        {selectedPlanId !== 'free' && (
          <div className="max-w-md mx-auto">
            {step === 'idle' || step === 'form' ? (
              <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-6">
                <p className="text-sm font-semibold text-zinc-200 mb-4">
                  Upgrade to {selectedPlan.label}
                </p>

                <div className="space-y-3 mb-5">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-sm rounded-xl px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-sm rounded-xl px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone (optional — for M-Pesa)"
                    className="w-full bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-sm rounded-xl px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {checkoutError && (
                  <p className="text-red-400 text-xs mb-3">{checkoutError}</p>
                )}

                {/* Order summary */}
                <div className="bg-zinc-800/60 rounded-xl p-3 mb-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>{selectedPlan.label} · {billing === 'annual' ? 'Annual' : 'Monthly'}</span>
                    <span>{formatPrice(billing === 'annual' ? selectedPlan.annualUsd : selectedPlan.monthlyUsd, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-indigo-400">
                      <span>Discount ({discount}%)</span>
                      <span>
                        −{formatPrice(
                          (billing === 'annual' ? selectedPlan.annualUsd : selectedPlan.monthlyUsd) * discount / 100,
                          currency,
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-white border-t border-zinc-700/50 pt-1.5 mt-1.5">
                    <span>Total today</span>
                    <span>{formatPrice(finalUsd, currency)}</span>
                  </div>
                </div>

                <button
                  disabled={!email || isSubmitting}
                  onClick={initiatePayment}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CurrencyDollar size={16} weight="bold" />
                  Pay {formatPrice(finalUsd, currency)} · Continue
                  <ArrowRight size={14} weight="bold" />
                </button>

                <p className="text-xs text-zinc-600 text-center mt-3">
                  Secured by Pesapal · M-Pesa, Visa, Mastercard accepted
                </p>
              </div>
            ) : step === 'loading' ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Preparing your payment...</p>
              </div>
            ) : step === 'payment' ? (
              <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/60">
                  <p className="text-sm font-medium text-zinc-300">Complete payment</p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Waiting for payment...
                  </div>
                </div>
                <iframe
                  src={iframeUrl}
                  title="Pesapal Payment"
                  className="w-full"
                  style={{ height: 480, border: 'none' }}
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
                />
              </div>
            ) : step === 'success' ? (
              <div className="bg-zinc-900/80 border border-indigo-700/50 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle weight="fill" size={28} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Payment confirmed!</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Your {selectedPlan.label} plan is now active. Volt is ready.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Open Voltrix <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            ) : step === 'failed' ? (
              <div className="bg-zinc-900/80 border border-red-800/50 rounded-2xl p-8 text-center">
                <p className="text-red-400 font-semibold mb-2">Payment failed</p>
                <p className="text-zinc-500 text-sm mb-4">
                  Something went wrong. Your card was not charged.
                </p>
                <button
                  onClick={() => { setStep('form'); setIframeUrl('') }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 underline"
                >
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Value props */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 mb-12">
          {[
            { icon: BookOpen, label: 'Essays & reports', sub: 'Any format, any subject' },
            { icon: Brain, label: 'Exam prediction', sub: 'Past papers + syllabus analysis' },
            { icon: FileText, label: 'Flashcards', sub: 'Auto-generated from your notes' },
            { icon: Lightning, label: 'Instant answers', sub: 'Math, code, translations' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-center">
              <Icon size={22} className="text-indigo-400 mx-auto mb-2" weight="duotone" />
              <p className="text-sm font-medium text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I pay with M-Pesa?',
                a: 'Yes. Pesapal (our payment processor) accepts M-Pesa, Airtel Money, Visa, and Mastercard across Kenya, Uganda, Tanzania, and 15+ African countries.',
              },
              {
                q: 'What is a "prompt"?',
                a: 'One back-and-forth exchange with Volt — a question, a task, or a document request. Short tasks use one prompt; complex multi-step work like a full research paper may use a few.',
              },
              {
                q: 'Do unused prompts roll over?',
                a: 'No — quotas reset at midnight each day. Annual plans give you the best per-day value.',
              },
              {
                q: 'Is there a student discount?',
                a: 'Yes. Emails ending in .edu or .ac.ke/.ac.ug get 30% off automatically. Use code STUDENT30 otherwise.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No lock-in. Contact support and your plan downgrades to Starter at the end of your billing period.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border border-zinc-800/60 rounded-xl">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer text-sm font-medium text-zinc-200 list-none">
                  {q}
                  <ArrowRight
                    size={14}
                    className="text-zinc-500 group-open:rotate-90 transition-transform shrink-0"
                  />
                </summary>
                <p className="px-5 pb-4 text-sm text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-xs text-zinc-600 space-y-1">
          <p>Voltrix © 2026 · Built on Cloudflare OS</p>
          <p>Payments secured by Pesapal · KES · UGX · TZS · USD and 13 more currencies</p>
        </div>
      </div>
    </div>
  )
}
