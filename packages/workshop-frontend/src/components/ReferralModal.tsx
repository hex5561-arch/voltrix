import { useState, useEffect } from 'react'
import {
  Gift,
  X,
  Copy,
  Check,
  DeviceMobile,
  Sparkle,
} from '@phosphor-icons/react'

interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

interface ReferralProfileData {
  userId: string
  code: string
  referralLink: string
  invitedBy?: string
  successfulCount: number
  pendingCount: number
  bonusScans: number
  proDaysEarned: number
  referrals: Array<{
    inviteeId: string
    inviteeName?: string
    timestamp: string
    status: 'converted' | 'pending'
  }>
}

interface GrowthConfigData {
  referralsEnabled: boolean
  freeDailyScans: number
  referrerRewardScans: number
  inviteeRewardScans: number
  referralsForProUnlock: number
  referralProRewardDays: number
}

export default function ReferralModal({ isOpen, onClose, userEmail }: ReferralModalProps) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ReferralProfileData | null>(null)
  const [config, setConfig] = useState<GrowthConfigData | null>(null)
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const email = userEmail || 'scholar@voltrix.stream'
    fetch(`/api/referrals/my-code?userId=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d: any) => {
        if (d?.success) {
          setProfile(d.profile)
          setConfig(d.config)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, userEmail])

  if (!isOpen) return null

  const targetCount = config?.referralsForProUnlock || 3
  const currentCount = (profile?.successfulCount || 0) % targetCount
  const progressPct = Math.min(100, Math.round((currentCount / targetCount) * 100))
  const inviteLink = profile?.referralLink || `https://voltrix.stream/join?ref=${profile?.code || ''}`
  const whatsappMsg = encodeURIComponent(
    `Hey! I'm using Voltrix AI for coursework and past paper problem solving. Use my invite link to get ${config?.inviteeRewardScans || 5} free deep scans: ${inviteLink}`
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputCode.trim()) return
    setRedeeming(true)
    setRedeemStatus(null)
    try {
      const res = await fetch('/api/referrals/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeId: userEmail || 'scholar@voltrix.stream',
          code: inputCode.trim(),
        }),
      })
      const data = await res.json() as any
      if (data?.success) {
        setRedeemStatus({ success: true, msg: data.message })
        setInputCode('')
        // Refresh profile
        const email = userEmail || 'scholar@voltrix.stream'
        fetch(`/api/referrals/my-code?userId=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .then((d: any) => {
            if (d?.success) setProfile(d.profile)
          })
      } else {
        setRedeemStatus({ success: false, msg: data?.message || 'Invalid referral code.' })
      }
    } catch (err: any) {
      setRedeemStatus({ success: false, msg: err?.message || 'Failed to redeem.' })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white selection:bg-indigo-600">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Gift size={18} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Invite Friends &amp; Unlock Scholar Pro</h2>
              <p className="text-[11px] text-zinc-400">Give scans, get free Scholar Pro access.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading referral rewards...</span>
            </div>
          ) : (
            <>
              {/* Reward Milestone Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-amber-400" />
                    Scholar Pro Unlock Milestone
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {currentCount} / {targetCount} Friends
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Invite <span className="font-bold text-white">{targetCount - currentCount} more classmate(s)</span> to unlock <span className="font-bold text-emerald-400">{config?.referralProRewardDays || 7} Days of Scholar Pro</span> completely free!
                </p>
              </div>

              {/* Personal Invite Link */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Your Personal Invite Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Instant WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <DeviceMobile size={16} weight="fill" />
                <span>Share with Classmate on WhatsApp</span>
              </a>

              {/* Stat counters */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <span className="block text-lg font-bold font-mono text-white">
                    {profile?.successfulCount || 0}
                  </span>
                  <span className="text-[10px] text-zinc-400">Friends Joined</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <span className="block text-lg font-bold font-mono text-indigo-400">
                    +{profile?.bonusScans || 0}
                  </span>
                  <span className="text-[10px] text-zinc-400">Bonus Scans</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <span className="block text-lg font-bold font-mono text-emerald-400">
                    {profile?.proDaysEarned || 0}d
                  </span>
                  <span className="text-[10px] text-zinc-400">Free Pro Days</span>
                </div>
              </div>

              {/* Redeem a Friend's Code */}
              {!profile?.invitedBy && (
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300">Were you invited by a friend?</span>
                  <form onSubmit={handleRedeem} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter invite code (e.g. VOLT-ALEX-9K2)"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white uppercase placeholder:normal-case font-mono"
                    />
                    <button
                      type="submit"
                      disabled={redeeming || !inputCode.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      {redeeming ? 'Applying...' : 'Redeem'}
                    </button>
                  </form>
                  {redeemStatus && (
                    <p className={`text-[11px] ${redeemStatus.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {redeemStatus.msg}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
