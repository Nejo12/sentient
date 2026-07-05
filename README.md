# Sentient

Cross-app message improvement tool — help people say the right thing before they send it.

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
- **Visual handoff:** [`docs/handoff/design_handoff_kindly/`](docs/handoff/design_handoff_kindly/)

## Stack

React Native / Expo 57 · Supabase · OpenAI (edge functions) · RevenueCat

## Status

MVP core flow working in simulator (Choose → Compare → Send back). Share extension requires a dev build on a physical iPhone.
