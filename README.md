# Stake Music Library

A web app for browsing, checking out, and managing choral music across a stake.

---

## Tech Stack
- **React + Vite** — frontend
- **Supabase** — database (free tier, PostgreSQL)
- **Vercel** — hosting (free tier)

---

## Setup (one-time, ~20 minutes)

### 1. Create a Supabase project
1. Go to https://supabase.com and sign up (free)
2. Click **New project**, give it a name like "stake-music-library"
3. Wait for it to provision (~1 minute)
4. Go to **SQL Editor → New query**
5. Paste the entire SQL block from `src/lib/supabase.js` (between the ═══ lines)
6. Click **Run**

### 2. Get your Supabase credentials
1. In Supabase, go to **Project Settings → API**
2. Copy **Project URL** and **anon/public key**

### 3. Configure environment variables
```
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-chosen-password
```

### 4. Run locally (optional — to test before deploying)
```
npm install
npm run dev
```
Open http://localhost:5173

### 5. Deploy to Vercel
1. Push this folder to a GitHub repository
2. Go to https://vercel.com, sign up with GitHub
3. Click **Add New Project**, import your repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
5. Click **Deploy**

Your app will be live at `your-project.vercel.app` in about 1 minute.

---

## Importing your existing music

1. Export your Google Drive spreadsheet as CSV (File → Download → CSV)
2. Log into the app as admin
3. Go to **Admin → Import CSV**
4. Upload the file — the importer recognises these column names:
   - `title` (required)
   - `composer`, `arranger`
   - `voicing` (e.g. SATB, SSA, TTBB)
   - `accompaniment` (e.g. Piano, Organ)
   - `category`
   - `publisher`
   - `publication_year` or `year`
   - `total_copies` or `copies`
   - `notes`

Column names are case-insensitive and spaces are ignored.

---

## Three user experiences

| Experience | URL | Access |
|---|---|---|
| Public browse | `/` | No login needed |
| On-site checkout | `/checkout` | No login needed |
| Admin | `/admin` | Password from .env.local |

---

## Kiosk setup (Chromebook)
1. Open Chrome and navigate to your Vercel URL + `/checkout`
2. In Chrome, go to menu → **More tools → Create shortcut** → check "Open as window"
3. This creates a fullscreen kiosk-style shortcut on the desktop

---

## Changing the admin password
Update `VITE_ADMIN_PASSWORD` in your Vercel project settings (Settings → Environment Variables), then redeploy.
