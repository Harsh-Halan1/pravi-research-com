# Government Infrastructure Asset Management — Working Brief

## Purpose

Design a government-facing system to register and manage fixed physical infrastructure assets across their real-world lifecycles. The system should support multiple asset types and the distinct workflows, evidence, and responsibilities those assets require.

## Confirmed direction

- The product is for government asset management.
- Assets are non-moving physical entities, such as roads, bridges, buildings, water infrastructure, and similar public infrastructure.
- Different asset types can have different lifecycles; do not force every asset into one identical workflow.
- Different users have different responsibilities, including adding records, verifying them, maintaining assets, administering the system, and read-only access.
- The workflow details currently discussed are assumptions to be documented, not confirmed government policy.
- The platform should be well structured and use Biome and Prisma.
- Candidate infrastructure and libraries named so far: Redis or Upstash for caching, TanStack, Clerk API for authentication, and Supabase for the database.

## Working product model

Use shared platform capabilities where they fit all asset classes, while allowing asset-specific lifecycle workflows.

### Shared capabilities (initial hypothesis)

- Role-based access and scoped permissions
- Asset register, search, and filtering
- Verification and approval queue
- Inspection and maintenance records
- Work tracking and lifecycle history
- Evidence and document references
- Audit trail for important changes
- Dashboards and reports

These are candidate capabilities, not a final feature commitment. Validate them against user journeys and the time available for the prototype.

### Example asset classes to explore

- Roads and road segments
- Bridges and culverts
- Public buildings
- Water supply and drainage infrastructure
- Streetlights and other public utilities

These examples do not imply that every category will receive a complete workflow in the first release.

## Assumptions to make explicit

Until Pravi supplies operational rules, document assumptions for:

- Who may create, edit, verify, approve, and view asset records
- Which evidence is required for registration, verification, inspections, and work completion
- How inspections are scheduled and recorded
- How maintenance and improvement work is requested, prioritized, approved, assigned, and closed
- How ownership or jurisdiction transfers are recorded
- What constitutes decommissioning or retirement
- Whether field users need offline or low-connectivity support
- How location, maps, photos, and documents are represented
- Data sensitivity, retention, and audit requirements

## Technical direction (selected for the prototype)

| Area | Current preference | Status / design note |
|---|---|---|
| Code quality and formatting | Biome | Selected and configured. |
| ORM and schema management | Prisma | Selected; current schema is a road-first foundation under review, not a complete product schema. |
| Authentication | Clerk | Selected for sign-in; app roles and permissions remain database-managed and enforced server-side. |
| Database | Supabase PostgreSQL | Selected; apply migrations to a development database after schema review. |
| Caching | Redis / Upstash | Deferred until a concrete requirement exists. |
| Client data fetching/state | TanStack | No package selected. Choose only for a demonstrated need. |
| Deployment | Vercel | Target deployment platform; deployment is not yet documented as completed. |

## Remaining technical/product questions

- Which TanStack packages, if any, are needed
- Whether a backend-for-frontend/API layer is needed and where it runs
- Final schema details for shared location and asset-specific lifecycle representation (see `DATABASE_SCHEMA_REVIEW.md`)
- Whether caching is needed in the prototype
- File and image storage approach
- Initial asset classes and the representative journeys to demonstrate
- Demo users, roles, and safe credential-sharing method

## Role journeys (assumptions for discovery/prototype)

These journeys model plausible government operations; they are not confirmed procedures. Departments may combine roles or introduce additional approvals.

### 1. Department asset submitter / field enumerator

1. Selects an asset type and enters its required attributes, location, department, and available source information.
2. Adds evidence such as geotagged photos, maps, drawings, commissioning records, or a field survey.
3. Saves a draft or submits the record for verification; missing required information is shown before submission.
4. Responds to verifier questions and resubmits corrections.
5. Later records an inspection, reported issue, or completed work against the asset, subject to permissions.

### 2. Technical verifier / departmental engineer

1. Opens a queue of newly submitted or changed assets within their jurisdiction and expertise.
2. Checks required attributes, location, evidence, possible duplicates, and asset-specific criteria.
3. Approves, rejects with a reason, or returns the record for correction; decisions are timestamped and attributed.
4. Verifies inspections or completed work when the workflow requires independent review.

### 3. Asset / maintenance officer

1. Reviews assigned assets, condition, inspection history, outstanding issues, and due work.
2. Creates or triages a maintenance/improvement request and records urgency, rationale, and supporting evidence.
3. Routes work for approval and assignment according to assumed thresholds and responsibilities.
4. Tracks work through planned, assigned, in progress, completed, and verified states; records cost, dates, contractor/team, and evidence.
5. Updates asset condition and next inspection/maintenance dates after approved completion.

### 4. Department administrator / asset-data steward

1. Manages department boundaries, user access, asset-type definitions, required fields, and permitted workflow transitions.
2. Imports or reconciles records from existing registers and reviews data-quality exceptions.
3. Monitors verification backlogs, missing data, overdue inspections, and maintenance status.
4. Initiates or approves jurisdiction transfers and decommissioning under the assumed policy.

### 5. Read-only planner / auditor / public-facing viewer

1. Searches or filters permitted asset records and views location, status, condition, lifecycle events, and approved documents.
2. Uses aggregate reports for planning, budgeting, audit, or public transparency, based on their access scope.
3. Cannot edit operational records; sensitive fields and documents are hidden unless specifically authorized.

## Representative asset lifecycle comparisons

All lifecycle steps below are assumptions to expose variation. A real department may use different terminology, approvals, evidence, and handoffs.

| Lifecycle concern | Road segment | Bridge / culvert | Public building | Water supply asset |
|---|---|---|---|---|
| Identify/register | Road ID/name, route, start/end points, length, surface, jurisdiction | Bridge ID, coordinates, span/structure type, road/water crossing, owner | Building ID, address/coordinates, use, area, department, occupancy | Asset ID, coordinates/network, facility type, capacity, service area |
| Commission / accept | Completion or handover record, as-built geometry, surface details | Structural drawings, inspection baseline, load/clearance details, handover | Completion, occupancy/use, safety/accessibility systems and handover | Commissioning/test results, network connectivity, capacity and operator |
| Operational monitoring | Condition surveys, traffic/service issues, drainage or surface observations | Scheduled structural inspection, defect severity, load restrictions, incident review | Building/facility inspections, safety systems, accessibility, utilization | Operational readings, water quality where applicable, leakage/failure, service continuity |
| Maintenance | Patching, resurfacing, drainage, markings; work by segment and affected length | Structural repair, joints/bearings/deck/drainage; specialist approval and closure controls | Repairs to structure, electrical, plumbing, fire/safety systems; occupancy coordination | Preventive servicing, repair/replacement, test and service-restoration records |
| Improve / expand | Widening, resurfacing standard, junction or drainage upgrade; may create changed geometry | Strengthening, rehabilitation, capacity or safety upgrade; engineering review | Retrofit, extension, energy/accessibility upgrade; changed area/use/systems | Capacity or treatment upgrade, network extension, process change |
| Transfer / retire | Road jurisdiction or ownership transfer; closure or removal of segment | Ownership transfer with technical records; decommission/demolition | Change of department/use, sale/transfer, closure or demolition | Operator/department transfer; shutdown, isolation, replacement or removal |

## Shared lifecycle building blocks and genuine differences

### Shared platform services (tentative)

- Stable asset identity, type, owner/jurisdiction, location, status, and provenance
- Versioned lifecycle events and attributable audit history
- Evidence/document references with access controls
- Role- and jurisdiction-scoped permissions
- Configurable forms and validation at the asset-type level
- Work/inspection records linked to one or more assets
- Search, maps, queues, and reporting over authorized data

### Asset-specific workflow/configuration (tentative)

- Type-specific attributes and evidence requirements
- Lifecycle state machine, allowed transitions, and responsible roles
- Inspection templates, intervals, measurements, and defect severity
- Maintenance work types, priority rules, approvals, and completion criteria
- Engineering or safety gates, operational restrictions, and retirement checks

Do not assume that asset-specific behavior can be represented only as custom fields: some differences affect permissions, required evidence, state transitions, and approval rules.

## Product risks and design questions to resolve

- **Granularity:** roads are linear networks and may need segmentation; bridges/buildings/water facilities are usually discrete assets. Decide how parent-child and network relationships work.
- **Asset identity:** assets can be duplicated across department registers, renamed, subdivided, or replaced. Keep stable internal IDs and retain external identifiers/provenance.
- **History:** do not overwrite meaningful condition, ownership, location, or lifecycle changes; record them as dated events or versions.
- **Cross-department scope:** define whether users see only their department/jurisdiction or can discover shared assets.
- **Evidence:** define file types, metadata, retention, and verification; do not put sensitive government documents in unrestricted public storage.
- **Offline field work:** confirm whether drafts and evidence capture must work without connectivity before selecting an offline design.
- **Public access:** distinguish internal operational records from information approved for public viewing.
- **Workflow flexibility:** support variation without turning the first version into a generic workflow-builder project.

## Core information model (product contract; current Prisma implementation is partial)

This model separates durable asset identity from changing events and type-specific details. It describes the intended product shape, not a commitment to exact table names or field types. The current road-first implementation gaps are tracked in `DATABASE_SCHEMA_REVIEW.md`.

### Core records

- **Asset** — stable internal ID, category, name/identifier, owning department, location (latitude/longitude at minimum), operational status, high-level lifecycle stage, provenance, created/updated metadata, and optional parent/network relationships. Category-specific workflows retain their own states and transitions.
- **AssetType** — category and versioned definition of required fields, validation rules, evidence requirements, inspection templates, lifecycle workflow, and available work types.
- **AssetAttributeValue** — type-specific values associated with an asset and, where needed, their effective dates/source. Keep frequently filtered/shared attributes as typed columns when appropriate; use structured extension data only for genuinely variable attributes.
- **Department / Jurisdiction** — organizational and geographic ownership/scope. Support hierarchy where national/state/district/local structures require it.
- **User / Role / PermissionScope** — authenticated person, assigned role(s), department or jurisdiction scope, and permitted actions. A user may hold more than one role.
- **LifecycleEvent** — append-oriented record of a meaningful state or fact change: event type, from/to state when relevant, actor, timestamp, reason, source, and linked evidence. Current state on Asset is a convenient projection; event history remains authoritative.
- **WorkflowDefinition / WorkflowVersion** — asset-type-specific states, transitions, required roles, validations, and approval gates. Treat published versions as immutable so existing assets retain interpretable history.
- **Inspection / InspectionFinding** — inspection type/date/inspector, template version, readings and findings, severity, recommendations, and review status. Finding may link to a component or location within an asset.
- **WorkRequest / WorkOrder** — reported or planned work, affected asset(s), work type, priority/rationale, approval/assignment/status, planned and actual dates/cost, completion notes, and verification.
- **Evidence** — metadata for a file or external record (storage key/reference, type, capture date/location, uploader, checksum if available, visibility/retention classification). Store binaries in object storage, not as database blobs.
- **AuditEvent** — security- and accountability-focused log of actor, action, target, time, and relevant change summary. Avoid relying on ordinary application logs as the audit trail.
- **ExternalIdentifier / ImportBatch** — source-system identifiers and import provenance, mapping status, validation errors, and reconciliation decisions.

### Key relationships

```text
Department/Jurisdiction ──< UserRoleAssignment >── User
          │
          └──< Asset >── AssetType ──< WorkflowVersion
                 │  ├──< AssetAttributeValue
                 │  ├──< LifecycleEvent
                 │  ├──< Inspection ──< InspectionFinding
                 │  ├──< WorkRequest / WorkOrder >──< Asset (many-to-many)
                 │  ├──< EvidenceLink >── Evidence
                 │  └──< ExternalIdentifier
                 └── parent/child or network relationships to other Assets

All important mutations ──> AuditEvent
```

### What varies by asset type

| Concern | Shared representation | Type-specific variation |
|---|---|---|
| Identity and location | Stable ID, owner, jurisdiction, provenance | Linear geometry/segments for roads; point/footprint for bridges, buildings, and facilities; optional network connectivity |
| Descriptive data | Asset type and common name/status | Surface and route fields; structural form/load fields; building use/area/system fields; water capacity/network/process fields |
| Lifecycle | Events, states, actor, timestamps, reasons | Allowed states and transitions; acceptance, restrictions, approvals, transfer, and retirement checks |
| Inspection | Date, inspector, template, findings, evidence | Measurement sets, intervals, severity scales, and qualified reviewer requirements |
| Work | Request/order, priority, assignment, dates, cost, completion | Work categories, safety controls, service/traffic interruptions, tests, and closure evidence |
| Access | User roles and jurisdiction scopes | Additional type-specific qualifications or approval permissions if assumed/required |

### Validation against example journeys

- **Road segment:** represent route geometry and chainage/segment boundaries; resurfacing can affect part of a road and may change geometry or segment identity. Preserve lineage when splitting/merging.
- **Bridge:** represent the bridge as a discrete asset, optionally linked to a road and waterway; inspections have structured findings and may trigger restrictions before work approval.
- **Public building:** represent the building and optionally its systems/components (for example fire safety or HVAC) as child assets or related records; work can affect occupancy and operational availability.
- **Water infrastructure:** represent facilities and network assets with connectivity and service-area relationships; maintenance may require isolation, testing, and service-restoration evidence.

The model can represent these differences without making a single generic lifecycle mandatory. It also surfaces a design decision: whether components are full Assets, lightweight Components, or both. For a prototype, use full child assets only when they need separate ownership, inspections, work, or lifecycle tracking.

## Data and workflow invariants (assumptions to validate)

- A stable internal asset ID is never reused, even if the asset is retired.
- State changes happen through authorized transitions and create lifecycle and audit history.
- Rejected or returned submissions preserve the submission and reviewer reason; corrections do not erase prior decisions.
- Evidence links carry access classification and can be attached to multiple relevant records.
- Work affecting multiple assets links to each affected asset while retaining one coordinated work order.
- Current condition/status is derived from the latest accepted information, with its source and effective date visible.
- Cross-department transfers retain history and require acceptance by the receiving scope, unless policy says otherwise.
- Workflow/type configuration changes are versioned; records identify the version used when submitted or reviewed.

## Implementation status and sequence

Implementation has started with a small app/auth/schema foundation. The current Prisma schema is valid but is not considered complete for the full product. Review it before expanding data operations. The agreed delivery sequence is:

1. Review and refine the road-first Prisma schema and apply a migration to a development database.
2. Complete the first road-segment vertical slice, marking unconfirmed workflows and policies as assumptions.
3. Add the next asset category only after the road slice is complete, designing its lifecycle for its actual use case.
4. Select evidence storage when an implemented journey requires real file upload and retrieval.

The product discovery is now far enough along to start **implementation planning and prototype scaffolding**. The agreed delivery order is one road-segment vertical slice first, followed by a new asset slice after it is complete. The user prefers to establish schema and authentication before feature work so implementation is not repeatedly interrupted. Do not wait for every government policy question to be answered; label assumptions and keep the demo adaptable.

## Current next step

The road-first schema reflects the agreed shared asset contract and lifecycle approach. The first road workflow is implemented in code, but has not been exercised against a database because the configured Supabase target is not identified as a development database. Next confirm a safe development target, apply the migrations, and validate the complete journey end to end. Avoid pre-building a generalized workflow engine or every future asset schema. Keep assumptions explicit and use migrations for intentional changes as requirements emerge.

## Initial road-segment slice (first implementation target)

After the technical foundation, deliver one complete online demo journey:

1. A field submitter creates a road-segment record with route/segment details, jurisdiction, location/geometry, and sample evidence.
2. A verifier reviews it and approves it or returns it with a reason; history records the decision.
3. An inspector records a condition assessment and findings against the road segment.
4. A maintenance officer creates and assigns a work order for a defined road section, then records completion and evidence.
5. A read-only planner views the asset summary, current condition, work status, and lifecycle history.

Initial assumptions: seeded demo users/roles, online-only use, synthetic sample data, one jurisdiction, and simplified approval/maintenance rules. These assumptions should be visible in documentation and must not be represented as confirmed government policy.

### Foundation scope before the first feature

- Create the application skeleton and consistent Biome tooling.
- Configure Prisma against the selected PostgreSQL host, migrations, and seed data.
- Define the first schema around stable identity, asset type, department/jurisdiction, user-role assignment, lifecycle events, inspection/findings, work orders, and evidence metadata.
- Set up Clerk sign-in and map authenticated identities to app-managed roles/scopes; enforce authorization in server-side data access, not only in the UI.
- Choose private evidence storage and reference metadata from the database; keep credentials and service secrets in environment settings, never committed files or the README.
- Add basic operational setup instructions and a safe demo account flow.

Defer Redis/Upstash until there is a measured or concrete caching, rate-limiting, or queue need. Pick TanStack packages based on actual UI needs. Keep the first foundation small enough to validate end to end before building a generalized platform layer.
