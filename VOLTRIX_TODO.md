# Voltrix TODO

Sourced from Volt's Capability Audit (5 October 2026) and ongoing development.
Each item links back to the audit category that motivates it.

---

## 🔴 Do Now (unblocks Volt immediately)

- [ ] **Set up student profile** — name, university, course, year of study
  Volt tried to load a profile before writing the audit and found none.
  Without it he addresses nobody by name and cannot tailor advice.
  → Settings in the app, takes 2 minutes. _(Audit: B)_

- [ ] **Accept Volt's change proposals** — get in the habit of reviewing and
  approving his edit/gadget proposals so Category B stops being a wall.
  _(Audit: B)_

---

## 🟡 Platform — Build These (high leverage, ordered by impact)

### 1. Webhook / HTTP Gateway Gatekeeper
Volt ranks this #1. A CF Worker that accepts inbound HTTP POST events
(form submissions, payment confirmations, repo pushes, attendance pings)
and routes them into a gadget as hook activations.
Unlocks: integrations with anything that can POST.
_(Audit: A, D)_

### 2. GitHub Gatekeeper
OAuth → repo read/write, PR webhooks, code review workflows.
Most Kenyan university students have code assignments.
Direct path: CF Worker → GitHub REST/GraphQL API.
_(Audit: A — "connect whatever resource you want me to work with")_

### 3. Email Gatekeeper (Resend)
Resend is already half-wired in coursehero (`BREVO_API_KEY` / Resend).
An email gatekeeper gives Volt outbound email for reminders,
deadline alerts, and completed-job notifications.
_(Audit: D — "No push, email, or SMS")_

### 4. Kenya Academic Sources → Context Library
Dump into the shared context library so exam prediction sharpens:
- KNEC past papers (publicly available)
- KUCCPS course catalogues
- University e-learning portals (Moodle exports)
- Common Kenyan university syllabi
_(Audit: A — "Kenya-specific academic sources")_

### 5. Google Docs Gatekeeper
Volt notes "the Docs editor already carries a sync stub waiting for that binding."
OAuth → Docs read/write, bidirectional draft sync.
_(Audit: A)_

### 6. Cloud Object Storage Gatekeeper
R2 or S3 binding so images stop living as base64 data URLs inside documents.
Fixes media-heavy document inflation.
_(Audit: D — "Media rides as data")_

### 7. Admin Dashboard: User Intelligence & Management Panel (Build Last)
Add a dedicated user intelligence & telemetry view to `AdminPage.tsx` as the final admin dashboard module.
Exposes user identities, academic profiles, gadget usage, cost tracking, sessions, Cloudflare edge geography, and real-time product analytics.
_(Spec: VOLTRIX_MASTER_CONTEXT.md → App Users & User Data Inventory)_

---

## 🟢 Model / AI

- [ ] **GLM 5.3 Flash video input** — pi-ai's `Model.input` type is currently
  `("text" | "image")[]` and doesn't include `"video"`. Once pi adds the
  modality, update `getModelViaThehiveDirect()` input array for GLM.
  Attachment validator already permits video MIME types for thehive.

- [ ] **Monitor TheHive for new models** — currently only DeepSeek 4.1 Flash
  and GLM 5.3 Flash. Check `https://docs.thehive.ai/docs/chat-completions-openai-compatible-llms`
  for additions and add to `SUGGESTED_MODELS` + `ai-models.ts`.

- [ ] **TheHive rate limit** — default is 5 req/s. Contact TheHive to raise
  limit before scaling beyond ~100 concurrent users.

---

## 🔵 Platform Upgrades (longer-term, needs CF OS changes)

These are from Volt's "What Would Empower Me Most" section — items that
require changes to the Cloudflare OS platform itself, not just Voltrix config.

- [ ] **Runtime network egress for Gadgets** — scoped, user-approved fetch
  allowlist inside the sandbox. Single biggest unlock per Volt.
  _(Audit: C — "No general-purpose runtime")_

- [ ] **Background execution** — scheduled wake-ups and outbound calls
  between chats. Scheduler gatekeeper is wired but only reacts to hooks,
  not self-initiates.
  _(Audit: C — "No self-initiated activity")_

- [ ] **Character-level CRDT** — same-paragraph collaboration without merge
  friction. Current Docs editor merges at block level (execCommand).
  _(Audit: C — "Some building blocks are dated")_

- [ ] **Headless server-side PDF export** — Puppeteer/browser worker so
  exported PDFs have precise, repeatable layouts instead of browser print engine.
  _(Audit: D — "Export fidelity is browser-bound")_

- [ ] **Cross-Gadget discovery** — Gadgets finding and calling each other
  without manual binding wiring. Enables "lecture notes → flashcards →
  exam prediction" pipelines that assemble themselves.
  _(Audit: E — build limits)_

- [ ] **Workspace-wide search index** — one query surface across every
  Gadget, document, and connected resource.
  _(Audit: D — "Search is fragmented")_

- [ ] **Observability for Volt** — structured logs and metrics Volt can read
  when debugging, instead of reasoning blind.
  _(Audit: E)_

---

## ✅ Done

- [x] TheHive DeepSeek 4.1 Flash + GLM 5.3 Flash — direct API integration
      (CF Gateway 502 bypassed; ~$0.001/turn; 90% margin at $3/user/month)
- [x] Post-turn DO disconnect — $0.000025/prompt, was projecting $47/day
- [x] KV cache layer on voltrixFetch (SHA-256 key, TTL by action type)
- [x] AI Gateway cache + rate limiting + retries on voltrix-ai
- [x] HTTP → HTTPS redirect + HSTS in router worker
- [x] Cache-busting meta tags on index.html (fixes "private window works" bug)
- [x] run_worker_first: true so router intercepts all requests
- [x] Admin config restored to KV (siteName, accentColor, formats, instructions)
- [x] voltrix-scheduler redeployed (EPIPE recovery)
- [x] Page title "Cloudflare OS" → "Voltrix"
- [x] TheHive model context windows confirmed at 1M tokens in SUGGESTED_MODELS
- [x] GLM video MIME types permitted in chat-attachment-validation.ts
- [x] Student academic profile personalization — name bound across profile, User DO backfill, and agent prompt context (`[Academic Context: Student: <name> | ...]`)
- [x] Admin inspection & management endpoints (`/api/admin/debug-profile`, `/api/admin/set-profile-by-id`)
