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
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor and create a private `resumes` storage bucket.
4. Set `VITE_GEMINI_API_KEY` only when a Gemini-backed analysis is required. Otherwise the app reports its deterministic requirement match rather than inventing AI output.
5. Run the app:
   `npm run dev`

Without Supabase configuration, the frontend uses browser-local records created during that session. This is useful for development only; configure Supabase for shared, authenticated persistence.
