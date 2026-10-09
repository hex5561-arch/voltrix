import React, { useState, useEffect } from 'react'
import {
  X, Tray, FileText, CheckCircle, Bell, PaperPlaneRight,
  Printer, ArrowLeft, EnvelopeSimple, Sparkle, Tag
} from '@phosphor-icons/react'
import { useOptionalAuthenticatedApi } from '../AuthContext'

export interface InvoiceItem {
  invoiceId: string
  orderTrackingId?: string
  orderId?: string
  userId: string
  tier: string
  planLabel: string
  amount: number
  currency: string
  months?: number
  paymentMethod?: string
  autoRenew?: boolean
  processor?: string
  paidAt: string
  status: string
}

export interface InboxMessage {
  id: string
  type: 'invoice' | 'announcement' | 'message' | 'alert'
  title: string
  content: string
  sender?: {
    name: string
    role?: string
  }
  recipient?: string
  invoice?: InvoiceItem
  read: boolean
  createdAt: string
}

export default function InboxModal({
  isOpen,
  onClose,
  initialTab = 'invoices'
}: {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'invoices' | 'announcements'
}) {
  const auth = useOptionalAuthenticatedApi()
  const currentUser = auth?.currentUser
  const [tab, setTab] = useState<'invoices' | 'announcements'>(initialTab)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  
  // Announcement composition state for admin/instructors
  const [showCompose, setShowCompose] = useState(false)
  const [composeTitle, setComposeTitle] = useState('')
  const [composeContent, setComposeContent] = useState('')
  const [composeRecipient, setComposeRecipient] = useState('all')
  const [sending, setSending] = useState(false)

  const userEmail = currentUser?.id?.toLowerCase()?.trim() || ''

  const fetchInbox = () => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/inbox?user=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d?.success && Array.isArray(d.messages)) {
          setMessages(d.messages)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isOpen) {
      fetchInbox()
      setTab(initialTab)
    }
  }, [isOpen, userEmail, initialTab])

  const markAllRead = async () => {
    if (!userEmail) return
    try {
      await fetch('/api/inbox/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userEmail, all: true })
      })
      setMessages(prev => prev.map(m => ({ ...m, read: true })))
    } catch {}
  }

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeTitle.trim() || !composeContent.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: composeRecipient,
          title: composeTitle,
          content: composeContent,
          type: 'announcement',
          senderName: currentUser?.name || 'Voltrix Faculty',
          senderRole: auth?.isAdmin ? 'admin' : 'faculty'
        })
      })
      const data = await res.json() as any
      if (data?.success) {
        setComposeTitle('')
        setComposeContent('')
        setShowCompose(false)
        fetchInbox()
      }
    } catch {}
    finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  const invoiceMessages = messages.filter(m => m.type === 'invoice' || m.invoice)
  const announcementMessages = messages.filter(m => m.type !== 'invoice' && !m.invoice)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Tray size={18} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Voltrix Inbox & Receipts</h2>
              <p className="text-[11px] text-zinc-400">Payment receipts, official tax invoices & university updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-2 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/30">
          <div className="flex gap-2">
            <button
              onClick={() => { setTab('invoices'); setSelectedInvoice(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                tab === 'invoices'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FileText size={14} />
              Invoices & Receipts ({invoiceMessages.length})
            </button>
            <button
              onClick={() => { setTab('announcements'); setSelectedInvoice(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                tab === 'announcements'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Bell size={14} />
              Announcements & Notes ({announcementMessages.length})
            </button>
          </div>

          {auth?.isAdmin && tab === 'announcements' && !showCompose && (
            <button
              onClick={() => setShowCompose(true)}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <PaperPlaneRight size={13} />
              Disseminate message
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">Loading inbox items...</div>
          ) : selectedInvoice ? (
            /* Detailed Invoice View */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={14} />
                Back to all invoices
              </button>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Official Receipt & Tax Invoice</span>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedInvoice.invoiceId}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      PAID
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition"
                      title="Print Invoice"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Billed To:</span>
                    <span className="text-zinc-200 font-medium">{selectedInvoice.userId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Date Issued:</span>
                    <span className="text-zinc-200 font-medium">
                      {new Date(selectedInvoice.paidAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Subscription Plan:</span>
                    <span className="text-indigo-400 font-bold">{selectedInvoice.planLabel}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Duration:</span>
                    <span className="text-zinc-200 font-medium">{selectedInvoice.months || 1} month(s)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Payment Method:</span>
                    <span className="text-zinc-200 font-medium">{selectedInvoice.paymentMethod || 'Credit / Debit Card'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Billing Provider:</span>
                    <span className="text-zinc-200 font-medium">{selectedInvoice.processor || 'Voltrix Secure Billing'}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-zinc-300">Total Paid</span>
                  <span className="text-emerald-400 text-base">
                    {selectedInvoice.currency} {Number(selectedInvoice.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : tab === 'invoices' ? (
            /* Invoices list */
            invoiceMessages.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText size={32} className="mx-auto text-zinc-600" />
                <p className="text-xs font-medium text-zinc-400">No invoices or receipts yet.</p>
                <p className="text-[11px] text-zinc-600">Whenever you upgrade your plan, your official receipts and tax invoices will be saved here automatically.</p>
              </div>
            ) : (
              invoiceMessages.map(msg => {
                const inv = msg.invoice || {
                  invoiceId: msg.title,
                  userId: msg.recipient || userEmail,
                  planLabel: 'Voltrix Subscription',
                  amount: 0,
                  currency: 'USD',
                  paidAt: msg.createdAt,
                  status: 'PAID',
                  tier: 'pro'
                }
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle size={18} weight="fill" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{msg.title}</h4>
                          {!msg.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{msg.content}</p>
                        <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">
                        {inv.currency} {Number(inv.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-medium hover:underline">
                        View Invoice →
                      </span>
                    </div>
                  </div>
                )
              })
            )
          ) : showCompose ? (
            /* Compose announcement form */
            <form onSubmit={handleSendAnnouncement} className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-white">Disseminate Course or System Announcement</h4>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Target Audience</label>
                <select
                  value={composeRecipient}
                  onChange={e => setComposeRecipient(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">All Platform Scholars (Broadcast)</option>
                  <option value="cohort">Registered Study Cohort</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={e => setComposeTitle(e.target.value)}
                  placeholder="e.g. Midterm Syllabus Update or Server Maintenance"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Message Content</label>
                <textarea
                  value={composeContent}
                  onChange={e => setComposeContent(e.target.value)}
                  placeholder="Type the message or syllabus details here..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <PaperPlaneRight size={14} />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          ) : (
            /* Announcements list */
            announcementMessages.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bell size={32} className="mx-auto text-zinc-600" />
                <p className="text-xs font-medium text-zinc-400">No announcements yet.</p>
                <p className="text-[11px] text-zinc-600">Platform updates, lecturer communications, and curriculum revisions will appear here.</p>
              </div>
            ) : (
              announcementMessages.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {msg.sender?.role?.toUpperCase() || 'ANNOUNCEMENT'}
                      </span>
                      <h4 className="text-xs font-bold text-white">{msg.title}</h4>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{msg.content}</p>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    From: {msg.sender?.name || 'Voltrix Faculty'}
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Official receipts verified by Voltrix OS.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
