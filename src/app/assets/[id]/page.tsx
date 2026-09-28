import Link from "next/link";
import { notFound } from "next/navigation";
import { RoadRouteVisualizer } from "@/components/road-route-visualizer";
import { WorkspaceShell } from "@/components/workspace-shell";
import { hasAnyRole, requireUserProfile } from "@/lib/auth";
import { withUserDbContext } from "@/lib/prisma";
import {
  InspectionCorrectionForm,
  InspectionForm,
  InspectionReviewForm,
  RoadCorrectionForm,
  RoadReviewForm,
  WorkOrderForm,
  WorkOrderStatusForm,
} from "../asset-forms";
import styles from "../assets.module.css";

function humanizeRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const userDisplaySelect = { id: true, displayName: true } as const;

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const profileResult = await requireUserProfile();
  if (
    profileResult.kind !== "active" ||
    !profileResult.profile.roleAssignments.length
  ) {
    return (
      <main className={styles.page}>
        <header className={styles.topline}>
          <Link className={styles.brand} href="/assets">
            PRAVI · ASSET INVENTORY
          </Link>
        </header>
        <section className={styles.content}>
          <div className={styles.empty}>
            Your account needs an active department role to view this record.
          </div>
        </section>
      </main>
    );
  }
  const profile = profileResult.profile;

  const departmentIds = [
    ...new Set(
      profile.roleAssignments.map((assignment) => assignment.departmentId),
    ),
  ];
  const asset = await withUserDbContext(profile.clerkUserId, (prisma) =>
    prisma.asset.findFirst({
      where: { id, departmentId: { in: departmentIds } },
      include: {
        department: true,
        createdBy: { select: userDisplaySelect },
        roadSegment: {
          include: {
            statusEvents: {
              orderBy: { occurredAt: "desc" },
              include: { actor: { select: userDisplaySelect } },
            },
          },
        },
        events: {
          orderBy: { occurredAt: "desc" },
          include: { actor: { select: userDisplaySelect } },
        },
        inspections: {
          orderBy: { inspectedAt: "desc" },
          include: {
            inspector: { select: userDisplaySelect },
            findings: true,
            events: {
              orderBy: { occurredAt: "desc" },
              include: { actor: { select: userDisplaySelect } },
            },
          },
        },
        workOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            workOrder: {
              include: {
                createdBy: { select: userDisplaySelect },
                assignee: { select: userDisplaySelect },
                events: {
                  orderBy: { occurredAt: "desc" },
                  include: { actor: { select: userDisplaySelect } },
                },
              },
            },
          },
        },
        evidence: true,
      },
    }),
  );
  if (!asset) notFound();

  const maintenanceStaff = await withUserDbContext(
    profile.clerkUserId,
    (prisma) =>
      prisma.userProfile.findMany({
        where: {
          active: true,
          roleAssignments: {
            some: {
              active: true,
              departmentId: asset.departmentId,
              role: "MAINTENANCE_OFFICER",
            },
          },
        },
        select: { id: true, displayName: true },
        orderBy: { displayName: "asc" },
      }),
  );

  const roleInDepartment = (roles: Parameters<typeof hasAnyRole>[1]) =>
    hasAnyRole(profile, roles, asset.departmentId);
  const canReview = roleInDepartment(["VERIFIER", "ADMIN"]);
  const canInspect = roleInDepartment(["INSPECTOR", "ADMIN"]);
  const canMaintain = roleInDepartment(["MAINTENANCE_OFFICER", "ADMIN"]);
  const lifecycleEvents = asset.events;
  const successText = query.registered
    ? "Road segment registered and submitted for verification."
    : query.resubmitted
      ? "Corrections saved and sent back for verification."
      : query.reviewed
        ? "Verification decision recorded."
        : query.inspection
          ? "Inspection action recorded."
          : query.workOrder
            ? "Work order created."
            : query.workOrderUpdated
              ? "Work order status updated."
              : null;

  const roleLabel =
    [
      ...new Set(
        profile.roleAssignments
          .filter(
            (assignment) => assignment.departmentId === asset.departmentId,
          )
          .map((assignment) => humanizeRole(assignment.role)),
      ),
    ].join(" · ") || "Department Official";

  return (
    <WorkspaceShell
      departmentName={asset.department.name}
      displayName={profile.displayName}
      roleLabel={roleLabel}
      activeNav="assets"
      breadcrumbs={[
        { label: asset.department.name, href: "/dashboard" },
        { label: "Asset register", href: "/assets" },
        { label: asset.name },
      ]}
      topActions={
        <Link
          href="/assets"
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #d5ddd6",
            background: "#ffffff",
            color: "#36574a",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Back to register
        </Link>
      }
    >
      {successText && <output className={styles.success}>{successText}</output>}
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>{asset.assetCode} · Road segment</p>
          <h1>{asset.name}</h1>
          <p className={styles.muted}>
            {asset.department.name} · {asset.roadSegment?.routeName}
          </p>
        </div>
        <span className={styles.badge}>
          {label(asset.roadSegment?.workflowStatus ?? asset.status)}
        </span>
      </div>

      {asset.roadSegment && (
        <div style={{ marginBottom: 24 }}>
          <RoadRouteVisualizer
            routeName={asset.roadSegment.routeName}
            externalRoadId={asset.roadSegment.externalRoadId}
            startMarker={asset.roadSegment.startMarker}
            endMarker={asset.roadSegment.endMarker}
            lengthKm={asset.roadSegment.lengthKm.toString()}
            surfaceType={asset.roadSegment.surfaceType}
            condition={asset.currentCondition}
            startLatitude={asset.roadSegment.startLatitude?.toString()}
            startLongitude={asset.roadSegment.startLongitude?.toString()}
            endLatitude={asset.roadSegment.endLatitude?.toString()}
            endLongitude={asset.roadSegment.endLongitude?.toString()}
            representativeLat={asset.latitude?.toString()}
            representativeLng={asset.longitude?.toString()}
          />
        </div>
      )}

      <div className={styles.detailGrid}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>Asset record</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Asset code</dt>
                <dd>{asset.assetCode}</dd>
              </div>
              <div>
                <dt>Lifecycle stage</dt>
                <dd>{label(asset.lifecycleStage)}</dd>
              </div>
              <div>
                <dt>Asset status</dt>
                <dd>{label(asset.status)}</dd>
              </div>
              <div>
                <dt>Condition</dt>
                <dd>{label(asset.currentCondition)}</dd>
              </div>
              <div>
                <dt>Owning department</dt>
                <dd>{asset.department.name}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{dateLabel(asset.createdAt)}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>{asset.roadSegment?.routeName}</dd>
              </div>
              <div>
                <dt>Road ID</dt>
                <dd>{asset.roadSegment?.externalRoadId ?? "Not provided"}</dd>
              </div>
              <div>
                <dt>Segment extent</dt>
                <dd>
                  {asset.roadSegment?.startMarker} →{" "}
                  {asset.roadSegment?.endMarker}
                </dd>
              </div>
              <div>
                <dt>Length / surface</dt>
                <dd>
                  {asset.roadSegment?.lengthKm.toString()} km ·{" "}
                  {asset.roadSegment?.surfaceType}
                </dd>
              </div>
              <div>
                <dt>Representative coordinates</dt>
                <dd>
                  {asset.latitude?.toString() ?? "—"},{" "}
                  {asset.longitude?.toString() ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{asset.createdBy.displayName}</dd>
              </div>
            </dl>
          </section>

          {asset.roadSegment?.workflowStatus === "PENDING_VERIFICATION" &&
            canReview && (
              <section className={styles.panel}>
                <h2>Verification decision</h2>
                <p className={styles.muted}>
                  Approve the submitted details or return the record with a
                  reason.
                </p>
                <RoadReviewForm assetId={asset.id} />
              </section>
            )}

          {asset.roadSegment?.workflowStatus === "NEEDS_CHANGES" &&
            roleInDepartment(["SUBMITTER", "ADMIN"]) && (
              <section className={styles.panel}>
                <h2>Correct and resubmit</h2>
                <p className={styles.muted}>
                  Update the returned details. The earlier review and reason
                  remain in the history.
                </p>
                <RoadCorrectionForm
                  assetId={asset.id}
                  initial={{
                    name: asset.name,
                    routeName: asset.roadSegment.routeName,
                    externalRoadId: asset.roadSegment.externalRoadId ?? "",
                    startMarker: asset.roadSegment.startMarker,
                    endMarker: asset.roadSegment.endMarker,
                    lengthKm: asset.roadSegment.lengthKm.toString(),
                    surfaceType: asset.roadSegment.surfaceType,
                    latitude: asset.latitude?.toString() ?? "",
                    longitude: asset.longitude?.toString() ?? "",
                    startLatitude:
                      asset.roadSegment.startLatitude?.toString() ?? "",
                    startLongitude:
                      asset.roadSegment.startLongitude?.toString() ?? "",
                    endLatitude:
                      asset.roadSegment.endLatitude?.toString() ?? "",
                    endLongitude:
                      asset.roadSegment.endLongitude?.toString() ?? "",
                  }}
                />
              </section>
            )}

          <section className={styles.panel}>
            <h2>Inspections</h2>
            {canInspect && asset.status === "ACTIVE" && (
              <InspectionForm assetId={asset.id} />
            )}
            {asset.inspections.length ? (
              <div className={styles.stack} style={{ marginTop: 18 }}>
                {asset.inspections.map((inspection) => (
                  <article key={inspection.id}>
                    <div className={styles.recordMeta}>
                      <strong>
                        {label(inspection.status)} ·{" "}
                        {label(inspection.condition)}
                      </strong>
                      <span>
                        {dateLabel(inspection.inspectedAt)} ·{" "}
                        {inspection.inspector.displayName}
                      </span>
                    </div>
                    {inspection.notes && (
                      <p className={styles.muted}>{inspection.notes}</p>
                    )}
                    {inspection.findings.map((finding) => (
                      <p key={finding.id} className={styles.muted}>
                        {label(finding.severity)} · {finding.description}
                      </p>
                    ))}
                    {inspection.events.length > 0 && (
                      <ol className={styles.history}>
                        {inspection.events.map((event) => (
                          <li key={event.id}>
                            <strong>
                              {event.fromStatus
                                ? label(event.fromStatus)
                                : "Created"}{" "}
                              → {label(event.toStatus)}
                            </strong>
                            <span>
                              {dateLabel(event.occurredAt)} ·{" "}
                              {event.actor.displayName}
                            </span>
                            {event.reason && <p>{event.reason}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                    {inspection.status === "SUBMITTED" &&
                      canReview &&
                      inspection.inspectorId !== profile.id && (
                        <InspectionReviewForm inspectionId={inspection.id} />
                      )}
                    {inspection.status === "NEEDS_CHANGES" &&
                      (inspection.inspectorId === profile.id ||
                        roleInDepartment(["ADMIN"])) &&
                      roleInDepartment(["INSPECTOR", "ADMIN"]) && (
                        <section className={styles.stack}>
                          <h3>Correct and resubmit inspection</h3>
                          <InspectionCorrectionForm
                            inspectionId={inspection.id}
                            initial={{
                              condition: inspection.condition,
                              notes: inspection.notes,
                              findings: inspection.findings,
                            }}
                          />
                        </section>
                      )}
                  </article>
                ))}
              </div>
            ) : !canInspect ? (
              <p className={styles.muted}>No inspections have been recorded.</p>
            ) : null}
          </section>

          <section className={styles.panel}>
            <h2>Maintenance work</h2>
            {canMaintain && asset.status === "ACTIVE" && (
              <WorkOrderForm assetId={asset.id} />
            )}
            {asset.workOrders.length ? (
              <div className={styles.stack} style={{ marginTop: 18 }}>
                {asset.workOrders.map(({ workOrder }) => {
                  const nextByStatus: Record<string, string[]> = {
                    PLANNED: ["ASSIGNED", "CANCELLED"],
                    ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
                    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
                    COMPLETED: ["VERIFIED"],
                    VERIFIED: [],
                    CANCELLED: [],
                  };
                  const nextStatuses = (
                    nextByStatus[workOrder.status] ?? []
                  ).filter((next) =>
                    next === "VERIFIED" ? canReview : canMaintain,
                  );
                  return (
                    <article key={workOrder.id}>
                      <div className={styles.recordMeta}>
                        <strong>
                          {workOrder.workOrderCode} · {label(workOrder.status)}
                        </strong>
                        <span>
                          {workOrder.title} · {label(workOrder.priority)}
                        </span>
                      </div>
                      {workOrder.description && (
                        <p className={styles.muted}>{workOrder.description}</p>
                      )}
                      <p className={styles.muted}>
                        Created by {workOrder.createdBy.displayName}
                        {workOrder.assignee
                          ? ` · Assigned to ${workOrder.assignee.displayName}`
                          : ""}
                      </p>
                      {workOrder.events.length > 0 && (
                        <ol className={styles.history}>
                          {workOrder.events.map((event) => (
                            <li key={event.id}>
                              <strong>
                                {event.fromStatus
                                  ? label(event.fromStatus)
                                  : "Created"}{" "}
                                → {label(event.toStatus)}
                              </strong>
                              <span>
                                {dateLabel(event.occurredAt)} ·{" "}
                                {event.actor.displayName}
                              </span>
                              {event.reason && <p>{event.reason}</p>}
                            </li>
                          ))}
                        </ol>
                      )}
                      {nextStatuses.length > 0 && (
                        <WorkOrderStatusForm
                          workOrderId={workOrder.id}
                          nextStatuses={nextStatuses}
                          assignees={maintenanceStaff}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            ) : !canMaintain ? (
              <p className={styles.muted}>No work orders have been created.</p>
            ) : null}
          </section>
        </div>

        <aside className={styles.stack}>
          <section className={styles.panel}>
            <h2>Lifecycle history</h2>
            {lifecycleEvents.length ? (
              <ol className={styles.history}>
                {lifecycleEvents.map((event) => (
                  <li key={event.id}>
                    <strong>{label(event.type)}</strong>
                    <span>
                      {dateLabel(event.occurredAt)} · {event.actor.displayName}
                    </span>
                    {event.fromStage !== event.toStage &&
                      (event.fromStage || event.toStage) && (
                        <span>
                          {event.fromStage ? label(event.fromStage) : "Start"} →{" "}
                          {event.toStage ? label(event.toStage) : "—"}
                        </span>
                      )}
                    {event.reason && <p>{event.reason}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.muted}>No lifecycle events recorded.</p>
            )}
            {asset.roadSegment?.statusEvents.length ? (
              <>
                <hr className={styles.sectionDivider} />
                <p className={styles.eyebrow}>Road workflow history</p>
                <ol className={styles.history}>
                  {asset.roadSegment.statusEvents.map((event) => (
                    <li key={event.id}>
                      <strong>
                        {event.fromStatus ? label(event.fromStatus) : "Created"}{" "}
                        → {label(event.toStatus)}
                      </strong>
                      <span>
                        {dateLabel(event.occurredAt)} ·{" "}
                        {event.actor.displayName}
                      </span>
                      {event.reason && <p>{event.reason}</p>}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </section>
          <section className={styles.panel}>
            <h2>Evidence</h2>
            <p className={styles.muted}>
              {asset.evidence.length} evidence item(s) linked.
            </p>
            <p className={styles.fieldNote}>
              File upload is not yet available in this prototype.
            </p>
          </section>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
