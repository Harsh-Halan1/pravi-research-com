# Pravi Infrastructure Asset Management

A prototype for government teams to register and manage fixed physical infrastructure assets. The product direction supports multiple asset categories with workflows suited to each asset’s real lifecycle. The first feature deliverable is a road-segment workflow; later asset types follow sequentially.

Government-specific roles, approval rules, evidence requirements, and lifecycle details in the prototype are assumptions unless explicitly confirmed. See [Decision.md](Decision.md) and [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md).

## Stack

- Next.js, intended for deployment on Vercel
- Prisma ORM with PostgreSQL hosted by Supabase
- Clerk authentication
- Biome for formatting and lint checks

Redis/Upstash is deferred. No TanStack package has been selected yet. See [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries and [Decision.md](Decision.md) for decision status.

## Local setup

1. Install Node.js 20.9 or newer and install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and enter local values. Prisma CLI loads `.env.local` first when present, then `.env`; Next.js also loads its standard local environment files.
3. Create a Supabase PostgreSQL project and set `DIRECT_URL` to the privileged migration/admin connection. `DATABASE_URL` is the restricted `pravi_app` runtime connection, configured after migration 005.
4. Create a Clerk application and set its publishable and secret keys locally.
5. Generate the Prisma client with `npm run db:generate` and apply migrations with `npm run db:migrate` using `DIRECT_URL`.
6. Follow [SECURITY.md](SECURITY.md) to provision a password for `pravi_app` and set `DATABASE_URL` to its pooled runtime connection. Run `npm run db:inspect-security` and confirm RLS is forced before testing protected pages.
7. To provision demo roles, create synthetic test users in Clerk, put each test user's Clerk ID in the matching `DEMO_*_CLERK_USER_ID` variable, and run `npm run db:seed` (uses `DIRECT_URL`).
8. Start the Next.js development server with `npm run dev`.

The project is under active prototype development. Use synthetic demo accounts and data only.

## Environment variables

Set values in your local `.env` file and in the Vercel project’s environment settings. The names below are placeholders only:

```dotenv
DATABASE_URL="postgresql://pravi_app.<PROJECT_REF>:<RUNTIME_PASSWORD>@<POOLER_HOST>:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<ADMIN_PASSWORD>@<DB_HOST>:5432/postgres"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<CLERK_PUBLISHABLE_KEY>"
CLERK_SECRET_KEY="<CLERK_SECRET_KEY>"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
DEMO_SUBMITTER_CLERK_USER_ID=""
DEMO_VERIFIER_CLERK_USER_ID=""
DEMO_INSPECTOR_CLERK_USER_ID=""
DEMO_MAINTENANCE_CLERK_USER_ID=""
DEMO_PLANNER_CLERK_USER_ID=""
```

Never put real credentials, tokens, or private keys in this README, source code, screenshots, or a submitted ZIP. Do not commit local `.env` or `.env.local` files. Provide reviewers with a safe demo access flow using synthetic data rather than publishing account secrets.

## Product scope

The platform is for fixed government infrastructure such as roads, bridges, public buildings, and water infrastructure. Different asset types can have distinct workflows. The initial road-segment slice is intended to cover submission, verification, inspection, maintenance work, completion evidence, and lifecycle history using prototype roles and simplified assumed rules.

## Project documents

- [Decision log](Decision.md)
- [Product brief](PRODUCT_BRIEF.md)
- [Architecture](ARCHITECTURE.md)
- [Database security rollout](SECURITY.md)
- [Working guidance](AGENTS.md)
- [Coding assistant skills](skills/)
- [Database schema review](DATABASE_SCHEMA_REVIEW.md)

## Current implementation status

- App shell, Clerk sign-in, server-side role-profile checks, Prisma schema, and a database-backed department-scoped dashboard are in place. Dashboard records may still be synthetic demo data.
- The Prisma schema currently covers one asset category (road segment), shared asset coordinates/lifecycle stage, road-specific status history, departments and role assignments, inspections/findings, work orders, evidence metadata, and audit events. Migrations 001–005 have been applied according to the project owner; the latest inspection confirms forced RLS on all 15 application tables. The local app still connects as `postgres`, however, so runtime RLS enforcement has not yet been verified. Follow [SECURITY.md](SECURITY.md) to switch to and test the restricted `pravi_app` role.
- Supabase credentials and Clerk keys must be configured locally before protected data pages can run.
- The first online road flow now has a department-scoped register, independent verification/return, correction/resubmission, inspection findings and review/correction, work-order assignment/status review, and attributed status history. Work-order completion requires notes, and the asset leaves the maintenance stage after its last open order is resolved.
- File upload and evidence storage, transfer/decommission handling, deployment, and runtime-role/RLS verification are still pending. See `SECURITY.md` before switching the runtime connection.
- The dashboard reads counts, verification queue items, recent inspections/work orders, condition totals, and recent road assets from the database for the signed-in user's assigned departments. It is labeled as prototype data.

The schema is a road-first prototype foundation, not the complete multi-category product model. See `DATABASE_SCHEMA_REVIEW.md` for the remaining gaps and environment-specific migration status.

Run `npm run db:inspect-security` to print safe metadata about the connected database role, schema placement, and migration ledger. The command does not print connection values.

## Checks

Run `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npx prisma validate` before submitting code changes. Tests cover authorization/lifecycle rules, transaction identity ordering, and static RLS migration coverage. They do not replace database-backed RLS allow/deny tests.

