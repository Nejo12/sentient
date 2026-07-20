# Sentient 1.0 launch runbook

## 1. Freeze and validate

- [ ] PR #15 is merged into `main`
- [ ] `npm ci && npm run validate` passes from a clean checkout
- [ ] Release Candidate checklist is complete on current iOS and Android production builds
- [ ] Production Supabase project, Edge Functions and secrets are confirmed
- [ ] RevenueCat production offerings and entitlement are confirmed
- [ ] No development sample data or debug controls are visible

## 2. Store records and legal pages

- [ ] Apple app record matches `com.gee1216.sentient`
- [ ] Google Play app record matches `com.gee1216.sentient`
- [ ] Support URL is live
- [ ] Privacy Policy URL is live
- [ ] Terms of Use URL is live
- [ ] Account deletion/help URL is live
- [ ] App Privacy answers are complete
- [ ] Google Play Data safety form is complete
- [ ] Android overlay permission declaration is complete

## 3. Assets and listing

- [ ] Production icon and Android adaptive icon inspected on physical devices
- [ ] Splash screen inspected in light and dark system appearance
- [ ] iPhone screenshots exported at required current sizes
- [ ] Android phone screenshots exported
- [ ] Screenshots show real product behavior with fictional data
- [ ] Store descriptions reviewed against current functionality
- [ ] No screenshot or copy claims certainty about another person's intent

## 4. Build

Run from a clean, committed `main` branch:

```bash
npm ci
npm run validate
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

`appVersionSource` is remote and production builds use `autoIncrement`, so EAS owns store build-number increments. The checked-in build numbers remain the initial local baseline.

## 5. Internal distribution

- [ ] iOS build installed through TestFlight internal testing
- [ ] Android build submitted to the Play internal track
- [ ] Authentication tested with a new account and existing account
- [ ] Purchase, restore and entitlement refresh tested
- [ ] Share extension tested from Messages, WhatsApp, Mail and browser text selection where supported
- [ ] Android bubble permission requested only from the feature setup context
- [ ] Account deletion tested end-to-end

## 6. Submission

```bash
npx eas-cli submit --platform ios --profile production --latest
npx eas-cli submit --platform android --profile production --latest
```

Android production submission remains targeted at the internal track until release approval. Promote through Play Console only after internal acceptance.

## 7. Review notes

Explain clearly:

- Sentient analyses only text deliberately pasted or shared.
- It does not monitor messages in the background.
- It never sends a reply automatically.
- The iOS share extension is an input route into the app.
- The Android overlay/bubble is optional and exists to open Sentient quickly; describe how reviewers can enable and test it.
- Provide a review account when authentication blocks meaningful review.
- Provide exact steps for finding subscription purchase and restore controls.

## 8. Release and rollback

- [ ] Phased release selected where available
- [ ] Release owner named
- [ ] Backend deployment SHA recorded
- [ ] Mobile Git SHA recorded
- [ ] EAS build IDs recorded
- [ ] RevenueCat configuration snapshot recorded
- [ ] Rollback decision criteria agreed

Stop rollout for authentication failure, cross-account data exposure, message-content logging, broken account deletion, unusable share flow, widespread analysis failure or incorrect subscription access.
