# iOS share extension scaffold

## Current approach

Sentient uses `expo-share-intent` for Expo SDK 57 share-target scaffolding.

- Package: `expo-share-intent@8.x`
- App scheme: `sentient`
- Expected deep link shape: `sentient://choose?message=<encoded>&sourceApp=<encoded>`
- Runtime parser: `src/services/shareIntent.ts`

## Why this is scaffold-only

A full custom native share extension target still requires iOS prebuild and native target review. This task keeps the managed-workflow-safe integration in place so deep-link handoff can be tested first.

## Implemented integration points

1. `app.json`
   - Adds `expo-share-intent` plugin.
   - Keeps scheme as `sentient`.
2. Root app provider
   - `ShareIntentProvider` is mounted in `app/_layout.tsx`.
3. Share parsing
   - `parseShareIntent()` converts URL/params into:
     - `message`
     - `sourceApp`
4. Choose screen listener
   - `app/(flow)/choose.tsx` listens for:
     - route params
     - deep-link events (`Linking.addEventListener('url', ...)`)
     - `expo-share-intent` context payloads

## Local verification flow

1. Install dependencies:

```bash
npm install
```

2. Build dev client (Expo Go is not enough for share extension testing):

```bash
npx expo prebuild --clean
npx expo run:ios
```

3. Share text from another iOS app to Sentient.
4. Confirm Choose screen quote card is populated from shared content.

## If plugin support is insufficient

Follow `plugins/with-share-extension/README.md` for a custom native target path (manual iOS extension target + explicit deep-link handoff back to Sentient).
