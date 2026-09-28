# Decision Log

This file records product and implementation decisions for the Pravi infrastructure asset prototype. A decision marked **Confirmed** reflects a direction explicitly agreed in the project discussion. Operational details marked **Assumption** are for the prototype and are not government policy.

## Confirmed decisions

| Topic | Decision |
|---|---|
| Product purpose | A government-facing system for managing fixed physical infrastructure assets through their lifecycle. |
| Asset scope | Support multiple asset categories over time; the first feature slice is road segments. |
| Lifecycle design | Asset categories may have different lifecycles and workflows. Do not force every category through one identical process. |
| Users | Account for different responsibilities, including record submitters, verifiers, people who maintain assets, administrators, and read-only users. Exact operational role definitions remain assumptions until confirmed. |
| Shared asset identity | Common asset records include id, category, name, latitude/longitude location, owning department, status, lifecycle stage, and creation time; asset-specific fields and workflows may vary by category. |
| Cross-category lifecycle reporting | Use a shared high-level lifecycle stage for reporting, while each asset category retains its own operational workflow state and transitions. |
| Inspection responsibility | Keep `INSPECTOR` a distinct role, separate from verifier and maintenance roles, to preserve a place for independent inspection responsibilities. |
| Lifecycle event vocabulary | Include transfer and decommission event types in the shared lifecycle history vocabulary; detailed approval workflows can be added when confirmed. |
| Asset-specific operations | Each asset type may require its own real-world lifecycle and workflow; do not assume one universal government workflow. |
| Configuration | A configurable platform was considered, then refined after mentor discussion: model real asset-specific workflows rather than assuming one generic configurable lifecycle. |
| Delivery sequence | Establish the foundation first, deliver the road-segment vertical slice, then work on later asset types sequentially. |
| Framework and hosting | Next.js deployed on Vercel. |
| Initial framework line | Pin the supported Next.js 15.5 release line for the prototype; use a patched release. |
| Data access and database | Prisma ORM with PostgreSQL hosted by Supabase. |
| Application database namespace | Store application models and enums in a dedicated pravi PostgreSQL schema; retain Prisma migration tracking in public. |
| Runtime database role | Use a dedicated non-owner, `NOBYPASSRLS` `pravi_app` role for application requests; reserve the privileged direct connection for migrations and explicit administrative tasks. |
| Database identity context | Derive the Clerk user ID from server-verified Clerk auth and set it transaction-locally for each Prisma operation so RLS sees a per-request identity without leaking context across pooled connections. |
| Authentication | Clerk. Application roles and authorization scopes remain application-managed and must be enforced server-side. |
| Code quality | Biome. |
| Secrets | Never commit credentials or put them in README. Use local environment files and Vercel environment settings; provide placeholders and safe setup instructions. |
| Language support | The initial interface language set is English, Hindi, Bengali, Marathi, and Gujarati. Use `next-intl` for App Router localization. Verify translations with fluent reviewers; the language set may be adjusted to the target state/jurisdiction. |

## Deferred choices

- Redis/Upstash is deferred until a concrete caching, rate-limiting, or queue need exists.
- “TanStack” packages have not been selected. Choose specific packages only when a demonstrated UI/data need warrants them.
- Evidence-file storage provider and access/retention rules still need an implementation decision. Database records should store file metadata/references, not file binaries.

## Prototype assumptions (not confirmed government policy)

- The current prototype's database roles (`SUBMITTER`, `VERIFIER`, `INSPECTOR`, `MAINTENANCE_OFFICER`, `PLANNER`, `ADMIN`) are provisional implementation labels, not confirmed government job titles or permissions. `PLANNER` currently serves as the read-only demo role. `MAINTENANCE_OFFICER` maps to the maintainer responsibility. `INSPECTOR` is a distinct, verifier-adjacent role intended to be independent of the person requesting or approving work. The prototype prevents an inspector from reviewing their own inspection and prevents road submitters from verifying their own submissions; broader conflict-of-interest rules are unconfirmed.
- The first demo uses one jurisdiction and online access.
- The Next.js server uses a server-only Supabase PostgreSQL connection and enforces Clerk identity, active role assignment, and department scope in server-side code; RLS is not assumed to replace these checks.
- Migration 005 defines department-scoped RLS policies and creates `pravi_app` without login. It is not active until applied and a runtime password is provisioned out of band; verify the role flags and smoke-test policies after switching `DATABASE_URL`.
- For the initial authenticated UI, locale preference will be stored in a cookie so existing route URLs remain stable; revisit locale-prefixed routes if public sharing or search discoverability becomes a requirement.
- Shared representative latitude/longitude may be null on draft/planned asset records; coordinates must be stored as a pair. The prototype does not yet enforce a policy that requires location before activation.
- Prototype authorization checks exact department assignment; access is not inherited through department hierarchy unless later confirmed and implemented.
- Any road registration, verification, inspection, work-order, completion, and evidence rules will be simplified for the prototype until confirmed.
- For the prototype, a road segment's submitter cannot verify their own submission, including when the submitter also has an administrator role. This separation-of-duties rule is a conservative prototype assumption, not confirmed government policy.
- The prototype's workflow assignments are assumptions: submitters create or correct records; a different verifier reviews submissions; inspectors record condition and findings; maintenance officers are assigned work; and verifiers record work completion approval. Evidence requirements, improvement approvals, asset transfer acceptance, and decommission checks are not confirmed government policy. Keep these rules explicit and revisable until Pravi or a government representative confirms them.
- A road record is created and submitted for verification in one form action; drafts are not separately saved in the current UI. For the prototype, maintenance assignment can select an active `MAINTENANCE_OFFICER` in the same department; this rule does not define government staffing policy.
- Important lifecycle decisions retain who acted, when, and why; returned submissions preserve the reviewer’s reason and prior history.
- Work-order amounts are stored as decimal values without a currency field for the synthetic prototype; one currency is assumed until multi-currency or official reporting requirements are known.
- Evidence visibility is a small controlled prototype classification, not a complete government information-classification or public-release policy.
- The initial Prisma schema is intentionally limited to road segments plus shared prototype records. It is not yet the complete lifecycle implementation; detailed transfer/decommission workflows and other categories are deferred.

## Open questions

- Which real government departments and jurisdiction levels are in scope, and how do they map to access scopes?
- What are the official road-segment identifiers, geometry/chainage conventions, and authoritative source systems?
- Which evidence and approvals are mandatory for registration, inspections, and work completion?
- What are the official condition scales, inspection intervals, safety escalation rules, and maintenance approval procedures?
- Is offline or low-connectivity field work required?
- What are data sensitivity, retention, audit, and file-storage requirements?
- Which additional access rules are required for restricted evidence classifications and future cross-department work orders?
- How should Clerk users be provisioned and linked to government identities in a production system?
- What are the evaluation and submission requirements for deployment, code archive, architecture, and demo recording?
- Which state or jurisdictions should determine the first four or five interface locales, and who can review government terminology in each language?

## Change process

When a decision changes, update this log and the relevant shared product or architecture document. Keep policy assumptions clearly labeled until a representative confirms them.
