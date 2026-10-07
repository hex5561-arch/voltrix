# VOLTRIX MASTER CONTEXT
Last updated: 7 October 2026

## Overview
Voltrix is an AI academic copilot (Cloudflare OS instance) running at **voltrix.stream** (primary domain).
Target: $3/user/month, 90% margin via TheHive GLM 5.3 Flash (~$0.001/turn).

---

## Repos

| Repo | Path | Branch | Remote |
|---|---|---|---|
| voltrix-os root | `/home/voltrix/voltrix-os` | `main` | `hex5561-arch/voltrix` (GitHub) |
| cloudflare-os submodule | `/home/voltrix/voltrix-os/cloudflare-os` | `voltrix-main` | `hex5561-arch/voltrix` (GitHub) |
| coursehero | `/home/voltrix/coursehero` | n/a | separate repo (feature source) |

**GitHub**: https://github.com/hex5561-arch/voltrix
- `main` — root repo
- `voltrix-main` — cloudflare-os fork, latest commit `7d157b2c`

---

## CF Account

- Account ID: `84f114e1b747a07d247ceb17b0c1dc14`
- Zone ID: `fe7a85ed87c3eb7ef5b03aaa769b7a8a`
- **Global API Key**: `cfk_83n5g...d62bd` (see `/home/voltrix/.env` → `cf_global_api_key`)
- **Email**: `captain8888ping@gmail.com`
- Workers API Token (scoped): `cfut_RZAhG...97ff` (limited — use global key for deploys)

### Deploy commands (always use global key):
```bash
CF_KEY=$(grep "cf_global_api_key" /home/voltrix/.env | cut -d= -f2)

# Deploy any worker:
NODE_OPTIONS="--dns-result-order=ipv4first" \
CLOUDFLARE_ACCOUNT_ID=84f114e1b747a07d247ceb17b0c1dc14 \
CLOUDFLARE_API_KEY=$CF_KEY \
CLOUDFLARE_EMAIL=captain8888ping@gmail.com \
pnpm exec wrangler deploy --config wrangler.prod.jsonc

# Build frontend (always before router deploy):
cd /home/voltrix/voltrix-os/cloudflare-os
NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV=production npx vite build packages/workshop-frontend

# Type-check only (fast):
npx tsc --project packages/workshop-frontend/tsconfig.json --noEmit
npx tsc --project packages/workshop-backend/tsconfig.json --noEmit
npx tsc --project packages/workshop-shared/tsconfig.json --noEmit
```

---

## Deployed Workers

| Worker | Name | Version | Notes |
|---|---|---|---|
| Router | `voltrix-router` | `5f7b114b` | voltrix.stream, www., os. (os. 301s to root) |
| Backend | `voltrix-workshop` | `69363eb0` | main API + WebSocket + admin set-student-profile |
| WhatsApp | `voltrix-whatsapp` | `c0b43f33` | Meta webhook, DO sessions |
| Webhook | `voltrix-webhook` | `138b0baa` | Inbound webhook gatekeeper (auto-provisioned) |
| Email | `voltrix-email` | `2afde105` | Resend email gatekeeper — pending full domain verify |
| Scheduler | `voltrix-scheduler` | `00e96d69` | RPC-only |
| Context | `voltrix-context` | `f12c6874` | Context Library gatekeeper |
| Academic | `voltrix-academic` | latest | Custom gatekeeper |

### Secrets on voltrix-workshop:
- `CF_AI_GATEWAY_API_TOKEN` — see `.env`
- `GEMINI_API_KEY` — see `.env`
- `THEHIVE_API_KEY` — see `.env`

### Secrets on voltrix-whatsapp:
- `WHATSAPP_ACCESS_TOKEN` — from coursehero `.env`
- `WHATSAPP_PHONE_NUMBER_ID` = `1380923721763579`
- `THEHIVE_API_KEY` — see `.env`
- `GEMINI_API_KEY` — see `.env`

### Secrets on voltrix-email:
- `RESEND_API_KEY` — see `.env` → `resend_key`

---

## Live Site

- Primary URL: **https://voltrix.stream** ✅
- `www.voltrix.stream` → same ✅
- `os.voltrix.stream` → 301 → `voltrix.stream` ✅
- HTTP → HTTPS: 301 + HSTS max-age=31536000
- Pricing page: `/pricing` (public, no auth)

---

## Domain History
- Was: `os.voltrix.stream` (primary)
- Now: `voltrix.stream` (primary)
- Swap: deleted `voltrix.stream` CNAME to `coursehero-1hr.pages.dev`, added as Worker custom domain via CF API, added `www.`, router redirects `os.`

---

## AI Models

### CF AI Gateway: `voltrix-ai`
Providers: cloudflare, google, thehive

| Provider | Model | Context | Cost/turn |
|---|---|---|---|
| TheHive (direct) | `zai-org/glm-5.3-flash` | 1M | ~$0.001 |
| TheHive (direct) | `deepseek-ai/deepseek-v4.1-flash` | 1M | ~$0.001 |
| Google (gateway) | `gemini-2.5-flash` | 1M | varies |
| Workers AI | `@cf/moonshotai/kimi-k2.7-code` | 262k | ~$0.010 |

**Primary model**: GLM 5.3 Flash via TheHive direct (CF Gateway 502s on non-standard fields — bypassed in `ai-models.ts` `getModelViaThehiveDirect()`).

### Cost Model (measured)
- DO: $0.000025/prompt (post-turn disconnect, 16s wall time)
- Inference: ~$0.001/turn
- Total: ~$0.001025/prompt → **~90% margin at $3/user/month**

---

## Admin Config (KV)

**KV Namespace**: `8b03b72e6b864d6c853e3a14f0ac90f0` (BLUEPRINTS binding)
**Key**: `.adminConfig`

```json
{
  "siteName": "Voltrix",
  "accentColor": "#6366f1",
  "instanceInstructions": "You are Volt, an expert AI academic copilot built into Voltrix...[full identity + academic task routing + capabilities + pricing tiers]",
  "ambientGatekeeperModes": {"custom":"enabled","context":"enabled","scheduler":"optional"},
  "formats": [
    {"blueprintId":"format.document","enabled":true,"agentHint":"Use for essays, reports..."},
    {"blueprintId":"format.slides","enabled":true,"agentHint":"Use for presentations..."},
    {"blueprintId":"format.spreadsheet","enabled":false}
  ]
}
```

---

## Agent Identity

Volt's identity is injected two ways on every turn:

1. **`instanceInstructions` (KV)** — Volt's full persona, academic task routing, capabilities, pricing tiers. Written directly to KV (no redeploy needed to update).

2. **Student profile (Durable Object)** — `getInstanceInstructions()` in `overseer.ts` fetches `UserDurableObject.getStudentProfile()` and appends:
```
# Student Academic Profile
University: ...
Degree: ... (Year ...)
Discipline: ...
Citation Style: ...
Enrolled Courses: ...
```

Profile set by:
- `OnboardingWizard.tsx` on first login (saves to localStorage + DO)
- `SettingsPage.tsx` on edit (saves to localStorage + DO)

---

## Student Onboarding (agy's work — deployed)

Files:
- `packages/workshop-frontend/src/OnboardingWizard.tsx` — multi-step wizard (name, discipline, university, courses, year, citation)
- `packages/workshop-frontend/src/services/studentProfile.ts` — localStorage r/w, `formatStudentContextPrompt()`
- `packages/workshop-frontend/src/data/academicData.ts` — universities, disciplines, personas, courses

API:
- `AuthenticatedApi.setStudentProfile(profile)` → saves to user DO
- `AuthenticatedApi.getStudentProfile()` → reads from user DO
- `AuthenticatedApi.generateWhatsAppLinkCode()` → generates 6-digit code, stored in KV `wl:<code>` (10min TTL)

---

## WhatsApp Integration (voltrix-whatsapp worker)

### Architecture
- **Runtime**: Cloudflare Worker (edge, not Node.js)
- **Sessions**: `WhatsAppSession` Durable Object (SQLite) — one per phone number
- **AI**: TheHive GLM 5.3 Flash → Gemini 2.5 Flash fallback
- **Creds**: coursehero's Meta app creds (same phone number `+256752706401`)

### Routes (all at `voltrix.stream/api/whatsapp/`)
| Route | Worker | Purpose |
|---|---|---|
| `GET /webhook` | voltrix-whatsapp | Meta challenge verify |
| `POST /webhook` | voltrix-whatsapp | Inbound messages |
| `GET /status` | voltrix-whatsapp | Health check |
| `POST /test` | voltrix-whatsapp | Admin test send |
| `POST /validate-link` | voltrix-workshop (backend) | Redeem 6-digit pairing code |

### Message handling
- Text, voice notes (Whisper STT via Groq), images, documents, interactive buttons
- Dedup: rolling 200-ID window in DO storage
- WhatsApp markdown: `**bold**→*bold*`, headers→`*bold*`, bullets→`•`
- Message chunking at 3800 chars

### Commands
- `!help` — feature overview
- `!clear` — reset conversation
- `!status` — session info
- `!link <6-digit>` — link to Voltrix web account

### Account linking flow
1. Student in web app: Settings → WhatsApp → "Generate WhatsApp Link Code"
2. 6-digit code displayed (10 min TTL, stored in KV `wl:<code>`)
3. Student sends `!link 123456` on WhatsApp
4. Worker POSTs to `/api/whatsapp/validate-link`
5. Backend validates code, returns `{userId, name, profile}`, deletes code
6. DO links phone→userId, academic profile injected into every turn

### Meta App Config
- Webhook URL: `https://voltrix.stream/api/whatsapp/webhook`
- Verify token: `volt_whatsapp_verify_token_2026`
- Subscribed fields: `messages`
- WABA ID: `1289686079850008`
- App ID: `1084004174605816`

---

## Monetization (UpgradeModal)

Ported from `coursehero/client/src/components/PricingModal.jsx`. Full layout:
- 3-column plan cards: Starter (free), Scholar Pro ($79.99/yr), Campus Institutional ($279.99/yr)
- Monthly/Annual billing toggle + 16-currency selector
- Right sidebar: order summary, account details, pay button, trust badges
- Student discount bar (STUDENT30 / .edu auto-detect → 30% off)
- Collapsible tier comparison table
- Testimonials grid + FAQ accordion
- Payment: Pesapal iframe embedded, 4.5s polling
- File: `packages/workshop-frontend/src/components/UpgradeModal.tsx`

---

## Voice Conversation Modal (VoiceModal.tsx)

Status: **Deployed ✅**
- Living orb (Canvas, mic-reactive, mode-color-coded)
- STT: `webkitSpeechRecognition`, continuous, VAD-debounced 1200ms
- TTS: Web Speech API via `voiceService.ts`
- AI: `overseer.sendChatMessage()` + poll `listChats()` until `activeAgent` clears
- Footer: red X End button only (4 dock buttons removed by user request)
- Personas: Aria, Cove, Ember, Juniper, Sky
- Camera viewfinder: draggable, resizable, transcribe/solve buttons
- PIP mode: minimized floating orb bottom-right

Files:
- `packages/workshop-frontend/src/components/VoiceModal.tsx`
- `packages/workshop-frontend/src/services/voiceService.ts`
- `ChatInterface.tsx` — mic button in toolbar, `onVoiceOpen` prop
- `GadgetEditor.tsx` — wires `voiceModalOpen` state

---

## Webhook Gatekeeper (voltrix-webhook)

**Status**: Live ✅ — `https://voltrix.stream/gatekeeper/webhook/_health` → `{"status":"healthy"}`

### Architecture
- `GatekeeperVendor` — auto-provisioned (`autoProvisionsAccount: true`), no OAuth flow
- `WebhookDriver` DO (SQLite, singleton "global") — slug registry + HTTP dispatch + rate limiting
- `WebhookGatekeeper` DO — per-user scoped session
- `WebhookSessionImpl` — RPC: `onWebhook()`, `listWebhooks()`, `removeWebhook()`

### Usage from agent gadgets
```typescript
// WEBHOOK is auto-provided as an ambient binding
const reg = await WEBHOOK.onWebhook(
  { slug: "form-submission", title: "Assignment form", requireSignature: true },
  ctx.restore(MyHookHandler)
);
// reg.webhookUrl = "https://voltrix.stream/gatekeeper/webhook/form-submission"
// reg.secret = "<auto-generated>"
```

### Security
- HMAC-SHA256 (`X-Webhook-Signature: sha256=<hex>`) or Bearer/`X-Webhook-Secret` header
- `requireSignature: true` rejects non-signed requests
- Rate limit: 5–300 req/min (default 60)
- Payload cap: 1 KB–1 MB (default 64 KB)

---

## Admin HTTP Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/debug-profile?username=<user>` | `Authorization: Bearer <admin>` | Inspect User DO ID, student profile, and first gadget ID |
| POST | `/api/admin/set-profile-by-id` | `Authorization: Bearer <admin>` | Set student profile by raw User DO ID string |
| POST | `/api/admin/set-student-profile` | `Authorization: Bearer <admin>` | Seed/override student profile by username |
| GET | `/api/admin/set-student-profile?username=<user>` | `Authorization: Bearer <admin>` | Read current student profile by username |
| POST | `/api/whatsapp/validate-link` | internal (whatsapp worker) | Redeem 6-digit pairing code |

**Admin username**: `captain` (from `ADMINS` env var on voltrix-workshop)

Example:
```bash
curl -X POST https://voltrix.stream/api/admin/set-student-profile \
  -H "Authorization: Bearer captain" \
  -H "Content-Type: application/json" \
  -d '{"username":"voltrixtest","profile":{...StudentProfile}}'
```

---

## App Users & User Data Inventory (Admin Dashboard Spec)

*Note: This data inventory documents what the OS backend and edge provide about application users. It serves as the specification for the user management and telemetry view to be added last to the Admin Dashboard (`AdminPage.tsx`).*

### 1. User Identity & Account Metadata
- **Storage**: `UserDurableObject` (`storage.profile`, `storage.passwordHashHash`, `storage.sessions`)
- **Fields**:
  - `id`: Primary username or verified email (seeds the User DO `idFromName`).
  - `name`: Display name (customizable by user; falls back to username/email prefix).
  - `passwordHashHash`: Double SHA-256 password hash (`null` for OAuth / gatekeeper accounts).
  - `created`: Account initialization flag.
  - `avatar`: Binary JPEG/PNG image (up to 100 KB) in Cloudflare KV `AVATARS[userId]`.
  - `sessions`: Active session records (`tokenId`: SHA-256 hex, `created`: Date).
  - `onboardingCompleted`: Boolean onboarding completion flag.
  - `Cloudflare Access`: JWT assertion claims (`sub`, email, IdP claims) when Zero Trust is active.

### 2. Academic & Personalization Profile
- **Storage**: `UserDurableObject` (`storage.studentProfile`) & localStorage
- **Fields**:
  - `name`: Student name (injected directly into agent prompt context).
  - `university`: Enrolled institution (e.g. `Massachusetts Institute of Technology (MIT)`).
  - `degreeProgram`: Degree title (e.g. `B.Sc. Computer Science`).
  - `academicLevel` & `academicYear`: e.g. `undergraduate`, `1st Year (Freshman)`.
  - `semester`: Current academic term (e.g. `Semester 1`).
  - `discipline` & `disciplineTitle`: Selected domain (e.g. `computer_science` / `Computer Science`).
  - `citationStyle`: Preferred citation standard (e.g. `APA`, `IEEE`, `MLA`, `Chicago`).
  - `courses`: Array of enrolled courses `[{ code: string, name: string }]`.
  - `updatedAt`: Unix epoch ms timestamp of last profile modification.

### 3. Workspaces, Gadgets, & Artifact Outputs
- **Storage**: `UserDurableObject` (`storage.gadgets`, `storage.outputs`)
- **Fields**:
  - `id`: Workspace / Gadget Durable Object ID.
  - `title`: User-assigned workspace title.
  - `created` & `lastActive`: Timestamps tracking workspace activity.
  - `totalCost`: Cumulative LLM spend in USD accumulated for that specific workspace.
  - `pinned`: Boolean indicator if user pinned the gadget to their sidebar.
  - Collaboration: `owner` (AiChatAuthorInfo if shared with user), `role` (`editor` | `viewer`).
  - `outputs`: Indexed artifacts created inside workspaces (`workspaceId:workpieceId`, title, format blueprint such as `document`, `spreadsheet`, `slides`).
  - `blueprints`: Authored, pinned, and library-imported templates.

### 4. Edge, Network, & Geographic Signals
- **Source**: Cloudflare Worker `req.cf` object and HTTP headers on `voltrix-router` & `voltrix-workshop`
- **Fields**:
  - IP Address: `CF-Connecting-IP`, `X-Forwarded-For`.
  - Geolocation: `cf.country`, `cf.city`, `cf.region`, `cf.regionCode`, `cf.postalCode`, `cf.latitude`, `cf.longitude`, `cf.timezone`.
  - Network / ISP: `cf.asn` (Autonomous System Number), `cf.asOrganization`.
  - Edge Node: Cloudflare POP airport code (`cf.colo`, e.g. `MBA`, `DAR`, `LHR`).
  - Connection Security: `cf.tlsVersion`, `cf.tlsCipher`, `httpProtocol`.
  - Client / Device: `User-Agent` (OS, browser, device category), `Accept-Language` (user locale).

### 5. AI Model Usage, Quotas, & Billing
- **Storage**: `UserDurableObject` (`storage.dailyLlmCount`, `storage.preferredModel`, `storage.quickModel`, `storage.cloudflareBilling`, `storage.aiModels`)
- **Fields**:
  - `dailyLlmCount`: Free-tier rate limiter counter (`{ day: "YYYY-MM-DD", count: number }`).
  - `preferredModel` & `quickModel`: Active default model configurations and quick overrides.
  - Custom AI Models: User-configured BYOK models (endpoint, API keys, provider profile).
  - Cloudflare AI Gateway Billing: Selected CF account (`accountId`, `accountName`), `creditsRemaining` (cached USD balance), `creditsUpdatedAt`.

### 6. Integrations & Connected Gatekeepers
- **Storage**: `UserDurableObject` (`storage.connectedAccounts`)
- **Fields**:
  - Connected Vendors: `cloudflare`, `google`, `github`, `email`, `whatsapp`.
  - Status: `credentialExpiresAt`, `credentialsExpired`, `autoProvisioned`.
  - WhatsApp Linking: 6-digit ephemeral pairing code generated via `generateWhatsAppLinkCode` linking WhatsApp phone sessions to the user's DO profile.

### 7. Product Analytics Stream (`PRODUCT_ANALYTICS`)
- **Source**: Cloudflare Analytics Engine / Pipelines stream ([`analytics.ts`](file:///home/voltrix/voltrix-os/cloudflare-os/packages/workshop-backend/src/analytics.ts))
- **Event Telemetry**:
  - Auth: `account_created`, `user_authenticated`.
  - Workspace Lifecycle: `gadget_created`, `gadget_opened`, `gadget_deleted`.
  - Interactions: `chat_started`, `chat_message_sent`, `gadget_ui_connected`, `code_merged`.
  - Integrations: `connection_created`, `connection_removed`, `blueprint_created`, `blueprint_imported`.

---

## Resend / Email Gatekeeper

**Domain**: `em.voltrix.stream` (registered in Resend, eu-west-1)
**From address**: `Volt <noreply@em.voltrix.stream>`
**Worker**: `voltrix-email` v`2afde105`

### DNS Status (all records in Cloudflare, DNS-only)
| Record | Name | Value | Status |
|---|---|---|---|
| TXT (DKIM) | `resend._domainkey.em` | `p=MIGfMA0G...` | ⏳ Resend verifying |
| CNAME (SPF) | `rsend.em` | `rsend-euw1.forge.rmta.net` | ⏳ Resend verifying |
| CNAME (SPF) | `send.em` | `send.forge.rmta.net` | ✅ verified |
| MX (Receive) | `em` | `inbound-smtp.eu-west-1.amazonaws.com` pri 10 | ✅ verified |

All records globally propagated. Awaiting Resend full verification (~hours).
Previous blocker: Sendinblue NS delegation for `em.voltrix.stream` (now deleted).

---

### Post-turn DO Disconnect
- `POST_TURN_DISCONNECT_MS = 10000` (10s grace after agent finishes)
- File: `packages/workshop-frontend/src/useWorkspaceOpen.ts`
- Tested: `node scripts/test-disconnect.mjs` → ✅ $0.000025/prompt

### HTTP→HTTPS + HSTS
- Router worker, `run_worker_first: true`
- File: `packages/router/src/index.ts`

### Student Profile → Agent
- Client: `formatStudentContextPrompt()` prepended on new chats
- Server: `getInstanceInstructions()` appends DO profile on every turn
- Server-side is authoritative; client is a convenience fallback

### KV Cache on voltrixFetch
- SHA-256 keyed, TTLs: 7d math/exam, 24h text, 1h audit/debate, 0 createDoc
- File: `packages/custom-gatekeeper/src/custom.ts`

---

## Test Credentials
```
Login: voltrixtest / voltrix-test-2026
Test script: node scripts/test-disconnect.mjs (from /voltrix-os root)
```

---

## Completed Features (this session)
1. ✅ VoiceModal — phosphor icons fixed, SpeechRecognition typed, deployed
2. ✅ UpgradeModal — full coursehero PricingModal port, 3-col layout, comparison table, FAQs
3. ✅ Domain swap — voltrix.stream primary, os. redirects 301
4. ✅ Student onboarding (agy) — deployed, OnboardingWizard, academicData, studentProfile service
5. ✅ Agent identity — KV instanceInstructions (Volt persona), student profile DO injection every turn
6. ✅ WhatsApp worker — voltrix-whatsapp, Meta webhook, DO sessions, TheHive AI, account linking
7. ✅ WhatsApp linking UI — Settings page code generator, validate-link backend endpoint
8. ✅ Resend DNS — Sendinblue NS delegation removed, rsend CNAME fixed, MX added, RESEND_API_KEY pushed, DEFAULT_FROM fixed to noreply@em.voltrix.stream — awaiting Resend full verify
9. ✅ Webhook gatekeeper — voltrix-webhook deployed (v138b0baa), GATEKEEPER_WEBHOOK bound in router, /gatekeeper/webhook/* live, health endpoint verified
10. ✅ Test account personalisation — voltrixtest student profile seeded (UoN CS Year 3) via admin endpoint, DO injection confirmed via overseer.ts

## Next / High Priority
1. Kenya academic sources → Context Library (KNEC past papers, syllabi, KUCCPS)
2. GitHub gatekeeper
3. Email gatekeeper — waiting for Resend to flip em.voltrix.stream to fully verified (rsend.em SPF last record)
4. Verify personalisation end-to-end by logging in as voltrixtest and starting a chat

## Platform (longer term)
- Runtime network egress for Gadgets
- Character-level CRDT in Docs editor
- Headless server-side PDF export
- Cross-Gadget discovery

---

## File Map (key files)

```
voltrix-os/
├── VOLTRIX_TODO.md                           # Capability audit roadmap
└── cloudflare-os/
    ├── packages/router/
    │   ├── src/index.ts                      # HTTP→HTTPS, os.→voltrix. redirect, whatsapp routing
    │   └── wrangler.prod.jsonc               # 3 routes, WHATSAPP + WORKSHOP_BACKEND bindings
    ├── packages/whatsapp/
    │   ├── src/index.ts                      # Main worker — webhook, AI, commands
    │   └── src/session.ts                    # WhatsAppSession Durable Object
    ├── packages/workshop-frontend/src/
    │   ├── GadgetEditor.tsx                  # Main workspace (voiceModalOpen wired)
    │   ├── ChatInterface.tsx                 # Chat UI, mic button, profile context prepend
    │   ├── OnboardingWizard.tsx              # Multi-step academic onboarding
    │   ├── SettingsPage.tsx                  # Profile edit, WhatsApp link code generator
    │   ├── PricingPage.tsx                   # /pricing standalone
    │   ├── useWorkspaceOpen.ts               # POST_TURN_DISCONNECT_MS
    │   ├── data/academicData.ts              # Universities, disciplines, courses
    │   ├── services/
    │   │   ├── studentProfile.ts             # localStorage r/w, formatStudentContextPrompt
    │   │   └── voiceService.ts               # Web Speech API TTS engine
    │   └── components/
    │       ├── UserMenu.tsx                  # Upgrade button → UpgradeModal
    │       ├── UpgradeModal.tsx              # Full pricing modal (coursehero port)
    │       └── VoiceModal.tsx                # Voice conversation (living orb)
    ├── packages/workshop-backend/src/
    │   ├── agent.ts                          # System prompt, SYSTEM_PROMPT const
    │   ├── ai-models.ts                      # getModelViaThehiveDirect()
    │   ├── overseer.ts                       # getInstanceInstructions() — injects profile
    │   ├── user.ts                           # UserDO: studentProfile, generateWhatsAppLinkCode
    │   └── server.ts                         # /api/whatsapp/validate-link, /api/admin/set-student-profile
    ├── packages/gatekeeper-webhook/src/
    │   ├── webhook.ts                        # WebhookGatekeeper DO, WebhookSessionImpl, WebhookAccount, GatekeeperVendor
    │   ├── webhook-driver.ts                 # WebhookDriver DO — global slug registry + HTTP dispatch
    │   ├── webhook-security.ts               # HMAC-SHA256 sig verify, Bearer/secret header auth
    │   ├── types.d.ts                        # WebhookSession, WebhookHook, WebhookEvent interfaces
    │   └── worker.ts                         # Entry: exports all DO classes
    ├── packages/gatekeeper-email/
    │   ├── src/email.ts                      # Resend sendEmail(), inbound email handler
    │   └── wrangler.prod.jsonc               # DEFAULT_FROM: Volt <noreply@em.voltrix.stream>
    └── packages/workshop-shared/src/
        └── api.ts                            # StudentProfile type, generateWhatsAppLinkCode RPC
```
