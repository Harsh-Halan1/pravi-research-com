---
name: frontend-production-readiness
description: Guide the design, implementation, and review of production-ready frontend interfaces for Pravi. Use when building or refactoring UI components, pages, forms, tables, navigation shells, accessibility features, or styling to ensure enterprise government-grade quality.
---

# Frontend Production Readiness Guide

## Purpose

Ensure all user-facing interfaces in Pravi meet enterprise government standards: high visual credibility, robust accessibility (WCAG 2.1 AA), responsive performance, predictable state management, defensive error handling, and seamless multilingual support.

## Civic Design Philosophy (Anti-AI SaaS Tropes)

Pravi is sovereign public infrastructure software built for government officials, departmental engineers, and field inspectors. It must not look like an AI SaaS demo or a generic consumer template:
- **No AI clichés:** Avoid dark cyber neon modes, purple/cyan gradient glow, floating particle animations, glossy glassmorphic cards, or conversational AI chat wrappers where tabular and form tools belong.
- **Dignified public stewardship:** Ground the visual language in high-trust civic design systems (deep forest green `#176b4a`, warm parchment `#f7f9f7`, charcoal `#15231e`, structured neutral borders `#e2e8e4`, and accessible semantic status badges).
- **Functional ergonomics:** Prioritize data density, rapid scanability, keyboard navigation, and instant information retrieval over decorative animations or oversized whitespace.

## Core standards

### 1. Unified visual architecture & workspace shell
- Use a single cohesive layout shell for all authenticated operational pages (`/dashboard`, `/assets`, `/assets/new`, `/assets/[id]`).
- Incorporate standardized navigation with:
  - Official PRAVI brand lockup and department selector.
  - Active operational role badge (`SUBMITTER`, `VERIFIER`, `INSPECTOR`, `MAINTENANCE_OFFICER`, `ADMIN`, `PLANNER`).
  - Dynamic breadcrumbs for contextual navigation.
  - User profile menu and locale switcher.
- Follow established design tokens (deep forest green `#28684f`, slate text, clean border lines `#e1e8e1`, semantic status badges).

### 2. Accessibility & semantic structure (WCAG 2.1 AA)
- Use semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- For status announcements, alerts, and notifications, use `<output>` or native ARIA live regions (`role="status"`, `aria-live="polite"`). Never use non-semantic elements with ARIA role overrides where a semantic HTML element exists.
- Ensure all interactive elements (buttons, links, inputs) have accessible labels, high contrast ratios (minimum 4.5:1 for body text), and distinct `:focus-visible` outlines.
- Support `prefers-reduced-motion` cleanly in CSS modules without using `!important`.

### 3. Performance, zero-bundle bloat & defensive engineering
- **Zero layout shift (CLS = 0):** Provide dedicated `loading.tsx` skeletons matching the exact geometry of tables, KPI cards, and detail panels.
- **Resilient error handling:** Include dedicated `error.tsx` and `not-found.tsx` boundaries with actionable retry mechanisms.
- **Defensive data rendering:** Always guard optional or nullable fields (e.g. coordinates, external IDs, markers, dates) with fallbacks rather than crashing.
- **Lightweight custom visualizers:** Prefer precision SVG vector visualizers for road chainage and condition distribution over heavy third-party map or chart bundles that degrade initial load performance.
- Default to React Server Components (RSC) for initial data fetching, department scoping, and role verification.

### 4. Enterprise data density & filtering
- Government registries require clear, high-density data tables and cards.
- Implement multi-faceted filtering:
  - Text search by asset code, name, route, or external ID.
  - Filter by lifecycle stage, operational workflow status, and condition rating.
  - Sort by last updated, creation date, or length/size.
  - Export to CSV action for administrative audit and external reporting.

### 5. Multilingual & localization (next-intl)
- All user-facing strings, button labels, validation messages, and status badges must be extracted to `next-intl` message catalogs (`src/i18n/messages/{en,hi,bn,mr,gu}.json`).
- Stable route URLs should be preserved, with the user's selected locale stored in cookies.
- Maintain untranslated identifiers (e.g. database UUIDs, asset codes, technical IDs) while translating descriptive labels.

### 6. Code quality & Biome verification
- All files must pass `npm run lint` (`biome check .`) with 0 errors and 0 warnings.
- Keep CSS modular via CSS Modules or clean utility variables. Avoid inline CSS strings or duplicate utility styles.

