# DASTARA

**Made by hand. Chosen with care.**

A production-quality e-commerce storefront + admin for a premium handmade-products brand in Pakistan. The storefront is **guest-only** (no customer accounts, no cart): customers browse products and place orders through **WhatsApp inquiries**. Staff manage everything from a secure, role-based admin panel.

Built with **Next.js (App Router) · TypeScript · Tailwind · shadcn-style UI · Supabase (Postgres, Auth, Storage, RLS)**. No separate Express/Python backend — all server logic runs in Next.js Server Actions and Route Handlers.

---

## Table of contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Local setup](#local-setup)
4. [Supabase setup](#supabase-setup)
5. [Creating the first Super Admin](#creating-the-first-super-admin)
6. [Environment variables](#environment-variables)
7. [Project structure](#project-structure)
8. [Security model](#security-model)
9. [Ordering & payment workflow](#ordering--payment-workflow)
10. [Testing](#testing)
11. [Deployment (Vercel)](#deployment-vercel)
12. [Backup & recovery](#backup--recovery)

---

## Architecture

- **Storefront** (`/`) — public, no authentication, no cart. Browsing + WhatsApp ordering.
- **Admin** (`/admin`) — email/password auth, role-based access (Super Admin, Admin, Editor).
- **Database** — Supabase Postgres with Row Level Security on every table.
- **Trust model** — customers never authenticate, so the Postgres `anon` role = *public visitor* and the `authenticated` role = *admin staff only*. Private data (supplier costs, payment account details, customer addresses) is never readable by `anon`.
- **Money** — stored as integer **paisa** (`*_paisa bigint`), never floats. Formatted for display with `formatPKR`.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom DASTARA design tokens |
| UI | shadcn-style primitives + Lucide icons |
| Forms | React Hook Form + Zod validation (server + client) |
| Backend | Next.js Server Actions & Route Handlers |
| Data / Auth / Storage | Supabase (Postgres, Auth, Storage) |
| Hosting | Vercel + GitHub |

---

## Local setup

**Prerequisites:** Node.js 18.18+ (20 LTS recommended) and a Supabase project.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    then fill in the Supabase values (see "Environment variables")

# 3. Apply the database schema (see "Supabase setup")

# 4. Create your first Super Admin (see below)
npm run create-admin -- --email you@dastara.pk --password 'StrongPass123!' --name "You" --role super_admin

# 5. Run the dev server
npm run dev
# Storefront:  http://localhost:3000
# Admin login: http://localhost:3000/admin/login
```

Useful scripts:

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # run the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run create-admin # provision an admin user (service-role, local/trusted only)
```

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL, the `anon` key, and the `service_role` key.
3. Apply the SQL in order. Open **SQL Editor** in the dashboard and run each file's contents:

   | Order | File | Purpose |
   | --- | --- | --- |
   | 1 | `supabase/migrations/0001_init.sql` | Tables, enums, sequences, indexes |
   | 2 | `supabase/migrations/0002_functions.sql` | Triggers, SKU/order-ref generators, `is_admin()` helpers |
   | 3 | `supabase/migrations/0003_rls.sql` | RLS enable + policies + least-privilege grants |
   | 4 | `supabase/migrations/0004_storage.sql` | Storage buckets + policies |
   | 5 | `supabase/seed/seed.sql` | Singleton settings/payment rows + starter categories |

   > If you use the Supabase CLI, you can instead run `supabase db push` with these files under `supabase/migrations`.

4. Confirm the three storage buckets exist: `product-images` (public), `category-images` (public), `payment-proofs` (**private**).

---

## Creating the first Super Admin

There is **no public sign-up**. Provision the first Super Admin with the included script, which uses the service-role key and so must only be run from a trusted machine:

```bash
npm run create-admin -- \
  --email you@dastara.pk \
  --password 'ChooseAStrongPassword' \
  --name "Your Name" \
  --role super_admin
```

The script creates (or reuses) the Supabase Auth user and inserts an active `admin_profiles` row with the chosen role. Then sign in at `/admin/login`. Additional admins/editors can be invited from within the admin panel by a Super Admin.

Roles: `super_admin`, `admin`, `editor`.

---

## Environment variables

See `.env.example` for the authoritative list. Summary:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key; safe in browser, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. Never expose, never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL (SEO, sitemap, OG) |
| `NEXT_PUBLIC_WHATSAPP_FALLBACK` | public | Bootstrap WhatsApp number before Settings are configured |

The WhatsApp number, payment details, delivery fees, hero/announcement copy, and policy pages are all managed from **Admin → Settings** (stored in the database), not in env vars.

---

## Project structure

```
app/
  (storefront)        # public pages: home, shop, product, collections, our story, contact, policies
  admin/
    login             # admin sign-in
    (panel)           # protected admin: dashboard, products, categories, merchandising,
                      #   orders, suppliers, customers, analytics, settings
  actions/            # server actions (order, auth, products, categories, orders, suppliers, settings)
  api/admin/orders/export  # CSV export route handler (authorized)
components/           # ui primitives + storefront + admin components
lib/                  # supabase clients, constants, validation (zod), pricing, whatsapp, phone, auth guards, audit, rate-limit
services/admin/       # read-side data services (stats, orders, analytics)
types/database.ts     # typed Supabase schema
supabase/migrations/  # SQL: schema, functions, RLS, storage
supabase/seed/        # seed data
scripts/create-admin.mjs
```

---

## Security model

Aligned to OWASP ASVS principles. Key controls:

- **Row Level Security on every table.** Grants are revoked from `anon`/`authenticated`, then re-granted least-privilege. `anon` can only read published products, images, categories, and public site settings, and insert order inquiries / newsletter sign-ups.
- **Server-side authorization only.** Every admin page uses `requireCapability(...)`; every mutating action uses `assertCapability(...)`. The client-provided role is never trusted. `is_admin()` / `is_super_admin()` SQL helpers (SECURITY DEFINER) back the RLS policies.
- **RBAC.** Capabilities are mapped per role in `ROLE_CAPABILITIES`.
- **Secrets.** Service-role key is server-only. Supplier costs live in `product_private`; payment account details live in `payment_config` — neither is readable by `anon`.
- **Input validation + sanitization.** All forms validated with Zod on the server; prices are always re-read from the database, never trusted from the browser.
- **Rate limiting + honeypot** on the public order-inquiry action.
- **Audit logging** of sensitive admin actions in `audit_logs`.
- **Secure file upload** to scoped buckets; payment proofs are private.
- **Safe errors** — internal errors are not leaked to clients.

## Ordering & payment workflow

1. Customer opens a product and submits the WhatsApp order form (name, WhatsApp phone, quantity, city, address required).
2. The server validates input, **re-checks availability**, **reads the price from the database**, generates a unique order reference, and **saves the inquiry + a line-item snapshot to the database before** building the WhatsApp link. If the DB write fails, no redirect happens.
3. The customer is handed a `https://wa.me/<number>?text=...` link and **must press Send themselves** — messages are never auto-sent.
4. Staff manage the inquiry through a controlled status workflow (validated transitions, with history).
5. **Payment is manual and advance-only.** After availability is confirmed, configured bank/Easypaisa/JazzCash details are shared. Payment status moves Not Requested → Awaiting Payment → Proof Received → **Verified** (explicit admin action) / Refunded. A screenshot is *never* treated as paid; revenue counts **verified payments only**.

## Testing

Before every deploy:

```bash
npm run typecheck   # no type errors
npm run lint        # no lint errors
npm run build       # production build succeeds
```

**RLS verification (do this with real sessions):**

- As an unauthenticated (`anon`) client, confirm you *can* read published products but *cannot* read `product_private`, `payment_config`, `suppliers`, `customers`, `audit_logs`, or unpublished products.
- As an `editor`, confirm you cannot access settings or verify payments.
- As an `admin`, confirm you can manage operations but not change settings.
- As a `super_admin`, confirm full access.
- Confirm the order-inquiry action writes to the DB before returning a WhatsApp link, and that submitting a tampered price still charges the DB price.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add all environment variables from `.env.example` in **Project Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL` to your production domain). Keep `SUPABASE_SERVICE_ROLE_KEY` as a non-public variable.
4. Ensure the Supabase migrations/seed have been applied to your production project.
5. Deploy. Vercel runs `npm run build` automatically.
6. After the first deploy, run `npm run create-admin` against the production Supabase project (locally, with production env values) to create the first Super Admin.

## Backup & recovery

- **Database:** Supabase provides automated daily backups (Pro plan) and Point-in-Time Recovery. For manual backups, use `pg_dump` via the connection string in **Project Settings → Database**, or the dashboard's backup tools. Keep the schema in version control (`supabase/migrations`) as the source of truth.
- **Storage:** product and category images live in Supabase Storage buckets; back these up periodically if they are not reproducible.
- **Restore:** re-create a Supabase project, re-apply `supabase/migrations/*` and `supabase/seed/seed.sql`, restore the latest `pg_dump`, re-upload storage objects, then re-run `create-admin` if needed.
- **Secrets:** rotate the service-role key immediately if it is ever exposed; update it in Vercel and any local `.env.local`.

---

© DASTARA. All product stories, materials, and origins shown in the catalog must be truthful — never fabricate artisan details.
