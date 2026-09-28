---
name: lifecycle-audit-trail
description: Guide and verify the append-only lifecycle event recording, workflow state transitions, and audit trails for Pravi infrastructure assets. Use when adding or modifying server actions, status transitions, review loops, actor attribution, or reason tracking.
---

# Lifecycle and Audit Trail Standards

## Purpose

Enforce durable, append-only history and strict server-side workflow rules across asset lifecycles. In Pravi, current status on an entity is a convenient query projection; the immutable event history remains authoritative.

## Core principles

1. **Append-only history:** Never update or delete `LifecycleEvent`, `RoadSegmentStatusEvent`, `InspectionEvent`, `WorkOrderEvent`, or `AuditEvent` records. History must preserve the historical sequence of what happened, who acted, and why.
2. **Actor attribution:** Every lifecycle and status transition must capture the authenticated, database-verified `UserProfile.id` as `actorId`. Never trust client-supplied identity or roles.
3. **Reason enforcement:** Any backward or terminal transition (such as returning a submission for changes, rejecting an inspection, or cancelling a work order) strictly requires an explicit, non-empty reason string.
4. **Separation of duties:** Enforce role independence on the server:
   - Road submitters cannot verify their own submissions, even if they hold an `ADMIN` role.
   - Inspectors cannot verify their own inspection assessments.
   - Work order completion requires verifier sign-off distinct from maintainer execution.
5. **Shared vs category-specific lifecycles:**
   - Use `LifecycleStage` (`REGISTRATION`, `CONDITION_RISK_ASSESSMENT`, `MAINTENANCE_REPAIR`, etc.) for high-level reporting across all asset types.
   - Use category-specific status enums (e.g. `RoadSegmentStatus`: `DRAFT`, `PENDING_VERIFICATION`, `NEEDS_CHANGES`, `VERIFIED`) for detailed operational workflows.
   - When an asset leaves a temporary lifecycle stage (such as when all open work orders are closed), restore the appropriate prior stage based on recorded condition and status.

## Implementation rules

- **Server-side validation:** Enforce all status machine transitions inside server actions using pure policy validators (e.g. `src/lib/workflow-policies.ts`). Client-side UI disables are for ergonomics only.
- **Transactional atomicity:** State changes and event row creation must occur within a single database transaction (`prisma.$transaction`) to prevent orphan state changes.
- **Snapshot preservation:** When an entity is returned for changes and subsequently updated, snapshot previous findings or payloads in the event details so corrections do not obliterate prior review evidence.
- **Unit test coverage:** Any modification to transition logic or permission checks must be accompanied by focused unit tests in `tests/`.
