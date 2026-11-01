# SETUP — things only YOU can do (the agent cannot)

Do these once. Total: about 45 minutes.

## A. Put the kit into your repo

```bash
cd /path/to/your-app
# adjust 'kit' to wherever you unzipped it
cp kit/AGENTS.md .
cp -r kit/docs kit/supabase .
mkdir -p src/lib src/db
cp kit/src/lib/* src/lib/
cp kit/src/db/schema.ts src/db/

# unit-test runner (Expo's own preset; our pure-logic tests need nothing else)
npx expo install jest-expo jest @types/jest
```

Add to `package.json`:

```json
"scripts": { "test": "jest" },
"jest": { "preset": "jest-expo" }
```

Check it works, then commit:

```bash
npm test          # expect: 4 test files, 74 tests passing
npx tsc --noEmit  # expect: no errors
git add -A && git commit -m "chore: add agent rules, specs and tested core logic"
```

If `npm test` fails only because of the Jest setup (not because of a failing test), paste the error into opencode as milestone M0 below — don't hand-fix endlessly.

## B. Supabase project

1. Create a project at supabase.com. **Region: Mumbai (ap-south-1)** — lowest latency for Indian students. Save the database password.
2. **SQL Editor → New query →** paste all of `supabase/schema.sql` → **Run**. If it reports an error, paste the error to Claude/opencode; do not skip it. (The file passed a Postgres syntax check, but it has not been run against a live database.)
3. **Authentication → Providers:**
   - **Email:** enabled. Open **Email Templates → Magic Link** and make the body contain `{{ .Token }}` (the 6-digit code), e.g. `Your code: {{ .Token }}`.
   - **Google:** create an OAuth client in Google Cloud Console (type: *Web application*). Authorised redirect URI = `https://<your-project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into Supabase.
4. **Authentication → URL Configuration → Redirect URLs:** add your app's deep link (`<your-app-scheme>://**`) and the Expo Go dev URL that the app prints during sign-in (looks like `exp://192.168.x.x:8081/--/auth/callback`).
5. **Project Settings → API:** copy *Project URL* and *anon public key* into `.env` in the repo root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   Make sure `.env` is in `.gitignore`. **Never** put the `service_role` key in `.env` or in the app.
6. **Email sending limit:** Supabase's built-in email sender allows only a handful of emails per hour — fine for testing, **not for real users**. Before launch, set up custom SMTP (Resend, Brevo, etc.) under *Authentication → SMTP Settings*.
7. Free Supabase projects pause after about a week of inactivity. Fine while building; use a paid plan for production.

## C. Timetable scan function (needed from milestone M12)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set VISION_API_URL="<OpenAI-compatible chat completions URL>" \
                         VISION_API_KEY="<key>" \
                         VISION_MODEL="<a vision-capable model name>"
npx supabase functions deploy scan-timetable
```

The model must accept **images** (check your provider's docs — a text-only model will fail). The function is provider-neutral: any OpenAI-compatible endpoint that takes `image_url` content works.

## D. Prove the data is private (5 minutes, do it once)

Create two test accounts. Add a subject on account A. Sign in as B and confirm you see **nothing** of A's data. If you do, RLS is misconfigured — stop and fix before anything else.

## E. Before Play Store

See `docs/PRODUCT_SPEC.md` §12 (account deletion, privacy policy, Data safety form, reviewer test account).
