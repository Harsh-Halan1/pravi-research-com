# Database security rollout

## Intended boundary

- `pravi` contains application tables and enums. Keep it out of Supabase Data API exposed schemas unless a separately reviewed API is introduced.
- `postgres` remains the owner/migration role. Do not use it as the deployed app runtime role.
- `pravi_app` is a non-owner, `NOBYPASSRLS`, application login role. Migration 005 creates it without login; a password is provisioned separately.
- Clerk `auth()` is the source of identity. Every protected Prisma query runs inside `withUserDbContext`, which sets `app.clerk_user_id` transaction-locally. The SQL policies derive the active profile and department assignments from that server-supplied identity.
- Department membership and role-scoped writes are checked in both application code and RLS. History tables grant the app role select/insert only.

RLS is not effective while Prisma connects as `postgres`: Supabase's `postgres` role has `BYPASSRLS`. The policies become effective only after the app uses `pravi_app`, which neither owns the tables nor bypasses RLS. PostgreSQL also documents that superusers and `BYPASSRLS` roles skip row policies. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

## Rollout

1. Confirm `.env.local` points to the intended development project and take a recoverable backup/snapshot.
2. Apply migration 005 with the existing privileged `DIRECT_URL`: `npm run db:migrate`. Do not change the runtime URL before the role and policies exist. The migration only creates `pravi_app` with safe defaults (`NOLOGIN`, `NOBYPASSRLS`) and checks any pre-existing role; it deliberately does not run `ALTER ROLE`, which Supabase's migration role may not be allowed to do.
3. Provision a strong password for the existing `pravi_app` role in a secure database credential flow. Do not put it in source, README, terminal output, or chat.
4. Set local `DATABASE_URL` to Supavisor's shared transaction-pooler connection using the `pravi_app.<project-ref>` username. Keep `DIRECT_URL` restricted to migrations/administrative scripts. Supabase documents the custom-role username format for the shared pooler. [Supabase connection strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
5. Run `npm run db:inspect-security`. Expected: runtime role `pravi_app`, `bypassRls: false`, 15 app tables under `pravi`, and all 15 show `rlsEnabled: true` and `rlsForced: true`.
6. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npx prisma validate`, and verify the application using synthetic accounts in at least two departments. Confirm a user cannot read or mutate another department's asset; verify allowed reads/writes still succeed.
7. In Vercel, use the restricted role only for runtime `DATABASE_URL`. Keep the privileged migration connection in a protected migration environment, not ordinary app runtime settings.

Prisma interactive transactions are intentionally short because `set_config(..., true)` lasts only until the current transaction ends; this avoids request identity leaking between pooled connections. Do not run network calls or long tasks inside `withUserDbContext` callbacks. [Prisma transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)

## Current status and limits

The project owner reports that migration 005 applied successfully, and the supplied database inspection confirms all 15 application tables have RLS enabled and forced. The inspected app connection is still `postgres` with `BYPASSRLS`, so policies are not currently being enforced for app requests. The app code wraps protected database access in transaction-scoped Clerk identity context. Unit tests verify identity is set before the query and static tests verify all Prisma models receive forced RLS and explicit policies. These checks do not prove PostgreSQL policy behavior. Do not claim end-to-end row isolation until `DATABASE_URL` uses `pravi_app` and allow/deny tests pass through that connection.

The policies enforce department scope and broad role categories. Server-side authorization remains necessary for workflow-specific decisions, separation of duties, field-level restrictions, and evidence classification. A database credential holder can set custom PostgreSQL configuration values; this RLS design guards against app query omissions and cross-department mistakes, not compromise of the server secret itself.
