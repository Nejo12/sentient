# Sentient

Communication intelligence for conversations that matter — understand an ambiguous message and prepare a clear reply before you send it.

**Intents:** What can I do? · What am I missing?  
**Understanding:** Calm, Confident, Curious, Compassionate, Firm, Professional

## Quick start

```bash
cp .env.example .env   # add Supabase URL + anon key
npm install
npx expo start         # press i for iOS simulator
```

**Backend:** Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor, set `OPENAI_API_KEY` in Edge Function secrets, then:

```bash
supabase functions deploy rewrite --project-ref YOUR_PROJECT_REF
```

## Docs

- **Design spec:** [`docs/superpowers/specs/2026-07-04-sentient-design.md`](docs/superpowers/specs/2026-07-04-sentient-design.md)
- **Implementation plan:** [`docs/superpowers/plans/2026-07-04-sentient-mvp.md`](docs/superpowers/plans/2026-07-04-sentient-mvp.md)
- **iOS share extension:** [`docs/platform/ios-share-extension.md`](docs/platform/ios-share-extension.md)
- **Android bubble:** [`docs/platform/android-bubble.md`](docs/platform/android-bubble.md)
- **Brand identity:** [`docs/brand/identity.md`](docs/brand/identity.md)
- **Store listing copy:** [`docs/release/store-listing.md`](docs/release/store-listing.md)
- **Launch runbook:** [`docs/release/launch-runbook.md`](docs/release/launch-runbook.md)
- **Visual handoff:** [`docs/handoff/design_handoff_kindly/`](docs/handoff/design_handoff_kindly/)

## Stack

React Native / Expo 57 · Supabase · OpenAI (edge functions) · RevenueCat · EAS Build/Update

## Status

**v1.0.1** — preparing for App Store submission.

- Core flow complete: Choose → Compare → Send back, with progressive disclosure into deeper reasoning and alternative replies.
- Cross-app capture via the iOS share extension (`expo-share-intent`) and an Android floating bubble; the Choose screen also works standalone as a paste-a-message entry point for apps that don't expose a share-sheet action for text (e.g. WhatsApp — see [`docs/platform/ios-share-extension.md`](docs/platform/ios-share-extension.md)).
- Public compliance surfaces live: [Privacy](docs/privacy.html), [Support](docs/support.html), [Account deletion](docs/delete-account.html).
- Requires a dev build on a physical device to exercise the share extension and Android bubble end to end — see the [launch runbook](docs/release/launch-runbook.md) for the full pre-submission checklist.
