# Cursor implementation guide — Kindly

This guide is for the developer building Kindly in **React Native / Expo** using Cursor. It turns the design references in this folder into working screens.

## 0. Before you start
1. Open `design/Kindly.dc.html` in a browser. Scroll through all 8 screens — this is the visual source of truth.
2. Read `README.md` (build spec) and `DESIGN_TOKENS.md` (values). Skim `PRODUCT_BRIEF.md` for scope and priorities.
3. Remember: the HTML is a **spec, not code to copy**. You are recreating it natively in React Native.

## 1. Add this folder to Cursor's context
Put the whole `design_handoff_kindly/` folder in your repo (or open it in Cursor). Then, in the Cursor chat, attach `README.md`, `DESIGN_TOKENS.md`, and `design/Kindly.dc.html` so the model can read exact values.

A good opening prompt:

> I'm building "Kindly", a React Native / Expo app. Attached is a full design handoff (README.md = build spec, DESIGN_TOKENS.md = exact colors/type/spacing, Kindly.dc.html = the visual prototype of all 8 screens). Recreate these screens natively in React Native — do not copy the HTML. Start by setting up the design tokens as a theme module, then build screens one at a time. Use `lucide-react-native` for icons and `expo-font` for DM Sans + DM Serif Display. Confirm the theme setup with me before building screens.

## 2. Set up the foundation first
Ask Cursor to create, in order:
1. **`theme.ts`** — a tokens module from `DESIGN_TOKENS.md` (colors, spacing, radii, type scale, shadows). Convert oklch → hex if your styling layer needs it (hex approximations are in the tokens file).
2. **Fonts** — load `DM Sans` (400/500/600/700) and `DM Serif Display` (400) via `expo-font`.
3. **Primitives** — reusable `Button` (primary / secondary / ghost / text + sizes), `Pill` (accent / success / neutral), `Card` (panel / list-item / product-stage), `Toggle`, `Input`, `Icon` (thin wrapper over Lucide at stroke 1.75). Match the "Component quick-reference" in the tokens file.

Get these right before any screen — every screen is assembled from them.

## 3. Build screens in this order
Build the **core loop first** so you can test a real OpenAI round-trip early:
1. **Choose** (02) → **Compare** (03) → **Send back** (04) — wire a live OpenAI call between Choose and Compare.
2. **Capture** (01) — the iOS Share Extension target that hands text into the app.
3. **Setup** (permissions + Supabase auth).
4. **History** (05) — Supabase persistence.
5. **Settings** (07) — defaults + toggles.
6. **Android bubble** (06) — the overlay entry point.
7. **RevenueCat** + Pro gating on the Settings paywall.

For each screen, point Cursor at the matching section of `README.md` — it lists layout, every component, exact copy, and states.

## 4. Platform-specific pieces (the differentiator)
These are native and won't come from a UI library — budget time for them:
- **iOS Share Extension:** a separate extension target that receives the shared text (`NSExtensionItem`) and opens the app (or renders a compact UI). Expo requires a config plugin / prebuild + native code (e.g. `expo-share-extension` or a custom target). The extension UI mirrors screen **01 → 02**.
- **Android floating bubble:** a foreground service with `TYPE_APPLICATION_OVERLAY` (the "draw over other apps" permission requested in Setup), rendering the bubble + expandable panel from screen **06**. This is custom native Android.
- **Keyboard (optional):** an iOS custom keyboard extension — defer unless prioritized.

## 5. Data & keys
- **Never ship the OpenAI key in the app.** Route calls through a Supabase Edge Function (or your backend). Input: captured message + optional rough draft + tone/action + target language. Output: 2–3 `{tone, tag, text}` options + optional advice note.
- **Supabase:** auth (Apple + email), `rewrites` history table, `settings`. See README §8–9.
- **RevenueCat:** entitlements; free tier limits, Pro = unlimited.

## 6. Fidelity checklist (match the mockups)
- [ ] Oxblood `#7F3523` is the only primary/brand color; olive only for success; no stray colors.
- [ ] DM Serif Display used **only** for the "Kindly" wordmark and the Send-back reply preview.
- [ ] Buttons are pill-shaped with 0.12em tracking; primary lifts + darkens on press.
- [ ] Cards use soft diffuse shadows + 1px low-contrast borders; radii 12–22px.
- [ ] Copy matches exactly (sentence case, no emoji, no exclamation marks, warm tone).
- [ ] Nothing is labeled "AI"/"Generate"; actions named by help/tone.
- [ ] Toggles default ON for "edit first" and "save history".
- [ ] Currency €, default translate-into = German.
- [ ] `prefers-reduced-motion` respected; motion is minimal.
- [ ] "Nothing sends automatically" reassurance present on Send-back.

## 7. Tips for working with Cursor
- Build and review **one screen at a time**; paste a screenshot of the corresponding prototype screen into the chat for visual grounding.
- When something looks off, quote the exact token/value from `DESIGN_TOKENS.md` rather than describing it ("the label should be clay `#9C5A44`, 11px, 600, tracking 0.02em").
- Keep the primitives in one place so tone/spacing stays consistent as screens accrete.
- Ask Cursor to keep copy strings in a single `strings` file so the warm tone is easy to review and localize (en-GB + German).
