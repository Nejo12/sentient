# Store privacy declaration inputs

This document is an engineering inventory, not the final legal declaration. The App Store Connect and Google Play answers must be checked against the production build, backend configuration and every enabled third-party SDK immediately before submission.

## Data flows to verify

| Area | Potential data | Purpose | Linked to account | Shared with processor | User control |
|---|---|---|---|---|---|
| Authentication | Email address, account identifier | Sign-in and account management | Yes | Supabase | Sign out and delete account |
| Message analysis | Message text and optional context | Generate interpretation and reply guidance | Potentially during request processing | Supabase Edge Functions and AI provider | User deliberately submits text |
| Rewrite history | Saved reply, contact label, source app label, timestamp | History and cross-device sync | Yes when signed in | Supabase | Disable history and delete account |
| Subscription | Purchase and entitlement identifiers | Manage Pro access | Yes/pseudonymous | RevenueCat and store provider | Store subscription controls |
| Diagnostics | Sanitised operational metadata | Reliability and support | Depends on implementation | Confirm production diagnostics provider | Do not include message text |

## Required verification

- Confirm no message body, rough draft, generated reply or contact name is written to application logs, crash reports or analytics.
- Confirm the AI provider's retention and training settings for the production API account.
- Confirm Supabase row-level security isolates every user's rewrites and settings.
- Confirm account deletion removes authentication data and persisted rewrites.
- Confirm local rewrites are removed after successful migration or explicit deletion.
- Confirm RevenueCat identifiers and purchase events are declared accurately.
- Confirm whether source-app labels and contact labels are optional and how they are stored.
- Confirm transport encryption for every external request.

## Apple App Privacy

Likely categories requiring review include:

- Contact Info: email address
- User Content: messages and generated content
- Identifiers: user ID and purchase identifiers
- Purchases: subscription history
- Diagnostics: only when a production diagnostics provider is enabled

For each category, determine whether the data is collected, linked to the user, used for tracking and retained. Do not mark data as uncollected merely because a processor receives it on Sentient's behalf.

## Google Play Data safety

Declare collection, sharing, purpose, processing characteristics, encryption in transit and deletion controls for all production SDKs and backend processors. The Android `SYSTEM_ALERT_WINDOW` capability must be explained as an optional communication shortcut and requested only in context. Verify that the Play Console permission declaration matches the actual bubble feature and store listing.

## Submission owner sign-off

- [ ] Production SDK inventory reviewed
- [ ] Backend logs reviewed
- [ ] AI-provider data controls reviewed
- [ ] App privacy answers completed
- [ ] Google Data safety answers completed
- [ ] Privacy policy matches both declarations
- [ ] In-app account deletion tested
