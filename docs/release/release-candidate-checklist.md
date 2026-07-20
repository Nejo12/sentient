# Release candidate checklist

This checklist is the acceptance boundary for Sentient 1.0. A release candidate is not approved because it builds; it is approved when the complete communication workflow is reliable, private and understandable.

## Automated gate

Run:

```bash
npm ci
npm run validate
```

This verifies release configuration, TypeScript, lint and the complete test suite. The same command runs on every pull request and every push to `main`.

## Core journey

- Complete onboarding from a clean install.
- Paste a message and complete both `What can I do?` and `What am I missing?` flows.
- Copy a recommended reply without opening deeper analysis.
- Expand and collapse understanding, risks and alternatives.
- Regenerate and confirm old disclosures close before the new result appears.
- Open a saved rewrite, expand the complete text and search for it.
- Sign in, sign out and confirm local/account history behaviour is expected.

## Failure matrix

Test each condition without losing the user's captured message:

- offline before request
- connection lost during request
- expired or missing session
- malformed backend response
- rewrite limit reached
- RevenueCat unavailable
- Supabase unavailable

Every failure must use user-facing language, expose one clear recovery action where recovery is possible and avoid raw provider errors.

## Privacy and account lifecycle

- Confirm message bodies are absent from analytics, diagnostics and console output.
- Confirm account deletion removes the authenticated user's stored rewrites.
- Confirm sign-out does not expose another account's records.
- Confirm locally stored rewrites are migrated only after explicit authentication.
- Confirm saved-history off means no new history record is persisted.
- Review Supabase row-level security for `rewrites` and account deletion functions.

## Device coverage

- Current iPhone size and one small iPhone size.
- Current Android device and one narrow Android viewport.
- Large text / Dynamic Type.
- VoiceOver or TalkBack for primary actions and disclosure state.
- Reduced-motion setting.
- Light and dark system appearance, even where the app currently uses one visual palette.

## Release ownership

Before promotion to App Store Launch, record:

- candidate version and build number
- backend deployment identifier
- Supabase project/environment
- RevenueCat environment and entitlement identifier
- known limitations
- rollback owner and rollback procedure
- final acceptance date and reviewer

## Explicit non-goals

The release candidate does not introduce new communication modes, conversation memory or personalization. Any new scope discovered during testing is triaged separately unless it blocks safety, privacy, comprehension or task completion.
