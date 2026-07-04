# Sentient — Product Design Spec

**Status:** Approved 2026-07-04  
**Repo:** https://github.com/Nejo12/sentient  
**Visual reference:** `docs/handoff/design_handoff_kindly/` (Kindly handoff — adapt copy/branding to Sentient)

---

## 1. One-liner

Sentient helps people fix a reply *before* they send it — without leaving WhatsApp, Messenger, or iMessage. Users ask **what they can do** or **what they might be missing**, then pick how they want to be understood.

## 2. Problem

The hardest message to write is the one that matters emotionally. People either fire off something they regret, or leave a chat to paste into a separate tool and lose the thread. Sentient removes the app-switching: the help comes to the chat.

## 3. Differentiator

Two native entry points:

- **iOS:** Share Extension — select a message, tap Share, pick Sentient.
- **Android:** Floating bubble (chat-head overlay) over any chat.

## 4. Core flow

1. **Capture** — user shares/selects a message from a chat app.
2. **Choose** — pick intent (`What can I do?` / `What am I missing?`); if "do", pick understanding (Calm, Confident, etc.); optional rough draft.
3. **Compare** — 3 rewrite options; "missing" path adds a perspective card above options.
4. **Send back** — user picks one, edits in place, copies.
5. User returns to chat to paste and send. **Nothing sends automatically.**

## 5. Locked product decisions

| Decision | Value |
|---|---|
| Brand name | **Sentient** (all UI) |
| iOS keyboard | Defer to v1.1 — Share Extension only |
| Options per request | **3** |
| Free tier | **5 rewrites/day** |
| Moderation | OpenAI Moderation API + prompt guardrails |
| Blocked copy | *"Something here needs another look."* |
| Legacy action chips | **Removed from v1** (Softer, Apologise, boundary, translate, etc.) |
| Monetization | Sentient Pro €3.99/month via RevenueCat (Phase 8) |

## 6. Choose screen (Sentient redesign)

### Layout (top → bottom)

1. Header: Sentient brand tile + serif wordmark + close (X).
2. *"You're replying to {name}"* + quote card of captured message.
3. *"Your rough draft — optional"* + multiline input.
4. Eyebrow *"What do you need?"*
5. **Intent cards** (two equal tappable cards):
   - **What can I do?** — *"Help me say this well."*
   - **What am I missing?** — *"Help me see what I might be overlooking."*
6. Eyebrow *"How do you want to be understood?"* — **visible only when "What can I do?" is selected**
7. **Understanding grid** (2×3): Calm · Confident · Curious · Compassionate · Firm · Professional

### Behaviour

- Selecting **What am I missing?** hides understanding grid → API call → Compare.
- Selecting **What can I do?** reveals understanding grid → chip tap → API call → Compare.
- Rough draft included in API payload when present.

## 7. Compare screen

### Path A — What can I do? + understanding (e.g. Calm)

- Header: *"{Understanding} replies"* (e.g. "Calm replies") + pill *"3 options"*
- 3 result cards with variant labels (e.g. "Calm & direct" recommended, "Calm & warm", "Calm & brief")
- Each card: label + tag pill + body + Copy / Send back
- Footer text button: *"Try another way to be understood"*

### Path B — What am I missing?

- Header: *"Before you reply"* + pill *"3 options"*
- **Perspective card** (soft-peach, quote style):
  - Eyebrow: *"What you might be missing"*
  - Body: blind-spot insight (never labeled AI)
- 3 rewrite cards below (same structure as Path A)
- Footer: *"See another angle"*

## 8. Send back screen

- Tone/understanding label or *"Perspective"* tag
- Product-stage serif preview (editable via pencil)
- Olive success toast on copy
- Reassurance: *"Nothing sends automatically. Sentient copies your reply, then takes you back so you can paste and hit send yourself."*
- Primary: *"Copy & switch to {sourceApp}"*
- Ghost: *"Back to the options"*

## 9. Other screens (adapted from handoff)

| Screen | Sentient changes |
|---|---|
| Setup | "Welcome to Sentient"; keyboard row hidden or "Coming soon" |
| Capture (Share) | Quick actions: "What can I do?", "What am I missing?" |
| History | Pills: understanding name or "Perspective" |
| Android bubble | 2 tiles: What can I do? · What am I missing? |
| Settings | "Default understanding" (not tone); no translate row in v1 |
| Pro card | "Unlimited rewrites, every way to be understood" |

## 10. Design system

Use **Mail a Moment** tokens from `docs/handoff/design_handoff_kindly/DESIGN_TOKENS.md`.

- Oxblood `#7F3523` — sole primary/brand
- DM Sans — all UI; DM Serif Display — wordmark + Send-back preview only
- Pill buttons, warm paper background, calm editorial copy
- Never label surfaces "AI", "Generate", or "Magic"
- en-GB copy; sentence case; no emoji; no exclamation marks (except inside quoted messages)

## 11. State model

```typescript
type Intent = 'do' | 'missing';

type Understanding =
  | 'calm'
  | 'confident'
  | 'curious'
  | 'compassionate'
  | 'firm'
  | 'professional';

interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
}

interface RewriteSession {
  capturedMessage: string;
  contactName: string;
  sourceApp: string;
  roughDraft: string;
  intent: Intent;
  understanding?: Understanding;
  perspective?: string;
  results: RewriteOption[];
  chosenReply: string;
}

interface UserSettings {
  defaultUnderstanding: Understanding;
  editBeforeSend: boolean;
  saveHistory: boolean;
}
```

## 12. API contract (Supabase Edge Function)

**POST** `/functions/v1/rewrite`

Request:

```json
{
  "capturedMessage": "string",
  "roughDraft": "string | null",
  "intent": "do | missing",
  "understanding": "calm | confident | ... | null",
  "contactName": "string | null"
}
```

Response (success):

```json
{
  "perspective": "string | null",
  "options": [
    { "label": "string", "tag": "string", "text": "string", "recommended": true }
  ]
}
```

Response (moderation block):

```json
{ "blocked": true, "message": "Something here needs another look." }
```

Pipeline: Moderation API on input → if pass, OpenAI completion with intent-specific system prompt → validate output count = 3.

## 13. Privacy

- Sentient only reads a message when the user shares it.
- Never watches chats in the background.
- "Always let me edit first" ON by default.
- History private to account; can be disabled.
- API key never on device.

## 14. Build phases

| Phase | Scope |
|---|---|
| 0 | Repo, superpowers docs, Cursor rules, Expo scaffold |
| 1 | Theme + UI primitives |
| 2 | Choose → Compare → Send back + edge function |
| 3 | Setup + Supabase auth |
| 4 | iOS Share Extension |
| 5 | History |
| 6 | Settings |
| 7 | Android bubble |
| 8 | RevenueCat + Pro gating |
| 9 | v1.1 backlog: keyboard, translate, more intents |

## 15. Out of scope (v1)

- Custom iOS keyboard
- Translate to German / multi-language
- Apologise, Set boundary, legacy tone chips
- Custom-keyboard entry screen
- Full empty/error state catalogue beyond spec copy

## 16. Open items (none blocking v1)

All blocking decisions resolved 2026-07-04. Revisit at v1.1 planning.
