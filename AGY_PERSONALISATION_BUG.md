# Personalisation Bug — Handoff to Agy

## What should happen
Every agent turn, `getInstanceInstructions()` in `overseer.ts` appends an `[Academic Context: ...]` block to the system prompt. The `instanceInstructions` KV tells Volt to read the student's university/degree/courses from that block. Volt should address the student by name and tailor responses to their profile.

## What actually happens
Volt ignores the injected context block and either:
- Says "no profile found, please tell me your details"
- Calls `env.ACADEMIC.getProfile()` via tool use and gets "not found"

## What we've confirmed works
- `getStudentProfile()` on the user DO returns the correct profile when called via the admin endpoint
- The `[Academic Context: ...]` format in KV matches what `getInstanceInstructions()` appends
- The `instanceInstructions` KV key now says "read the context from the bottom of this system prompt, NOT from chat history"
- Emma's profile (the active test account, DO ID `fd8024a805682852...`) has the correct data

## Suspected root causes (pick one)

### 1. Prompt caching (most likely)
The agent uses TheHive GLM 5.3 Flash. The system prompt is being cached by the provider. When `getInstanceInstructions()` appends the profile, the cached prefix is served without the new suffix. The profile section never reaches the model.
- Check: `ai-models.ts` → `getModelViaThehiveDirect()` — does it pass `cache_control` or is the system prompt being split into a cached prefix?

### 2. `ownerId` not set when `getInstanceInstructions()` fires
The OverseerDO constructor reads `ownerId` from storage. On a freshly woken DO (cold start), `ownerId` is loaded synchronously. But if the workspace was created before the `studentProfile` field existed in `makeUserStorage`, the user DO's storage schema might not have the singleton key.
- Check: `makeUserStorage()` in `user.ts` — is `studentProfile` in the singletons map with a default of `null`? If the DO was created before this field was added, typed-storage may not return it.

### 3. `getInstanceInstructions()` result is discarded
In `agent.ts` line 2259: `let instanceInstructions = formatInstanceInstructions(await hooks.getInstanceInstructions())`
Check `formatInstanceInstructions()` — does it strip or truncate the appended profile section?

## Key files
- `packages/workshop-backend/src/overseer.ts` line ~5749 — `getInstanceInstructions()`
- `packages/workshop-backend/src/user.ts` line ~157 — `makeUserStorage()`, line ~612 — `getStudentProfile()`
- `packages/workshop-backend/src/agent.ts` line ~2259 — `formatInstanceInstructions()`
- `packages/workshop-backend/src/ai-models.ts` — `getModelViaThehiveDirect()`

## Active test account
- Username: `emma`
- User DO ID: `fd8024a805682852f2ace37ab70300056cbf36991a06b0245b2a4428ab030795`
- Profile: MIT, BSc CS 1st Year, CS 301/MATH 240/CS 210, APA

## Admin endpoints (all require `Authorization: Bearer captain`)
```bash
# Read profile by username
GET https://voltrix.stream/api/admin/set-student-profile?username=emma

# Read profile by DO ID
GET https://voltrix.stream/api/admin/debug-profile?username=emma

# Write profile by DO ID (for OAuth accounts where username != DO key)
POST https://voltrix.stream/api/admin/set-profile-by-id
Body: { "doId": "...", "profile": { ...StudentProfile } }
```

## What NOT to do
- Don't change the `instanceInstructions` KV format again — it's correct now
- Don't add more admin endpoints — there are enough
- Don't try to fix this in prod without local reproduction first
