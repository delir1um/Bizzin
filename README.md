# Bizzin — Replit Dev Guide

This project is built (and primarily run) **inside Replit**. These notes are tuned for the Replit Agent + Shell workflow, not for external contributors.

## Stack (quick)
- **Frontend**: Vite + React + TypeScript + Tailwind
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Worker**: Cloudflare Worker (optional edge/webhooks)
- **Templates**: Handlebars for emails
- **Tooling**: PNPM, ESLint/Prettier, Vitest, GitHub mirror optional

---

## First-time setup in Replit

1. **Packages**
   - Replit → Shell:
     ```bash
     corepack enable
     pnpm install
     ```

2. **Environment variables (Replit Secrets)**
   - In Replit → **Secrets** (the 🔒 icon), add:
     - `VITE_SUPABASE_URL` (public)
     - `VITE_SUPABASE_ANON_KEY` (public)
     - `SUPABASE_SERVICE_ROLE` (**server/worker only; never exposed to client**)
     - `DATABASE_URL` (for migration script if you want `pnpm db:migrate`)
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (if emails are used)
   - Tip: create a local `.env.local` only if you're running outside Replit. Inside Replit, prefer Secrets.

3. **Run the dev server**
   ```bash
   pnpm dev
   ```
   - If you have a `.replit` file (included in this pack), Replit’s “Run” button will do the same.

---

## Database & migrations (Supabase)

- Keep all SQL in `database/migrations/` and run them from Replit:
  ```bash
  pnpm db:migrate
  ```
  This uses `scripts/run-sql.js` and `DATABASE_URL` (a Postgres connection string to your Supabase DB).

- **Row Level Security (RLS)**
  - `database/policies/00_enable_rls.sql` enables RLS for core tables.
  - Add table-specific policies in more files under `database/policies/` (e.g. `20_profiles.sql`, `30_tenants.sql`, etc.).
  - Commit policies and migrations so Replit Agent can extend them consistently.

---

## Replit Agent tips

- The Agent reads your repo context. Keeping this README accurate **improves Agent suggestions**.
- When you ask the Agent to create a new table, prompt it to:
  1) write a new timestamped SQL file in `database/migrations/`,
  2) write/extend RLS in `database/policies/`,
  3) run `pnpm db:migrate` in Shell.

- When you ask it to add an API route, also ask it to add **Zod validation** and update **shared types** so the client enjoys type-safe responses.

---

## Email (optional now)
- Put templates under `server/emails/` using Handlebars partials.
- Use a provider with good deliverability. Configure SPF/DKIM/DMARC **on your domain** (outside Replit).

---

## Cloudflare Worker (optional)
- Document purpose in `cloudflare-worker/README.md` (proxy/webhooks/scheduled jobs).
- Bind secrets via Wrangler (`wrangler secret put`) — do **not** commit secrets.

---

## Scripts

Add these to your `package.json` if they aren’t already:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "db:migrate": "node scripts/run-sql.js database/migrations",
    "db:reset": "node scripts/reset-db.js"
  }
}
```

---

## Workflow in Replit (recommended)

1. Create/modify a feature.
2. If DB changes are needed: add a migration SQL, add/update RLS policies.
3. Run `pnpm db:migrate`.
4. Run `pnpm typecheck && pnpm lint`.
5. `pnpm dev` and test the UI.
6. Commit to GitHub mirror if you want offsite backup/CI.

---

## Notes
- Keep `SUPABASE_SERVICE_ROLE` out of any browser-accessible code. Only server/worker should touch it.
- If you don’t use GitHub CI, delete `.github/workflows/*` to keep things lean.
- This README is intentionally focused on **how you build inside Replit**, not how strangers clone the repo.
