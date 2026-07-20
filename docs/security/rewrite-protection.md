# Rewrite endpoint protection

The `rewrite` Edge Function calls a paid model and must not be exposed through the public Supabase anonymous key alone.

## Protection model

1. The app obtains a Supabase user session.
   - Existing email users keep their current session.
   - Users who have not created an account receive an anonymous Supabase session.
2. The app sends the user's access token to the Edge Function.
3. Supabase verifies the JWT before invoking the function.
4. The function resolves the authenticated user and atomically consumes a server-side safety quota.
5. Only then does it call moderation and the rewrite model.

The product-level free limit remains in the client for now. The backend limit is a deliberately generous hard safety cap that prevents modified clients from creating unbounded OpenAI costs. Subscription-aware server quotas should replace this interim split once RevenueCat identities are linked to Supabase user IDs.

## Required deployment steps

### 1. Enable anonymous users

In Supabase Dashboard:

`Authentication -> Providers -> Anonymous Sign-Ins -> Enable`

This preserves the current try-before-account experience while ensuring every model request has a verifiable user identity.

### 2. Apply database migrations

```bash
supabase db push --project-ref YOUR_PROJECT_REF
```

Or run `supabase/migrations/002_rewrite_usage_limits.sql` in the SQL editor.

### 3. Confirm function secrets

The hosted Supabase runtime normally provides these automatically:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The application-specific secret must also exist:

```bash
supabase secrets set OPENAI_API_KEY=... --project-ref YOUR_PROJECT_REF
```

### 4. Deploy the function

```bash
supabase functions deploy rewrite --project-ref YOUR_PROJECT_REF
```

Do not deploy the JWT-protected function before anonymous sign-ins and the usage migration are ready, otherwise signed-out users will receive secure-session or usage-verification errors.

## Verification

Test all of the following on a development build and a physical iPhone:

1. A signed-out first-time user can submit a rewrite.
2. An anonymous user persists across app restarts.
3. A signed-in user can submit a rewrite.
4. A request with only the public anon key and no user JWT returns `401`.
5. A forged or expired user JWT returns `401`.
6. The usage row increments in `rewrite_daily_usage`.
7. Requests beyond the hard daily limit return `429` without calling OpenAI.
8. A missing migration or service-role configuration fails closed with `503`.
