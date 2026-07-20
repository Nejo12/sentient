# Developer diagnostics

The diagnostics screen is an internal operations tool. It displays configuration and service health without exposing secret values.

## Open the screen

In a development build, open the route directly:

```bash
npx uri-scheme open sentient://diagnostics --ios
```

For Android:

```bash
npx uri-scheme open sentient://diagnostics --android
```

The route can also be opened from Expo Router with `router.push('/diagnostics')` while developing.

## Checks

- app version, build and platform
- Supabase configuration
- authenticated or anonymous Supabase session
- rewrite Edge Function reachability and latency
- Edge Function version and active model
- OpenAI key/connectivity status
- RevenueCat configuration and entitlement
- local free rewrite usage

`Copy report` creates a sanitised text report suitable for sharing during debugging.

## Backend deployment

The diagnostics health request is handled by the existing authenticated `rewrite` function using:

```json
{ "mode": "diagnostics" }
```

It does not consume Sentient's rewrite quota and does not generate a completion. It verifies the configured model through OpenAI's model endpoint.

After merging backend changes, deploy:

```bash
supabase functions deploy rewrite
```

## Security

- The diagnostics endpoint requires a valid Supabase session.
- No API keys, JWTs or secret values are returned.
- OpenAI errors are normalised into categories.
- The screen should remain internal and must not be promoted as a public user feature.
