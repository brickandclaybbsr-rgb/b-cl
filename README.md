# 🍕 B&C Ops — Brick & Clay Operations Platform

A mobile-first **Progressive Web App** that replaces Brick & Clay's paper SOPs
with a clean digital system: opening/closing checklists, daily sales, stock,
vendor orders, an owner dashboard, and an automated **end-of-day WhatsApp report**.

Built with **Next.js 14 (App Router) · Supabase · Tailwind · Vercel**.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, Server Actions) |
| Database / Auth | Supabase (Postgres + RLS) |
| Styling | Tailwind CSS (warm "wood-fire" theme) |
| Charts | Recharts |
| PWA | `@ducanh2912/next-pwa` |
| WhatsApp | Meta Cloud API |
| Hosting | Vercel (+ Cron) |

---

## ⚠️ Windows note (this folder)

The project path contains a space and `&` (`Brick & Clay Operations`), which
breaks `npm run <script>` on Windows (cmd treats `&` as a separator). **Run the
binaries directly instead:**

```bash
node ./node_modules/next/dist/bin/next dev      # instead of: npm run dev
node ./node_modules/next/dist/bin/next build    # instead of: npm run build
node ./node_modules/typescript/bin/tsc --noEmit # typecheck
```

On any other machine (or after renaming the folder to e.g. `bnc-ops`), the
normal `npm run dev` / `npm run build` work fine.

---

## 1 · Install

```bash
npm install
cp .env.example .env.local   # then fill in the values (see §3)
```

## 2 · Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in order:
   - `supabase/schema.sql` — tables, RLS policies, triggers
   - `supabase/seed.sql` — stock items + default checklists
3. Create the **owner** account:
   - **Authentication → Users → Add user** (email + password, "Auto Confirm").
   - The `on_auth_user_created` trigger makes a `profiles` row automatically.
   - Promote them in **SQL Editor**:
     ```sql
     update public.profiles set role = 'owner' where email = 'owner@brickandclay.in';
     ```
4. Add staff the same way, or from **Settings → Staff** once signed in
   (requires the service-role key — see below).

## 3 · Environment variables

Copy `.env.example` → `.env.local` and fill:

| Var | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (⚠️ server-only, never expose) |
| `WHATSAPP_ACCESS_TOKEN` | Meta → WhatsApp → API setup |
| `WHATSAPP_PHONE_NUMBER_ID` | same |
| `OWNER_WHATSAPP_NUMBER` | owner's number, country code, no `+` (e.g. `9198…`) |
| `WHATSAPP_TEMPLATE_NAME` | optional — approved template for out-of-window sends |
| `NEXT_PUBLIC_APP_URL` | `https://ops.brickandclay.in` |
| `CRON_SECRET` | random string: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |

The app **runs without WhatsApp configured** — reports are simply disabled
until the keys are present.

## 4 · Run locally

```bash
node ./node_modules/next/dist/bin/next dev
# open http://localhost:3000
```

Visit `/setup` for an in-app checklist of these steps.

---

## Roles & routes

**Staff** (bottom nav): `/dashboard` · `/checklist/opening` · `/checklist/closing`
· `/sales` · `/stock` · `/vendors`

**Owner** (sidebar): `/owner` · `/reports` · `/stock` · `/vendors` · `/settings`

Route protection is enforced in `middleware.ts` **and** re-checked in each page
via `requireProfile()` / `requireOwner()`. Row Level Security is the final
backstop: staff can only read/write their own submissions; owners see all.

---

## EOD WhatsApp report

- **Automatic:** Vercel Cron hits `GET /api/send-eod-report` daily at
  **17:30 UTC = 23:00 IST** (`vercel.json`). Vercel attaches
  `Authorization: Bearer $CRON_SECRET` automatically.
- **Manual:** the **Send EOD report** button on the owner dashboard and in
  **Settings → WhatsApp** POSTs to the same route (owner session auth).
- Recipient = **Settings → WhatsApp** number, falling back to
  `OWNER_WHATSAPP_NUMBER`. Every send is logged to `eod_reports`
  (visible under **Reports**).

> Plain-text WhatsApp messages only deliver inside the 24-hour customer-service
> window. For reliable scheduled delivery, create an approved **utility
> template** with one body parameter and set `WHATSAPP_TEMPLATE_NAME`.

---

## 5 · Deploy to Vercel

1. Push this folder to a Git repo and **Import** it in Vercel.
2. Add every variable from `.env.local` in **Project → Settings → Environment
   Variables** (Production).
3. Add the domain `ops.brickandclay.in` (**Settings → Domains**) and the CNAME
   it shows you at your DNS provider.
4. Deploy. The cron in `vercel.json` registers automatically.
5. On Android Chrome, open the site → **⋮ → Add to Home screen** to install the PWA.

---

## Project structure

```
app/
  (auth)/login/        Sign-in (email + password)
  (app)/               Authenticated shell (staff bottom-nav / owner sidebar)
    dashboard/         Staff home
    checklist/         Opening & closing (shared actions)
    sales/  stock/  vendors/
    owner/  reports/  settings/
  api/send-eod-report/ Cron + manual report trigger
  setup/               First-run guide
components/  ui/ · layout/ · checklists/ · settings/ · charts/
lib/
  supabase/            client · server · admin · middleware · env
  data/                per-domain read queries
  auth.ts · date.ts (IST) · whatsapp.ts · eod-report.ts · petpooja.ts
supabase/  schema.sql · seed.sql
scripts/   generate-icons.mjs   (regenerate PWA icons)
```

---

## Notes

- All money is `numeric(10,2)`; all business dates are **IST** (`Asia/Kolkata`)
  via `lib/date.ts`, so reports roll over correctly regardless of server TZ.
- PWA icons in `public/icons/` are generated placeholders — replace with branded
  art (re-run `node scripts/generate-icons.mjs` or drop in your own PNGs).
- **Petpooja** POS import is stubbed in `lib/petpooja.ts` for Phase 2.

_Built for Brick & Clay, Bhubaneswar · SS Brick & Clay (Pvt.) Ltd_
