---
name: synthetic-test-data-seeding
description: Create, review, or improve safe synthetic seed data for the Pravi infrastructure inventory. Use whenever asked for Prisma seeding, demo records, fixtures, sample accounts, local development data, or realistic lifecycle scenarios. Match the existing schema and never introduce real personal or sensitive government data.
---

# Synthetic Test Data and Seeding

## Inspect before changing

1. Read `prisma/schema.prisma`, the current seed script, relevant migrations, `Decision.md`, and the lifecycle/audit implementation.
2. Reuse the existing model and event vocabulary. Do not create or redesign asset categories; use `asset-category-scaffold` for category model work. Do not redesign history or lifecycle rules; use `lifecycle-audit-trail` for that work.
3. Check whether the current seed is safe to run repeatedly. Prefer stable identifiers and upserts or explicit cleanup limited to synthetic records. Never delete or reset production data.

## Data requirements

- Use clearly fictional departments, names, asset labels, and plausible but synthetic locations. Do not use real staff identities, personal information, or sensitive infrastructure details.
- Keep asset category attributes consistent with the Prisma schema. For road segments, use valid coordinates, positive lengths, and plausible condition/status values.
- Respect department scope and role assignment rules. Seed role assignments in the database only; never model browser-provided roles as authorization.
- If lifecycle or status events are seeded, include the correct actor reference, server-generated timestamp, and reason required by the schema and transition rules. Keep history append-only; do not update/delete historical events to make a scenario look tidy.
- Use placeholder Clerk subject IDs or environment-provided demo IDs only as supported by the seed script. Never create passwords, Clerk secrets, database credentials, or production accounts in seed data.
- Keep `.env.example` limited to placeholders. Secrets belong in local `.env` files or deployment environment settings, never in seed source, README, or committed output.

## Validation and reporting

- Ensure seed operations are deterministic and safe to re-run where practical.
- Check referential integrity, required fields, valid lifecycle transitions, and department ownership consistency against the schema.
- Do not run tests unless asked. Report what records the seed creates, required environment variables, whether the seed is idempotent, and any assumptions.
- If the requested scenario needs a schema change, stop extending seed data around a nonexistent field; identify the gap and use the relevant schema skill/process.
