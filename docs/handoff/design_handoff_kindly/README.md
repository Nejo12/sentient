# Handoff: Kindly — cross-app message improvement tool

> A mobile app that helps people fix a reply *before* they send it — improve, soften, clarify, translate, or get advice — without leaving WhatsApp, Messenger, or iMessage. iOS uses a Share Extension; Android uses a floating bubble.

This folder is the complete design handoff for the PM and the implementing developer (e.g. via Cursor). It is written to be **self-sufficient**: someone who was not in the design conversation should be able to build the app to look and feel exactly like the mockups from this document alone.

---

## 1. What is in this folder

| File | For | What it is |
|---|---|---|
| `README.md` | Developer | This file — full screen-by-screen build spec, tokens, interactions. |
| `PRODUCT_BRIEF.md` | PM | Scope, user flow, monetization, MVP cut lines, open questions. |
| `DESIGN_TOKENS.md` | Developer | Copy-paste color / type / spacing / radius / shadow values. |
| `CURSOR_GUIDE.md` | Developer | Step-by-step way to feed this into Cursor and build screen by screen. |
| `design/Kindly.dc.html` | Both | The actual design prototype (open in any browser to see all 8 screens). |
| `design/design-system-tokens.css` | Developer | The source design-system stylesheet (colors, type, components). |
| `screens/*.png` | Both | Rendered PNG of each screen, for quick skimming without opening the prototype. |

### Screen images (`screens/`)
`00-setup.png` · `01-capture.png` · `02-choose.png` · `03-compare.png` · `04-send-back.png` · `05-history.png` · `06-android-bubble.png` · `07-settings.png`. These match the sections in §6 below one-to-one.

### How to view the design
Open `design/Kindly.dc.html` in a browser. It is a horizontally-scrolling storyboard of all 8 screens at real iPhone proportions (384 × 832 device frames). Pan/zoom to inspect any screen. Every color, font size, and spacing value in this README is taken directly from that file.

---

## 2. About the design files (read this first)

The files in `design/` are **design references created in HTML** — a prototype that shows the intended look, copy, and behavior. **They are not production code to copy directly.**

The task is to **recreate these designs in the target codebase** using its established patterns and libraries. The intended stack (from the PM) is:

- **React Native / Expo** for the app
- **OpenAI API** for the rewriting / advice / translation
- **Supabase** for auth, history, and (later) subscription records
- **RevenueCat** for mobile subscriptions (later)
- **iOS Share Extension** and **Android floating bubble (chat-head / overlay)** as the two platform entry points — this is the core differentiator

Build the UI in React Native (StyleSheet or your preferred styling lib) to match the visuals below. The HTML/CSS is the *spec*, not the *implementation*.

---

## 3. Fidelity

**High-fidelity (hifi).** These are pixel-level mockups with final colors, typography, spacing, radii, shadows, copy, and interaction states. Recreate the UI faithfully. The one thing intentionally *not* final is the AI-generated reply text — those strings are illustrative examples for one scenario ("replying to a partner upset about cancelled plans" / a German work chat). Real content comes from the OpenAI calls at runtime.

---

## 4. The design system (visual language)

The app uses the **"Mail a Moment" design system** — a calm, editorial, paper-and-ink aesthetic. Full tokens are in `DESIGN_TOKENS.md` and `design/design-system-tokens.css`. The essentials:

- **Warm paper background**, near-black warm ink text, a **single oxblood accent** (`oklch(0.38 0.13 20)` ≈ `#7F3523`) for all primary actions and brand.
- **Clay** (`≈ #9C5A44`) for eyebrow labels and pill text; **soft peach** (`≈ #F1E3D6`) for tinted tiles/selection; **muted olive** (`≈ #7C7838`) for success only.
- **Type:** DM Sans for all UI (400/500/600/700). DM Serif Display (400) **only** for the "Kindly" wordmark and the large reply preview on the Send-back screen.
- **Rounded, soft, low-contrast:** 12–22px radii on cards, 9999px (pill) on buttons, 44px on the device screen, soft diffuse shadows, 1px low-contrast borders. No hard shadows, no gradients except the one oxblood Pro card.
- **Tone of copy:** warm, second person, sentence case, no emoji, no exclamation marks (except inside a quoted user message), commas over em dashes. AI is never labeled "AI" — surfaces are labeled by the *help they give* ("Improve my reply", "Make it softer") or by *tone* ("Warm & honest").
- **Locale:** British English in the UI (`en-GB`). Default translate-into language and pricing currency are set for a euro/German-based user (see Settings).

---

## 5. Global UI patterns (build these once, reuse everywhere)

### Device frame (prototype only)
The black rounded bezel in the mockup is just for presentation — **do not build it**. Build the screen contents to fill the device safe area. iOS status bar and Android status bar are the OS's, not yours.

### Buttons
Pill-shaped (`border-radius: 9999px`), DM Sans 600, letter-spacing `0.12em`, min-height 48px (sm 40, xs 32, lg 52–54).
- **Primary:** background oxblood `#7F3523`, text white, soft shadow. Hover/press → darken to oxblood-strong `#632818`, lift `translateY(-1px)`.
- **Secondary:** background `surface-muted` (translucent warm), 1px `border-strong`, ink text. Hover → white face.
- **Ghost:** transparent, ink-72 text; hover → muted face.
- **Text:** oxblood text, no chrome; hover → underline, 4px offset.

### Pills (labels, not tappable)
Small 11px rounded-6px labels. Variants: **accent** (soft peach bg, clay text, leading dot), **success** (olive-soft bg, olive text, leading dot), **neutral** (transparent, 1px border, ink-55, no dot). Used for tone tags like "Softer", "Recommended", "German".

### Cards
- **Panel:** white / translucent-white face, 1px `border`, 16px radius, medium shadow. Most containers.
- **List item card:** flat white, 1px border, 12–14px radius, small/no shadow. History rows, settings rows.
- **Product stage:** the reply preview frame on Send-back — gradient `#fffcf9 → #ece2da`, 30px radius, long soft shadow + inset white highlight, holds the serif reply text.
- **Inner quote card:** soft-peach bg, 1px accent/20% border — the "advice" banner.

### Icons
All icons are inline SVG, **Lucide** style, 24×24 viewBox, stroke 1.75–1.9, round caps/joins, `currentColor`. Use `lucide-react-native` in the app. Icon names referenced below map to Lucide (`sparkles`, `heart`, `align-left`, `message-circle`, `shield`, `globe`, `arrow-left`, `chevron-right`, `check`, `copy`, `send`, `search`, `settings`, `pencil`, `keyboard`, `lock`, `share`, `home`, `history`, `user`).

### The Kindly brand mark
A rounded-square tile (oxblood bg, white glyph). The glyph is a **speech bubble with a small heart inside** — a custom inline SVG (see the exact path in `design/Kindly.dc.html`, search `M20 11a7.5 7.5`). Sizes used: 26–30px tile in headers, 38px on share targets, 66px on onboarding.

---

## 6. Screens

The MVP is **8 screens**: a one-time setup, the 5-step improve-and-send flow (iOS Share Extension), the Android floating-bubble equivalent, and Settings.

Numbering below matches the storyboard labels.

---

### Setup — "Turn Kindly on" (first run)
**Purpose:** one-time permission grant so Kindly can reach the user's chats.
**Layout:** full-screen paper background, centered content, 24px horizontal padding, 34px top padding.
- **Brand block (centered):** 66×66 oxblood tile (radius 20, soft oxblood shadow) with white brand glyph → serif wordmark "Welcome to Kindly" (DM Serif Display, 28px) → body paragraph, DM Sans 14px, ink-72, max-width ~30ch: *"A kinder reply is two taps away. First, two quick permissions so Kindly can reach your chats."*
- **Permission panel:** white card, 1px border, 18px radius, medium shadow. Two rows separated by a 1px divider (inset 67px from left):
  1. Icon tile (38px, soft-peach bg, oxblood `share` icon) · title **"Add to your Share sheet"** (14px/600) · subtitle "Share any message straight to Kindly" (11.5px, ink-40) · **done state:** 26px olive circle with white check.
  2. Icon tile (`keyboard` icon) · title **"Turn on the keyboard"** · subtitle "Optional — improve as you type" · **action:** secondary xs button **"Enable"**.
- **Reassurance row:** olive `lock` icon (16px) + text, 12px ink-55: *"Kindly only reads a message when you share it. It never watches your chats in the background."*
- **Footer (pinned bottom):** primary lg button full-width **"Continue"**; below it, centered text button **"Sign in to sync your rewrites"**.

**Behavior:** "Enable" and the Share-sheet row deep-link to the OS permission/settings screens. "Continue" advances into the app. "Sign in" opens Supabase auth (Apple / email). Mark each row done (olive check) once its permission is granted.

---

### 01 · Capture — share the message (iOS Share Extension)
**Purpose:** the user selects/copies a message in WhatsApp, taps Share, and picks Kindly. This screen shows the **iOS share sheet over a chat**.
**Layout:** a chat behind a dimming scrim (`oklch(0.15 0.02 30 / 34%)`), with a share sheet sliding up from the bottom.
- **Chat behind (for context):** white chat header (back chevron, 40px circular avatar "S" with warm gradient, name "Sam", olive "online"), warm chat body gradient `#efe6db → #e8ded1`. One outgoing oxblood bubble ("Hey — something blew up at work…") and one incoming white bubble that is **selected** — it has a 2px oxblood ring and a small oxblood "Selected" tag: *"So you're just cancelling again? Cool. Guess I'll figure it out myself."*
- **Share sheet:** translucent warm panel, 26px top radius, up-shadow. Contents top→bottom:
  - Grabber bar (40×5, ink-20).
  - Label "Selected from WhatsApp" (12px, ink-55).
  - Quote card (white, 1px border, 14px radius) of the selected message.
  - **Share targets row:** 4 tiles (56px, radius 16). First = **Kindly** (oxblood, white glyph, focus ring, small olive check badge, label "Kindly"). Others dimmed to 55%: Messages, Mail, Copy.
  - Divider.
  - **"Kindly · quick actions"** label (11px clay), then 3 list rows (soft-peach 34px icon tile + label + chevron): **"Improve my reply"**, **"Make it softer"**, **"Give advice first"**.

**Behavior:** picking Kindly (or a quick action) opens the extension → **02 Choose** (or jumps straight to **03 Compare** if a quick action was tapped). The share extension receives the selected text via the iOS share payload.

---

### 02 · Choose — pick a tone, or improve
**Purpose:** confirm the captured message, optionally add a rough draft, then pick an action.
**Layout:** sheet-style screen on paper. Header: 30px oxblood brand tile + serif "Kindly" + a circular close (X) top-right. Scrollable body, 18px padding, 14px gaps.
- **"You're replying to Sam"** label → white quote card of the captured message.
- **"Your rough draft — optional"** label → an input-style card (translucent white, 1px `border-strong`, 12px radius, min-height 64px) prefilled with the user's messy draft + a blinking oxblood caret: *"im not cancelling on purpose stop making me feel guilty i had work come up"*.
- **Primary lg button, full-width:** `sparkles` icon + **"Improve my reply"**.
- **"Or choose a tone"** label (11px clay), then a **2-column grid** of 6 chips (9px gap). Each chip: white card, 1px border, 13px radius, small shadow, 30px soft-peach icon tile (oxblood icon) + 12.5px/600 label. Hover → clay/45% border + lift. The six:
  1. **Make it softer** (`heart`)
  2. **Make it clearer** (`align-left`)
  3. **Give advice first** (`message-circle`)
  4. **Set a boundary** (`shield`)
  5. **Apologise** (undo/`corner-up-left`)
  6. **Translate to German** (`globe`)

**Behavior:** tapping "Improve my reply" or any chip fires an OpenAI call and navigates to **03 Compare** with a loading state, then the result cards. The rough-draft text (if present) is included in the prompt.

---

### 03 · Compare — a few ways to say it
**Purpose:** show 2–3 tone-labeled rewrite options plus optional advice.
**Layout:** paper screen. Header: circular back button + title **"Softer replies"** + neutral pill **"3 options"** on the right. Body 18px padding, 12px gaps.
- **Advice banner** (soft-peach inner-quote card, 1px accent/20% border): `message-circle` oxblood icon + **"Before you reply"** (12px oxblood/600) + body 12.5px ink-72: *"Sam sounds more hurt than angry. Leading with a quick acknowledgement lands better than defending yourself."* (Only shown when "Give advice first" was chosen, or always as a light nudge.)
- **Result cards (2–3):** white card, 1px border, 16px radius, small shadow, 14px padding. Each:
  - Header row: tone label (12px clay/600) + neutral tag pill + (on the recommended one) a **success "Recommended"** pill pushed right.
  - Body: the rewritten reply, 13.5px ink, line-height 1.6.
  - Actions row: secondary sm **"Copy"** (`copy` icon) + primary sm **"Send back"** (`send` icon), each `flex:1`.
  - The three tones used: **Warm & honest** (tag "Softer", recommended), **Calm & clear** (tag "Clearer"), **Firm but kind** (tag "Boundary").
- **Footer:** centered text button **"Regenerate softer · try another tone"**.

**Number of options is 2 or 3** (a product setting — see `resultCount` in the prototype; default 3).

**Behavior:** "Copy" writes the reply to the clipboard and shows a toast. "Send back" copies + returns to the source app (→ **04 Send back** confirmation, or directly back to WhatsApp on the fast path). "Regenerate" re-calls OpenAI for fresh options. Prefer **edit-in-place** over infinite regenerate.

---

### 04 · Send back — copy and return
**Purpose:** final confirmation of the chosen reply before the user pastes it back. Reinforces that nothing auto-sends.
**Layout:** paper screen. Header: back button + **"Ready to send"**. Body 18px padding, 16px gaps.
- Tone label **"Warm & honest"** + success **"Recommended"** pill.
- **Product-stage preview card** (gradient `#fffcf9 → #ece2da`, 30px radius, long shadow + inset highlight), holding the chosen reply in **DM Serif Display 16px** ink, line-height 1.7. A 32px circular `pencil` edit button top-right (edit-in-place).
- **Copied toast:** olive-soft bg, 1px olive/30% border, 12px radius — 22px olive circle + white check + **"Copied to clipboard"** (13px olive/600).
- Spacer, then **reassurance** (centered, 12.5px ink-55): *"Nothing sends automatically. Kindly copies your reply, then takes you back to WhatsApp so you can paste and hit send yourself."*
- **Primary lg button full-width:** **"Copy & switch to WhatsApp"** + arrow icon.
- **Ghost button full-width:** **"Back to the options"**.

**Behavior:** primary copies text to clipboard and deep-links back to the source app. The pencil makes the preview editable in place.

---

### 05 · History — every rewrite, saved
**Purpose:** the standalone app home for past rewrites (backed by Supabase).
**Layout:** paper screen with a bottom tab bar.
- Header: eyebrow "Kindly" (clay) + title **"Your rewrites"** (22px/600) + circular `settings` button right.
- **Search field:** translucent white, 1px `border-strong`, 12px radius, `search` icon + placeholder **"Search people or messages"**.
- Section label **"Today"** (11px ink-40), then a list of item cards (white, 1px border, 14px radius). Each: 38px rounded avatar tile (per-person gradient, initial) + content:
  - Row: name (14px/600, ellipsized) + **accent pill** (tone) + time (right, 11px ink-40).
  - Snippet (12.5px ink-55, single-line ellipsis).
  - Example rows: "Reply to Sam · Softer · 2h", "Message to Mum · Clearer · 5h", "Landlord · deposit · Firm but kind · Mon", "Thank-you to Priya · Warm · Sun", "Reply to Jonas · German · Sat".
- **Bottom tab bar** (translucent white, 1px top border, blur): **Home**, **History** (active, oxblood), **You** — each a 22px Lucide icon (`home`, `history`, `user`) + 10px label.

**Behavior:** tapping a row reopens that rewrite. Search filters by person/message. Tabs navigate. Empty state copy (per brand): "No matches yet — clear the search to get back to everything."

---

### 06 · Android — the floating bubble
**Purpose:** the Android entry point — the same flow, delivered as a chat-head bubble overlay (no share sheet).
**Layout:** an Android chat (Messenger-style) behind a scrim, with a floating bubble and its expanded panel.
- **Android status bar** (time left, signal/wifi/battery right) + Messenger-style chat header (back arrow, 38px "J" avatar, "Jonas", "Active now · Messenger"). Frame uses a slightly smaller radius (34px screen) and a shorter bottom gesture pill to read as Android.
- **Chat body:** German work exchange — incoming "Können wir das Meeting auf morgen verschieben? Heute wird knapp.", outgoing oxblood "yeah ok fine whatever works", incoming "Alles gut bei dir? Klingst gestresst."
- **Floating bubble:** 56px oxblood circle, white brand glyph, elevated shadow, docked at the right edge (`bottom ~238px, right 18px`). This persists over the chat (Android overlay / `TYPE_APPLICATION_OVERLAY`).
- **Expanded panel** (translucent warm, 22px radius, big shadow, 14px inset from edges, near bottom): header (26px oxblood tile + serif "Kindly" + "on Messenger" + collapse chevron) → white quote card of the tapped message ("yeah ok fine whatever works") → **3 quick-action tiles** in a row (white, 1px border, 12px radius, centered oxblood icon + 11px label): **Improve** (`sparkles`), **Softer** (`heart`), **Translate** (`globe`) → primary button **"Open full options in Kindly"**.

**Behavior:** the bubble floats above any app (requires the "draw over other apps" permission granted in Setup). Tapping expands the panel; the quick actions run inline; "Open full options" launches the full app flow (equivalent to **02/03**). Android reads the source text from the clipboard or accessibility selection.

---

### 07 · Settings — your defaults
**Purpose:** defaults, privacy, and the subscription upsell.
**Layout:** paper screen, back button + **"Settings"** title, bottom tab bar with **You** active.
- **"Defaults"** section (clay label) → white card, 18px radius, medium shadow, two rows (divider inset 58px):
  - `heart` tile + **"Default tone"** + value **"Warm & honest"** + chevron.
  - `globe` tile + **"Translate into"** + value **"German"** + chevron. *(Default is German per the euro/German-based user.)*
- **"Before anything sends"** section → white card, two toggle rows (both ON = oxblood track, white knob right):
  - **"Always let me edit first"** — subtitle "Kindly never sends on its own".
  - **"Save my rewrite history"** — subtitle "Kept private to your account". *(Supabase.)*
- **"Kindly Pro" card:** the one gradient in the app (oxblood → oxblood-strong, 18px radius), white text: `sparkles` + serif **"Kindly Pro"** → body "Unlimited rewrites, every tone, and translation into any language. Cancel whenever." → white pill **"Go Pro"** button (oxblood text) + **"€3.99 / month"**. *(Wire to RevenueCat later.)*

**Behavior:** toggles persist to user prefs (and Supabase if signed in). Tone/language rows open pickers. "Go Pro" opens the RevenueCat paywall.

---

## 7. Interactions & behavior (global)

- **Navigation flow:** Setup → (in-app) Capture/Share → Choose → Compare → Send back → back to source app. History and Settings are reachable from the tab bar. Android replaces Capture with the floating bubble.
- **Loading state (Compare):** while OpenAI responds, show skeleton cards (the prototype uses `hint-placeholder-count="3"`). Keep it calm — no spinner theatrics.
- **Toasts:** olive success toast on copy. Errors stay encouraging and neutral, never red/alarming: e.g. "Something here needs another look." (content-filter trip) or a plain "Couldn't reach Kindly — try again."
- **Motion:** minimal. Entrance `fade-rise` 360ms ease-out; button hover `translateY(-1px)` 200ms; card hover lift + border warm 320ms. Respect `prefers-reduced-motion` (disable all).
- **Hover/press/focus:** buttons darken one step + lift on press; cards lift + border warms on hover; focus ring = 2–4px oxblood/20% glow. Disabled = 0.6 opacity, no pointer.
- **Copy discipline:** sentence case, no emoji, no exclamation marks (except inside a quoted user message), warm second-person voice. Never label anything "AI"/"Generate"/"Magic".

## 8. State management (suggested)

- `capturedMessage: string` — text received from the Share Extension / bubble / clipboard.
- `roughDraft: string` — optional user draft.
- `selectedAction: 'improve' | 'softer' | 'clearer' | 'advice' | 'boundary' | 'apologise' | 'translate'`.
- `results: { tone, tag, text, recommended }[]` — from OpenAI; length = `resultCount` (2–3).
- `chosenReply: string` — for the Send-back screen (editable).
- `settings: { defaultTone, translateInto: 'de', editBeforeSend: true, saveHistory: true }`.
- `history: RewriteRecord[]` — from Supabase.
- `entitlements` — from RevenueCat (free vs Pro).
- Permission flags: `shareExtensionEnabled`, `keyboardEnabled`, `overlayPermission` (Android).

## 9. Data / API

- **OpenAI:** one call per action. Input = captured message + optional rough draft + chosen tone/action + target language. Output = 2–3 `{tone, tag, text}` options + (for advice) a short "Before you reply" note. Do the call server-side (or via a Supabase edge function) to keep the API key off-device.
- **Supabase:** auth (Apple/email), `rewrites` table (person, source app, tone, snippet, full text, timestamp), user settings.
- **RevenueCat:** entitlement gating (free tier has limits; Pro = unlimited) and the paywall behind "Go Pro".

## 10. Design tokens
See `DESIGN_TOKENS.md` (copy-paste values) and `design/design-system-tokens.css` (source). Colors are authored in `oklch`; hex approximations are provided for convenience but the oklch values are authoritative.

## 11. Assets
- **Brand glyph** (speech bubble + heart): inline SVG — the exact path is in `design/Kindly.dc.html` (search `M20 11a7.5 7.5`). No raster logo.
- **All other icons:** Lucide (`lucide-react-native`). No icon fonts, no PNGs.
- **Fonts:** DM Sans + DM Serif Display (Google Fonts). Bundle the `.ttf`/`.woff2` with the app via `expo-font`.
- **No photography** is used in these screens (avatars are CSS gradients + initials — replace with real contact avatars if available).

## 12. Files to reference
- `design/Kindly.dc.html` — the full 8-screen prototype (source of truth for every visual value).
- `design/design-system-tokens.css` — the design-system stylesheet.
- `PRODUCT_BRIEF.md`, `DESIGN_TOKENS.md`, `CURSOR_GUIDE.md` — as described in section 1.
