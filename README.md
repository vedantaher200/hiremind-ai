<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e00ff159-b3fa-4416-a742-6fb2af5bf8e2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and configure your Supabase URL and anon key.
3. Run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/migrations/002_application_persistence.sql`](supabase/migrations/002_application_persistence.sql), [`supabase/migrations/003_interviews_storage_and_rls.sql`](supabase/migrations/003_interviews_storage_and_rls.sql), and [`supabase/migrations/004_profile_avatar_storage.sql`](supabase/migrations/004_profile_avatar_storage.sql) in the Supabase SQL editor. These create persistent profiles, jobs, applications, assessments, resume analyses, interviews, private resume storage, the public `profile-avatars` bucket, avatar policies, and RLS rules.
4. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `VITE_APP_URL`. The VITE values are browser-safe; the non-VITE values are used only by the API to validate the caller. `VITE_APP_URL` must be the exact public app origin used by confirmation links.
5. Set `GEMINI_API_KEY` on the server for Gemini analysis. It is sent only to `/api/ai`, never bundled into the browser. Without it, resume analysis falls back to a clearly labeled rule-based result.
6. Run the app:
   `npm run dev`

Without Supabase configuration, the frontend uses browser-local records for development only. Configure Supabase before testing multi-user workflows, logout/login persistence, recruiter visibility, uploads, or deployment.

## Architecture and Vercel

The React app uses Supabase Auth and row-level protected tables for user data. `api/ai.ts` is an Express serverless handler for Vercel; it authenticates the Supabase bearer token before calling Gemini. On Vercel set all five variables above, build with `npm run build`, and deploy normally. Do not set `VITE_GEMINI_API_KEY`.

### Supabase email confirmation

In Supabase Dashboard → Authentication → URL Configuration, set **Site URL** to the deployed `VITE_APP_URL`, and add both `http://localhost:3000/?confirmed=1` and `https://your-app.vercel.app/?confirmed=1` to **Redirect URLs**. Enable Confirm email under Authentication → Providers → Email and configure SMTP if confirmation mail must reach real users. HireMind sends this redirect in both signup and resend requests; the user returns to the app with their verified session.
