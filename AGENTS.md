# Working guidance

- Read `Decision.md`, `PRODUCT_BRIEF.md`, and `ARCHITECTURE.md` before changing product or data boundaries.
- Treat the road-segment workflow as the first feature slice. Complete it before starting another asset type.
- Keep workflows asset-specific where real processes differ; share only proven common capabilities.
- Mark unconfirmed roles, policy, evidence, and process details as prototype assumptions.
- Stack: Next.js/Vercel, Prisma/PostgreSQL on Supabase, Clerk, and Biome. Redis/Upstash is deferred; no TanStack package is selected.
- Enforce authorization on the server, not only in the UI. Preserve lifecycle and audit history for consequential changes.
- Never commit credentials, tokens, private keys, or real user data. Use environment variables and synthetic demo data.
- Keep changes focused, accessible, and consistent with existing code. Do not add dependencies without a concrete need.
- Project-specific coding skills live as flat Markdown files in `skills/`; consult the relevant skill when its task trigger matches.
