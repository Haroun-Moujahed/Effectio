# Effectio

Calendar-based daily todos with cloud sync. Click a day to manage its list; each calendar cell shows a progress ring for that day's completed tasks.

## Features

- Month calendar with per-day progress rings
- Add, edit, complete, and delete tasks for any date
- Light / dark theme
- **Sign up / sign in** with Supabase (email, password, confirm password)
- **Keep me signed in** option on sign in
- Tasks are private per account (Row Level Security) — one user’s calendar never shows in another’s
- Local per-account cache for fast loads

## Tech stack

- React 19 + TypeScript + Vite
- Supabase (Auth + Postgres)
- Deployed on Vercel

## Local development

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (see walkthrough below), then:

```bash
npm run dev
```

Without Supabase env vars, the app still runs using browser `localStorage` only.

## Supabase setup (one-time)

1. Open [supabase.com](https://supabase.com) → your project (or create one).
2. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
4. (Optional) **Authentication → Providers → Email**: keep Email enabled. For a personal app you can disable “Confirm email” under **Authentication → Sign In / Providers** if you want instant signup without an inbox check.
5. Put the same two values in `.env.local` for local work.

## Deploy on Vercel

1. Push this repo to GitHub (already done if you are reading this there).
2. Open [vercel.com](https://vercel.com) → **Add New… → Project** → import this repository.
3. Framework preset should detect **Vite**. Confirm:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   (same values as in `.env.local`)
5. Deploy. You will get a URL like `https://effectio.vercel.app`.
6. In Supabase → **Authentication → URL Configuration**:
   - **Site URL:** your Vercel URL
   - **Redirect URLs:** add `https://your-app.vercel.app/**` (and `http://localhost:5173/**` for local dev)

After deploy, open the link, create an account, and your tasks will sync everywhere you sign in.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start the Vite dev server |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run oxlint                |

## License

Private portfolio project.
