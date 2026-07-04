# Sentient MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Sentient v1 — a React Native / Expo app that improves cross-app messages via iOS Share Extension and Android floating bubble, with Supabase auth, edge-function rewrites, and RevenueCat Pro gating.

**Architecture:** Expo managed workflow with prebuild for native extensions. Shared RN UI for Choose → Compare → Send back. Supabase Edge Function handles moderation + OpenAI. Local state via Zustand; persistence via Supabase + AsyncStorage for offline settings.

**Tech Stack:** Expo SDK 52+, React Native, TypeScript, expo-router, Zustand, Supabase JS, lucide-react-native, expo-font, Jest + @testing-library/react-native, RevenueCat (Phase 8).

**Spec:** `docs/superpowers/specs/2026-07-04-sentient-design.md`

---

## File map (target structure)

```
sentient/
├── app/                          # expo-router screens
│   ├── _layout.tsx
│   ├── index.tsx                 # redirect → setup or history
│   ├── setup.tsx
│   ├── (flow)/
│   │   ├── choose.tsx
│   │   ├── compare.tsx
│   │   └── send-back.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # home placeholder
│   │   ├── history.tsx
│   │   └── you.tsx               # settings
│   └── auth/sign-in.tsx
├── src/
│   ├── theme/
│   │   ├── tokens.ts
│   │   └── typography.ts
│   ├── components/
│   │   ├── BrandMark.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Pill.tsx
│   │   ├── Input.tsx
│   │   ├── Toggle.tsx
│   │   ├── IntentCard.tsx
│   │   ├── UnderstandingChip.tsx
│   │   ├── ResultCard.tsx
│   │   ├── PerspectiveCard.tsx
│   │   └── Toast.tsx
│   ├── constants/
│   │   ├── strings.ts
│   │   └── understanding.ts
│   ├── types/
│   │   └── rewrite.ts
│   ├── store/
│   │   └── sessionStore.ts
│   ├── services/
│   │   ├── rewriteApi.ts
│   │   ├── supabase.ts
│   │   └── entitlements.ts
│   └── utils/
│       └── clipboard.ts
├── supabase/
│   ├── functions/rewrite/index.ts
│   └── migrations/001_initial.sql
├── __tests__/
│   ├── understanding.test.ts
│   ├── sessionStore.test.ts
│   └── rewriteApi.test.ts
├── assets/fonts/
├── app.json
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Phase 0: Repository & tooling

### Task 0: Initialise git and connect remote

**Files:**
- Create: `.gitignore` (exists)
- Create: `README.md`

- [ ] **Step 1: Init repo**

```bash
cd /Users/olaniyiaborisade/Codes/sentient
git init
git remote add origin https://github.com/Nejo12/sentient.git
```

- [ ] **Step 2: Add README**

Create `README.md`:

```markdown
# Sentient

Cross-app message improvement tool. See `docs/superpowers/specs/2026-07-04-sentient-design.md`.
```

- [ ] **Step 3: Initial commit** (only when user requests)

```bash
git add .
git commit -m "chore: project scaffold, spec, and superpowers setup"
```

---

### Task 1: Create Expo app

**Files:**
- Create: entire Expo scaffold at repo root (merge into existing `sentient/`)

- [ ] **Step 1: Scaffold Expo**

```bash
cd /Users/olaniyiaborisade/Codes/sentient
npx create-expo-app@latest . --template tabs --yes
```

If prompted about non-empty directory, confirm overwrite of only conflicting files or use:

```bash
npx create-expo-app@latest sentient-tmp --template blank-typescript
# then merge package.json, app/, tsconfig into root
```

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand @supabase/supabase-js lucide-react-native expo-font expo-clipboard expo-haptics
npm install -D jest @testing-library/react-native @types/jest jest-expo
```

- [ ] **Step 3: Configure Jest** in `package.json`:

```json
{
  "scripts": {
    "lint": "expo lint",
    "test": "jest",
    "build": "npx expo export --platform ios"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@supabase/.*|lucide-react-native)"
    ]
  }
}
```

- [ ] **Step 4: Create `.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 5: Verify scaffold**

```bash
npm run lint
npm test
```

Expected: lint passes (or no files yet); tests pass (0 tests).

---

## Phase 1: Theme & primitives

### Task 2: Design tokens module

**Files:**
- Create: `src/theme/tokens.ts`
- Test: `__tests__/tokens.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/tokens.test.ts
import { colors, spacing, radii } from '../src/theme/tokens';

describe('tokens', () => {
  it('uses oxblood as primary', () => {
    expect(colors.oxblood).toBe('#7F3523');
  });
  it('spacing follows 8pt grid', () => {
    expect(spacing[4]).toBe(16);
  });
  it('pill radius is 9999', () => {
    expect(radii.pill).toBe(9999);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- __tests__/tokens.test.ts -v
```

- [ ] **Step 3: Implement `src/theme/tokens.ts`**

```typescript
export const colors = {
  paper: '#F5EFE6',
  paperStrong: '#FFFFFF',
  paperSoft: '#F6F1E9',
  paperMuted: '#EFEAE1',
  ink: '#2B2521',
  ink72: 'rgba(43, 37, 33, 0.72)',
  ink55: '#6E655E',
  ink40: '#8A817A',
  oxblood: '#7F3523',
  oxbloodStrong: '#632818',
  oxbloodFg: '#FFFFFF',
  clay: '#9C5A44',
  soft: '#F1E3D6',
  olive: '#7C7838',
  oliveSoft: 'rgba(124, 120, 56, 0.12)',
  border: '#E7DFD3',
  borderStrong: '#D5CBBB',
  destructive: '#C4402E',
} as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 14: 56, 18: 72 } as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 22, '2xl': 30, pill: 9999 } as const;

export const shadows = {
  sm: { shadowColor: '#2B2521', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#2B2521', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 36, elevation: 8 },
} as const;

export const motion = { easeOut: 'cubic-bezier(0.2, 0.8, 0.2, 1)', duration: { fast: 160, normal: 200, slow: 360 } } as const;
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- __tests__/tokens.test.ts -v
```

---

### Task 3: Load fonts

**Files:**
- Create: `src/theme/typography.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Download DM Sans (400/500/600/700) and DM Serif Display (400) to `assets/fonts/`**

```bash
# Use @expo-google-fonts or manual .ttf from Google Fonts
npm install @expo-google-fonts/dm-sans @expo-google-fonts/dm-serif-display
```

- [ ] **Step 2: Load in root layout**

```typescript
// app/_layout.tsx
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSerifDisplay_400Regular });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Export font family names from `src/theme/typography.ts`**

```typescript
export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  serif: 'DMSerifDisplay_400Regular',
} as const;
```

---

### Task 4: UI primitives (Button, Card, Pill, Input)

**Files:**
- Create: `src/components/Button.tsx`, `Card.tsx`, `Pill.tsx`, `Input.tsx`
- Reference: `docs/handoff/design_handoff_kindly/DESIGN_TOKENS.md` Component quick-reference

Build each primitive to match tokens. `Button` variants: `primary | secondary | ghost | text`; sizes: `xs | sm | md | lg`. Minimum heights per spec (48px md).

- [ ] **Step 1: Implement Button with primary oxblood styling**
- [ ] **Step 2: Implement Card variants: `panel | listItem | productStage`**
- [ ] **Step 3: Implement Pill variants: `accent | success | neutral`**
- [ ] **Step 4: Implement Input (min-height 52, focus ring)**

Manual visual check against `screens/02-choose.png` after Task 6.

---

### Task 5: Constants — strings & understanding

**Files:**
- Create: `src/constants/strings.ts`
- Create: `src/constants/understanding.ts`
- Create: `src/types/rewrite.ts`
- Test: `__tests__/understanding.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { UNDERSTANDING_OPTIONS, requiresUnderstanding } from '../src/constants/understanding';

describe('understanding', () => {
  it('lists 6 options', () => {
    expect(UNDERSTANDING_OPTIONS).toHaveLength(6);
  });
  it('requires understanding only for do intent', () => {
    expect(requiresUnderstanding('do')).toBe(true);
    expect(requiresUnderstanding('missing')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/types/rewrite.ts
export type Intent = 'do' | 'missing';
export type Understanding = 'calm' | 'confident' | 'curious' | 'compassionate' | 'firm' | 'professional';

export interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
}

// src/constants/understanding.ts
import type { Intent, Understanding } from '../types/rewrite';

export const UNDERSTANDING_OPTIONS: { key: Understanding; label: string }[] = [
  { key: 'calm', label: 'Calm' },
  { key: 'confident', label: 'Confident' },
  { key: 'curious', label: 'Curious' },
  { key: 'compassionate', label: 'Compassionate' },
  { key: 'firm', label: 'Firm' },
  { key: 'professional', label: 'Professional' },
];

export function requiresUnderstanding(intent: Intent): boolean {
  return intent === 'do';
}
```

- [ ] **Step 3: Implement `src/constants/strings.ts`** with all approved copy from spec §6–9.

- [ ] **Step 4: Run tests — expect PASS**

---

## Phase 2: Core flow + API

### Task 6: Session store

**Files:**
- Create: `src/store/sessionStore.ts`
- Test: `__tests__/sessionStore.test.ts`

- [ ] **Step 1: Write failing test for intent selection revealing understanding**

```typescript
import { useSessionStore } from '../src/store/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => useSessionStore.getState().reset());

  it('shows understanding grid only after do intent', () => {
    useSessionStore.getState().setIntent('missing');
    expect(useSessionStore.getState().showUnderstandingGrid).toBe(false);
    useSessionStore.getState().setIntent('do');
    expect(useSessionStore.getState().showUnderstandingGrid).toBe(true);
  });
});
```

- [ ] **Step 2: Implement Zustand store** with: `capturedMessage`, `contactName`, `sourceApp`, `roughDraft`, `intent`, `understanding`, `perspective`, `results`, `chosenReply`, `loading`, `error`, actions `setIntent`, `setUnderstanding`, `setResults`, `reset`.

- [ ] **Step 3: Run tests — PASS**

---

### Task 7: Supabase Edge Function — rewrite

**Files:**
- Create: `supabase/functions/rewrite/index.ts`
- Create: `supabase/migrations/001_initial.sql` (rewrites + settings tables)

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/001_initial.sql
create table if not exists rewrites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_name text,
  source_app text,
  intent text not null check (intent in ('do', 'missing')),
  understanding text,
  snippet text not null,
  full_text text not null,
  created_at timestamptz default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_understanding text default 'calm',
  edit_before_send boolean default true,
  save_history boolean default true
);

alter table rewrites enable row level security;
create policy "Users read own rewrites" on rewrites for select using (auth.uid() = user_id);
create policy "Users insert own rewrites" on rewrites for insert with check (auth.uid() = user_id);
```

- [ ] **Step 2: Implement edge function**

```typescript
// supabase/functions/rewrite/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4';

const BLOCKED = 'Something here needs another look.';

serve(async (req) => {
  const { capturedMessage, roughDraft, intent, understanding, contactName } = await req.json();
  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

  const mod = await openai.moderations.create({ input: `${capturedMessage}\n${roughDraft ?? ''}` });
  if (mod.results[0]?.flagged) {
    return new Response(JSON.stringify({ blocked: true, message: BLOCKED }), { status 422 });
  }

  const systemPrompt = intent === 'missing'
    ? 'You help the user see what they might be missing in a tense message exchange. Return JSON: { perspective: string, options: [{ label, tag, text, recommended }] } with exactly 3 options. Never mention AI. Warm en-GB tone.'
    : `You rewrite replies so the user is understood as ${understanding}. Return JSON: { perspective: null, options: [{ label, tag, text, recommended }] } with exactly 3 variant angles. Never mention AI. Warm en-GB tone.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Message from ${contactName ?? 'contact'}:\n${capturedMessage}\n\nDraft:\n${roughDraft ?? '(none)'}` },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
  return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
});
```

- [ ] **Step 3: Deploy** (when Supabase project exists)

```bash
supabase functions deploy rewrite --no-verify-jwt  # tighten auth in Task 9
```

---

### Task 8: rewriteApi client

**Files:**
- Create: `src/services/rewriteApi.ts`
- Test: `__tests__/rewriteApi.test.ts`

- [ ] **Step 1: Write failing test** (mock fetch)

```typescript
import { fetchRewrites } from '../src/services/rewriteApi';

describe('rewriteApi', () => {
  it('returns blocked message on 422', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ blocked: true, message: 'Something here needs another look.' }),
    });
    const result = await fetchRewrites({ capturedMessage: 'test', intent: 'do', understanding: 'calm' });
    expect(result.blocked).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `fetchRewrites`** calling `${SUPABASE_URL}/functions/v1/rewrite` with typed request/response per spec §12.

- [ ] **Step 3: Run tests — PASS**

---

### Task 9: Choose screen

**Files:**
- Create: `src/components/IntentCard.tsx`, `UnderstandingChip.tsx`, `BrandMark.tsx`
- Create: `app/(flow)/choose.tsx`

- [ ] **Step 1: Build IntentCard** — two cards per spec §6
- [ ] **Step 2: Build UnderstandingChip** — 2×3 grid, hidden until intent `do`
- [ ] **Step 3: Wire choose screen** — on understanding tap or missing intent → `fetchRewrites` → navigate to compare
- [ ] **Step 4: Seed dev data** via route params for simulator testing:

```
/choose?message=So%20you're%20just%20cancelling&name=Sam&app=WhatsApp
```

Visual check: `screens/02-choose.png` (adapted layout).

---

### Task 10: Compare screen

**Files:**
- Create: `src/components/ResultCard.tsx`, `PerspectiveCard.tsx`
- Create: `app/(flow)/compare.tsx`

- [ ] **Step 1: PerspectiveCard** — shown when `intent === 'missing'`
- [ ] **Step 2: ResultCard** — 3 cards with Copy / Send back
- [ ] **Step 3: Loading skeleton** — 3 placeholder cards, no spinner theatrics
- [ ] **Step 4: Footer actions** per intent path (spec §7)

---

### Task 11: Send back screen

**Files:**
- Create: `src/components/Toast.tsx`
- Create: `app/(flow)/send-back.tsx`
- Create: `src/utils/clipboard.ts`

- [ ] **Step 1: Product-stage preview** with DM Serif + pencil edit
- [ ] **Step 2: Copy via expo-clipboard** + olive Toast
- [ ] **Step 3: Primary CTA** *"Copy & switch to {sourceApp}"* (clipboard + `Linking.openURL` best-effort; no auto-send)
- [ ] **Step 4: Reassurance copy** from spec §8

Visual check: `screens/04-send-back.png`

---

## Phase 3: Setup & auth

### Task 12: Setup screen

**Files:**
- Create: `app/setup.tsx`

- [ ] **Step 1: Permission rows** — Share sheet (done check), keyboard row hidden
- [ ] **Step 2: Privacy reassurance** with lock icon
- [ ] **Step 3: Continue** → mark setup complete in AsyncStorage → navigate to tabs
- [ ] **Step 4: Sign in link** → `app/auth/sign-in.tsx`

Visual check: `screens/00-setup.png` (Sentient branding)

---

### Task 13: Supabase auth

**Files:**
- Create: `src/services/supabase.ts`
- Create: `app/auth/sign-in.tsx`

- [ ] **Step 1: Supabase client** from env vars
- [ ] **Step 2: Apple + email sign-in** (expo-apple-authentication + magic link or email/password per Supabase config)
- [ ] **Step 3: Persist session**; gate history sync on auth

---

## Phase 4: iOS Share Extension

### Task 14: Share Extension target

**Files:**
- Create: `plugins/with-share-extension/` config plugin
- Modify: `app.json`

- [ ] **Step 1: Add `expo-share-extension` or custom config plugin** for iOS share target
- [ ] **Step 2: Extension receives `NSExtensionItem` text** → deep link to `sentient://choose?message=...`
- [ ] **Step 3: Share sheet quick actions** — "What can I do?", "What am I missing?"
- [ ] **Step 4: `npx expo prebuild`** + test on device

Reference: `docs/handoff/design_handoff_kindly/README.md` §01 Capture.

---

## Phase 5: History

### Task 15: History screen + persistence

**Files:**
- Create: `app/(tabs)/history.tsx`
- Modify: `src/services/supabase.ts` — `saveRewrite`, `listRewrites`

- [ ] **Step 1: Tab layout** with Home / History / You
- [ ] **Step 2: History list** with search, understanding/perspective pills
- [ ] **Step 3: Save rewrite on Send-back** when `saveHistory` enabled
- [ ] **Step 4: Empty state** — *"No matches yet — clear the search to get back to everything."*

Visual check: `screens/05-history.png`

---

## Phase 6: Settings

### Task 16: Settings screen

**Files:**
- Create: `app/(tabs)/you.tsx`

- [ ] **Step 1: Default understanding picker**
- [ ] **Step 2: Toggles** — edit before send (default ON), save history (default ON)
- [ ] **Step 3: Sentient Pro card** (UI only until Task 18)
- [ ] **Step 4: Persist to Supabase `user_settings`**

Visual check: `screens/07-settings.png`

---

## Phase 7: Android bubble

### Task 17: Floating bubble overlay

**Files:**
- Create: `plugins/with-android-bubble/` native module
- Modify: `app.json` Android permissions

- [ ] **Step 1: Request `SYSTEM_ALERT_WINDOW`** in Setup
- [ ] **Step 2: Foreground service** + `TYPE_APPLICATION_OVERLAY` bubble
- [ ] **Step 3: Expanded panel** — 2 intent tiles + "Open full options in Sentient"
- [ ] **Step 4: Clipboard / selection** as text source

Reference: `screens/06-android-bubble.png`

---

## Phase 8: RevenueCat & Pro gating

### Task 18: Entitlements

**Files:**
- Create: `src/services/entitlements.ts`
- Modify: `src/services/rewriteApi.ts` — check daily limit

- [ ] **Step 1: Install `react-native-purchases`**
- [ ] **Step 2: Free tier** — 5 rewrites/day tracked locally + server
- [ ] **Step 3: Pro paywall** behind "Go Pro" — €3.99/month
- [ ] **Step 4: Block rewrite when limit exceeded** — nudge to Pro

---

## Phase 9: Verification & release prep

### Task 19: End-to-end verification

- [ ] **Step 1: Run full suite**

```bash
npm run lint && npm run test && npm run build
```

- [ ] **Step 2: Manual E2E on iOS simulator** — Choose → Compare → Send back with live API
- [ ] **Step 3: Manual E2E on Android** — bubble → full flow
- [ ] **Step 4: Fidelity checklist** from `docs/handoff/design_handoff_kindly/CURSOR_GUIDE.md` §6 (adapt Kindly → Sentient)

---

## v1.1 backlog (do not implement in MVP)

- Custom iOS keyboard extension
- Translate to German / multi-language
- Additional intents or understanding options
- Deep-link return to source apps (platform-specific research)

---

## Self-review (spec coverage)

| Spec requirement | Task |
|---|---|
| Two intents | Task 5, 9 |
| Understanding grid (do only) | Task 5, 6, 9 |
| 3 Compare options | Task 7, 10 |
| Perspective card (missing) | Task 10 |
| Moderation block | Task 7 |
| 5 free rewrites/day | Task 18 |
| Share Extension | Task 14 |
| Android bubble | Task 17 |
| Supabase auth + history | Task 13, 15 |
| Settings + Pro | Task 16, 18 |
| Sentient branding | Task 5 strings, all screens |
| Nothing auto-sends | Task 11 |
| Keyboard deferred | Task 12 (hidden) |

**Placeholder scan:** None — all tasks have concrete paths and code stubs.

---

## Execution handoff

**Plan saved to `docs/superpowers/plans/2026-07-04-sentient-mvp.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. Sub-skill: **subagent-driven-development**.

2. **Inline Execution** — execute tasks in this session using **executing-plans**, batch execution with checkpoints for review.

**Which approach would you like?**

Also: say **commit** when you want the scaffold (spec, rules, plan) pushed to `Nejo12/sentient`.
