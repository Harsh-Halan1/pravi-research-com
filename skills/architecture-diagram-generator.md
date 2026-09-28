---
name: architecture-diagram-generator
description: Inspect and create or update architecture diagrams for the Pravi infrastructure inventory. Use whenever asked for an architecture diagram, system design visualization, component/data-flow diagram, deployment view, or to explain how the application is structured. Ground every diagram in the current code and project documents, and label assumptions and planned components explicitly.
---

# Architecture Diagram Generator

## Purpose

Produce an accurate, reviewable architecture view for the Pravi government infrastructure asset inventory. Prefer Mermaid diagrams in Markdown unless the user requests another format.

## Workflow

1. Inspect the current implementation and relevant project documents before drawing. Check `ARCHITECTURE.md`, `Decision.md`, `PRODUCT_BRIEF.md`, the Prisma schema, route handlers/server actions, authentication helpers, and deployment configuration as relevant.
2. Separate what exists in code from what is planned, deferred, or assumed. Do not draw proposed integrations as if they are deployed.
3. Choose a diagram that answers the request: context, runtime components, request/auth flow, data model, lifecycle workflow, or deployment. Avoid cramming unrelated concerns into one diagram.
4. Label trust boundaries and show server-side authorization between Clerk identity and database-backed role assignments. Never imply that a role supplied by the browser is trusted.
5. Show append-only lifecycle/status history with actor, server timestamp, and reason where relevant. Do not depict history as editable or deletable.
6. Use the confirmed stack only where applicable: Next.js on Vercel, Prisma, PostgreSQL on Supabase, Clerk, and Biome. Do not add Redis/Upstash, queues, storage, GIS, or other services unless code or a confirmed decision supports them; mark deferred items as deferred.
7. For a multi-category asset design, show shared asset identity and category-specific attributes/lifecycles without implying every category shares the same lifecycle workflow.
8. Validate Mermaid syntax and ensure labels remain readable. Update `ARCHITECTURE.md` only when asked or when the diagram is clearly intended to be maintained there.

## Decision integrity

- Follow the fixed sections in `Decision.md`: Confirmed decisions, Deferred choices, Prototype assumptions, Open questions, Change process.
- Never silently convert an assumption into a confirmed decision. A diagram can report a confirmed user instruction as confirmed only when the decision log supports it; otherwise label it as an assumption or proposal.
- Keep secrets, connection strings, account identifiers, and credentials out of diagrams and documentation.

## Output

Include the diagram and a short legend that identifies implemented, planned, and assumed elements. State which project files informed it and flag any material mismatch between documentation and code for resolution.
