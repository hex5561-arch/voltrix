/**
 * UpgradeModal — full Pesapal payment flow embedded inside Voltrix OS.
 * Calls voltrix.stream/api/payments/* directly (CORS: *). No redirect.
 *
 * Flow: plan select → promo → form → Pesapal iframe → poll → success/failed
 */

import { useState, useEffect, useRef } from 'react'
import {
  X, CheckCircle, Lightning, ArrowRight, CurrencyDollar,
  Sparkle, ArrowSquareOut,
} from '@phosphor-icons/react'

// ─── Constants ────────────────────────────────────────────────────────────────

const API = 'https://voltrix.stream/api'

const FX: Record<string, { rate: number; symbol: string }> = {
  KES: { rate: 130,  symbol: 'KSh' },
  USD: { rate: 1,    symbol: '$'   },
  UGX: { rate: 3700, symbol: 'USh' },
  TZS: { rate: 2650, symbol: 'TSh' },
  NGN: { rate: 1600, symbol: '₦'   },
  GHS: { rate: 15.5, symbol: '₵'   },
  ZAR: { rate: 18.5, symbol: 'R'   },
  EUR: { rate: 0.92, symbol: '€'   },
  GBP: { rate: 0.79, symbol: '£'   },
}

interface Plan {
  id: string
  label: string
  description: string
  monthly: number
  annual: number
  dailyQueries: number
  isPopular: boolean
  features: string[]
  cta: string
}

type Billing = 'monthly' | 'annual'
type Step = 'plans' | 'form' | 'loading' | 'payment' | 'success' | 'failed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localPrice(usd: number, code: string): number {
  const fx = FX[code] ?? FX.USD
  const raw = usd * fx.rate
  if (fx.rate >= 1000) return Math.round(raw / 100) * 100
  if (fx.rate >= 100)  return Math.round(raw / 10) * 10
  if (fx.rate >= 10)   return Math.round(raw)
  return parseFloat(raw.toFixed(2))
}

function fmt(usd: number, code: string): string {
  if (usd === 0) return 'Free'
  const fx = FX[code] ?? FX.USD
  return `${fx.symbol}${localPrice(usd, code).toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<Billing>('annual')
  const [currency, setCurrency] = useState('KES')
  const [selectedId, setSelectedId] = useState('pro')
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')

  const [step, setStep] = useState<Step>('plans')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [iframeUrl, setIframeUrl] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const trackIdRef = useRef('')

  // Load plans on open
  useEffect(() => {
    if (!isOpen) return
    fetch(`${API}/plans`)
      .then(r => r.json())
      .then((d: { plans?: Plan[] }) => {
        if (d.plans) setPlans(d.plans.filter(p => p.id !== 'free'))
      })
      .catch(() => {/* use fallback below */})
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('plans')
      setPromoInput('')
      setPromoApplied('')
      setDiscount(0)
      setPromoError('')
      setCheckoutError('')
      setIframeUrl('')
      setSubmitting(false)
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [isOpen])

  // Auto .edu / .ac.ke discount
  useEffect(() => {
    if (promoApplied) return
    const lower = email.toLowerCase()
    if (lower.endsWith('.edu') || lower.includes('.ac.') ||
        lower.includes('uonbi.ac.ke') || lower.includes('mak.ac.ug')) {
      setDiscount(30)
    } else {
      if (!promoApplied) setDiscount(0)
    }
  }, [email, promoApplied])

  const selectedPlan = plans.find(p => p.id === selectedId) ?? plans[0]
  const baseUsd = selectedPlan
    ? (billing === 'annual' ? selectedPlan.annual : selectedPlan.monthly * 12)
    : 0
  const finalUsd = parseFloat((baseUsd * (1 - discount / 100)).toFixed(2))

  // ── Promo ─────────────────────────────────────────────────────────────────
  async function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    try {
      const res = await fetch(`${API}/payments/validate-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tier: selectedId, amount: baseUsd }),
      })
      const d = await res.json() as { valid?: boolean; discountPct?: number; description?: string }
      if (!d.valid) { setPromoError('Invalid promo code'); return }
      setDiscount(d.discountPct ?? 0)
      setPromoApplied(code)
      setPromoError('')
      setPromoInput('')
    } catch {
      setPromoError('Could not validate code')
    }
  }

  function clearPromo() {
    setPromoApplied('')
    setDiscount(0)
    setPromoInput('')
    setPromoError('')
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  async function initiate() {
    if (!email) { setCheckoutError('Email is required'); return }
    setSubmitting(true)
    setCheckoutError('')
    try {
      const [firstName, ...rest] = name.trim().split(' ')
      // Use KES amount directly to stay within Pesapal limits
      const isKes = currency === 'KES'
      const res = await fetch(`${API}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `voltrix-${Date.now()}`,
          tier: selectedId,
          currency: isKes ? 'KES' : 'USD',
          amount: isKes ? localPrice(finalUsd, 'KES') : finalUsd,
          email,
          phone: phone || '',
          firstName: firstName || 'Student',
          lastName: rest.join(' ') || '',
          countryCode: isKes ? 'KE' : 'US',
        }),
      })
      const d = await res.json() as {
        success?: boolean; redirect_url?: string
        order_tracking_id?: string; error?: string
      }
      if (!d.success || !d.redirect_url) throw new Error(d.error ?? 'Payment initiation failed')
      trackIdRef.current = d.order_tracking_id ?? ''
      setIframeUrl(d.redirect_url)
      setStep('payment')
      poll(d.order_tracking_id ?? '')
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function poll(id: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payments/status/${id}`)
        const d = await res.json() as { completed?: boolean; status_code?: number }
        if (d.completed || d.status_code === 1) {
          clearInterval(pollRef.current!); pollRef.current = null
          setStep('success')
        }
      } catch { /* keep polling */ }
    }, 4500)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  if (!isOpen) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-kumo-elevated border border-kumo-line rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-kumo-elevated border-b border-kumo-line">
          <div className="flex items-center gap-2">
            <Sparkle weight="fill" size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-kumo-strong">Upgrade Voltrix</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Billing toggle */}
            <div className="flex items-center bg-kumo-base border border-kumo-line rounded-lg p-0.5 gap-0.5 text-xs">
              {(['monthly', 'annual'] as Billing[]).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors capitalize ${
                    billing === b
                      ? 'bg-kumo-tint text-kumo-strong'
                      : 'text-kumo-inactive hover:text-kumo-default'
                  }`}
                >
                  {b === 'annual' ? 'Annual −33%' : 'Monthly'}
                </button>
              ))}
            </div>
            {/* Currency */}
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="text-xs bg-kumo-base border border-kumo-line text-kumo-default rounded-lg px-2 py-1 focus:outline-none focus:border-kumo-brand"
            >
              {Object.entries(FX).map(([code, { symbol }]) => (
                <option key={code} value={code}>{symbol} {code}</option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="text-kumo-inactive hover:text-kumo-default transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* ── Plan cards ── */}
          {(step === 'plans' || step === 'form') && (
            <>
              {plans.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {plans.map(plan => {
                    const perMoUsd = billing === 'annual' ? plan.annual / 12 : plan.monthly
                    const discounted = perMoUsd * (1 - discount / 100)
                    const active = selectedId === plan.id
                    return (
                      <div
                        key={plan.id}
                        onClick={() => { setSelectedId(plan.id); setStep('form') }}
                        className={[
                          'relative rounded-xl border-2 p-4 cursor-pointer transition-all',
                          active
                            ? 'border-indigo-500 bg-indigo-500/5'
                            : 'border-kumo-line hover:border-kumo-subtle bg-kumo-base',
                        ].join(' ')}
                      >
                        {plan.isPopular && (
                          <span className="absolute -top-2.5 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Most popular
                          </span>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{plan.label}</p>
                            <p className="text-2xl font-bold text-kumo-strong mt-1">
                              {fmt(discounted, currency)}
                              <span className="text-xs font-normal text-kumo-subtle">/mo</span>
                            </p>
                            {billing === 'annual' && (
                              <p className="text-[10px] text-indigo-400 mt-0.5">
                                billed {fmt(plan.annual * (1 - discount / 100), currency)}/yr
                              </p>
                            )}
                          </div>
                          {active && (
                            <CheckCircle weight="fill" size={18} className="text-indigo-400 shrink-0 mt-1" />
                          )}
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.slice(0, 5).map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-kumo-default">
                              <CheckCircle weight="fill" size={11} className="text-indigo-400 mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                          {plan.features.length > 5 && (
                            <li className="text-xs text-kumo-subtle pl-4">
                              +{plan.features.length - 5} more
                            </li>
                          )}
                        </ul>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(plan.id); setStep('form') }}
                          className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                              : 'bg-kumo-tint hover:bg-kumo-fill text-kumo-strong'
                          }`}
                        >
                          {plan.cta}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Promo */}
              {selectedPlan && step === 'form' && (
                <div className="mb-4">
                  {promoApplied ? (
                    <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-2">
                      <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                        <CheckCircle weight="fill" size={12} />
                        <strong>{promoApplied}</strong> — {discount}% off
                      </span>
                      <button onClick={clearPromo} className="text-kumo-subtle hover:text-kumo-default">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError('') }}
                        onKeyDown={e => e.key === 'Enter' && applyPromo()}
                        placeholder="Promo or student code"
                        className="flex-1 bg-kumo-base border border-kumo-line text-kumo-default text-xs rounded-lg px-3 py-2 placeholder-kumo-subtle focus:outline-none focus:border-kumo-brand"
                      />
                      <button
                        onClick={applyPromo}
                        className="bg-kumo-tint hover:bg-kumo-fill text-kumo-strong text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                </div>
              )}

              {/* Checkout form */}
              {step === 'form' && selectedPlan && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-kumo-base border border-kumo-line text-kumo-default text-sm rounded-lg px-3 py-2.5 placeholder-kumo-subtle focus:outline-none focus:border-kumo-brand"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-kumo-base border border-kumo-line text-kumo-default text-sm rounded-lg px-3 py-2.5 placeholder-kumo-subtle focus:outline-none focus:border-kumo-brand"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone (optional — for M-Pesa)"
                    className="w-full bg-kumo-base border border-kumo-line text-kumo-default text-sm rounded-lg px-3 py-2.5 placeholder-kumo-subtle focus:outline-none focus:border-kumo-brand"
                  />

                  {/* Order summary */}
                  <div className="bg-kumo-base border border-kumo-line rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-kumo-subtle">
                      <span>{selectedPlan.label} · {billing === 'annual' ? 'Annual' : 'Monthly'}</span>
                      <span>{fmt(billing === 'annual' ? selectedPlan.annual : selectedPlan.monthly, currency)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-indigo-400">
                        <span>Discount ({discount}%)</span>
                        <span>−{fmt((billing === 'annual' ? selectedPlan.annual : selectedPlan.monthly) * discount / 100, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-kumo-strong border-t border-kumo-line pt-1.5 mt-1">
                      <span>Total today</span>
                      <span>{fmt(finalUsd, currency)}</span>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-red-400 text-xs">{checkoutError}</p>
                  )}

                  <button
                    onClick={initiate}
                    disabled={!email || submitting}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <CurrencyDollar size={15} weight="bold" />
                    {submitting ? 'Preparing...' : `Pay ${fmt(finalUsd, currency)} · Continue`}
                    {!submitting && <ArrowRight size={13} weight="bold" />}
                  </button>
                  <p className="text-[10px] text-kumo-subtle text-center">
                    Secured by Pesapal · M-Pesa, Visa, Mastercard accepted
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Loading ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-kumo-subtle">Preparing your payment...</p>
            </div>
          )}

          {/* ── Pesapal iframe ── */}
          {step === 'payment' && (
            <div className="rounded-xl overflow-hidden border border-kumo-line">
              <div className="flex items-center justify-between px-4 py-2.5 bg-kumo-base border-b border-kumo-line">
                <p className="text-xs font-medium text-kumo-default">Complete payment</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-kumo-subtle">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Waiting...
                  </div>
                  <a
                    href={iframeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-kumo-subtle hover:text-kumo-default flex items-center gap-1"
                  >
                    Open in tab <ArrowSquareOut size={10} />
                  </a>
                </div>
              </div>
              <iframe
                src={iframeUrl}
                title="Pesapal Payment"
                className="w-full"
                style={{ height: 460, border: 'none' }}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
              />
            </div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 bg-indigo-500/15 rounded-full flex items-center justify-center">
                <CheckCircle weight="fill" size={28} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-kumo-strong mb-1">Payment confirmed!</h2>
                <p className="text-xs text-kumo-subtle max-w-xs">
                  Your {selectedPlan?.label} plan is now active. Refresh to unlock your full daily quota.
                </p>
              </div>
              <button
                onClick={() => { onClose(); window.location.reload() }}
                className="mt-2 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Lightning weight="fill" size={14} />
                Start using Voltrix Pro
              </button>
            </div>
          )}

          {/* ── Failed ── */}
          {step === 'failed' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <p className="text-sm font-semibold text-kumo-strong">Payment failed</p>
              <p className="text-xs text-kumo-subtle">Your card was not charged.</p>
              <button
                onClick={() => { setStep('form'); setIframeUrl('') }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
