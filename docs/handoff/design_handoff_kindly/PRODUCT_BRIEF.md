# Kindly — Product Brief (for the PM)

## One-liner
Kindly helps people fix a reply *before* they send it — improve, soften, clarify, translate, or get advice first — **without leaving** WhatsApp, Messenger, or iMessage.

## The problem
The hardest message to write is the one that matters emotionally. People either fire off something they regret, or leave a chat to paste into a separate AI tool and lose the thread. Kindly removes the app-switching: the help comes to the chat.

## The differentiator
Two native entry points, not "another chat app you paste into":
- **iOS:** a **Share Extension** — select a message, tap Share, pick Kindly.
- **Android:** a **floating bubble** (chat-head overlay) that rides on top of any chat.

## Core flow (5 steps)
1. **Capture** — user shares/selects a message from a chat app.
2. **Choose** — pick a tone or action (Improve, Softer, Clearer, Give advice first, Set a boundary, Apologise, Translate to German), optionally add a rough draft.
3. **Compare** — Kindly returns 2–3 tone-labeled options (Warm & honest / Calm & clear / Firm but kind), with an optional "Before you reply" advice note.
4. **Send back** — user picks one, edits in place if they like, copies it.
5. Kindly returns them to the chat to paste and send. **Nothing sends automatically.**

## The 8 MVP screens
1. **Setup** — one-time permissions (Share sheet, keyboard) + sign-in.
2. **Capture** — the share sheet over a chat (iOS).
3. **Choose** — actions + tone chips.
4. **Compare** — 2–3 response cards + advice.
5. **Send back** — final preview, copy, return.
6. **History** — past rewrites (standalone app home).
7. **Android bubble** — the Android entry point.
8. **Settings** — defaults, privacy, Pro upsell.

## Positioning & tone
Calm, warm, editorial — "a thoughtful friend who got the words right for you." **AI is invisible labor:** never labeled "AI" or "Generate". Surfaces are named by the help they give or the tone they carry. The user is always the author. No emoji, sentence case, reassuring not hyped.

## Monetization (revised)
Originally imagined as fully free — but the OpenAI rewriting/translation calls are a real per-use cost, so a light subscription covers it:
- **Free tier:** generous daily limit of rewrites, core tones.
- **Kindly Pro — €3.99 / month:** unlimited rewrites, every tone, translation into any language. (Currency is € and default translate-into language is **German**, set for the euro/German-based audience.)
- Billing via **RevenueCat**; entitlements gate Pro features. Ship the paywall behind "Go Pro" in Settings.

## Tech stack
- **React Native / Expo** (speed).
- **OpenAI API** for rewriting/advice/translation (call server-side / via Supabase edge function — keep the key off-device).
- **Supabase** for auth, rewrite history, settings, and later subscription records.
- **RevenueCat** for subscriptions.
- **iOS Share Extension** + **Android overlay/floating bubble** as the platform entry points.

## Privacy stance (a feature, not fine print)
Kindly only reads a message **when the user shares it**. It never watches chats in the background. "Always let me edit first" is on by default; nothing is sent on the user's behalf. History is private to the account and can be turned off. Surface this clearly — it is central to trust in an emotional-communication product.

## Suggested build order (thin vertical slice first)
1. Capture → Choose → Compare → Send back on **iOS** with a live OpenAI call (the core loop).
2. Setup/permissions + Supabase auth.
3. History (Supabase persistence).
4. Settings + defaults.
5. Android floating bubble.
6. RevenueCat + Pro gating.

## Open questions / decisions for the PM
- **Result count:** 2 or 3 options per request? (Prototype default is 3; fewer = cheaper + faster.)
- **Free-tier limit:** how many free rewrites/day before the Pro nudge?
- **Custom keyboard:** ship the iOS keyboard as a third entry point in v1, or defer? (Referenced in Setup as "optional".)
- **Languages:** German is the default translate-into; which other languages ship free vs Pro?
- **Safety:** the design assumes silent content filtering at approval with a neutral "Something here needs another look." Confirm the moderation approach.
- **Source-app return:** how far can we deep-link back into WhatsApp/Messenger after copy on each OS?

## Not yet designed (offered, not built)
- Custom-keyboard entry screen.
- The "needs another look" safety state.
- Full empty/error states beyond the copy noted in the README.
