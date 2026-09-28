import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { hasAnyRole, requireUserProfile } from "@/lib/auth";
import { withUserDbContext } from "@/lib/prisma";
import { type AssetItem, AssetTable } from "./asset-table";
import styles from "./assets.module.css";

function humanizeRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const result = await requireUserProfile();
  if (result.kind !== "active" || !result.profile.roleAssignments.length) {
    return (
      <main className={styles.page}>
        <header className={styles.topline}>
          <Link className={styles.brand} href="/dashboard">
            PRAVI · ASSET INVENTORY
          </Link>
        </header>
        <section className={styles.content}>
          <div className={styles.empty}>
            Your account needs an active department role before you can access
            the asset register.
          </div>
        </section>
      </main>
    );
  }

  const { profile } = result;
  const params = await searchParams;

  const assignments = [...profile.roleAssignments].sort(
    (left, right) =>
      left.department.name.localeCompare(right.department.name) ||
      left.role.localeCompare(right.role),
  );
  const departmentName = [
    ...new Set(assignments.map((assignment) => assignment.department.name)),
  ].join(" · ");
  const roleLabel = [
    ...new Set(assignments.map((assignment) => humanizeRole(assignment.role))),
  ].join(" · ");
  const departmentIds = [
    ...new Set(assignments.map((item) => item.departmentId)),
  ];

  const [assets, pendingVerificationCount] = await withUserDbContext(
    profile.clerkUserId,
    (prisma) =>
      Promise.all([
        prisma.asset.findMany({
          where: { departmentId: { in: departmentIds } },
          include: { department: true, roadSegment: true },
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        prisma.roadSegment.count({
          where: {
            workflowStatus: "PENDING_VERIFICATION",
            asset: { departmentId: { in: departmentIds } },
          },
        }),
      ]),
  );

  const canRegister = hasAnyRole(profile, ["SUBMITTER", "ADMIN"]);
  const isQueueView = params.status === "PENDING_VERIFICATION";

  const mappedAssets: AssetItem[] = assets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    assetType: asset.assetType,
    status: asset.status,
    lifecycleStage: asset.lifecycleStage,
    currentCondition: asset.currentCondition,
    updatedAt: asset.updatedAt.toISOString(),
    departmentName: asset.department.name,
    roadSegment: asset.roadSegment
      ? {
          routeName: asset.roadSegment.routeName,
          externalRoadId: asset.roadSegment.externalRoadId,
          startMarker: asset.roadSegment.startMarker,
          endMarker: asset.roadSegment.endMarker,
          lengthKm: asset.roadSegment.lengthKm.toString(),
          surfaceType: asset.roadSegment.surfaceType,
          workflowStatus: asset.roadSegment.workflowStatus,
        }
      : null,
  }));

  return (
    <WorkspaceShell
      departmentName={departmentName}
      displayName={profile.displayName}
      roleLabel={roleLabel}
      activeNav={isQueueView ? "queue" : "assets"}
      pendingVerificationCount={pendingVerificationCount}
      canRegister={canRegister}
      breadcrumbs={[
        { label: departmentName, href: "/dashboard" },
        {
          label: isQueueView ? "Verification queue" : "Asset register",
        },
      ]}
      topActions={
        canRegister ? (
          <Link
            href="/assets/new"
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              background: "#176b4a",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>+</span> Register road segment
          </Link>
        ) : null
      }
    >
      <div style={{ marginBottom: 24 }}>
        <p className={styles.eyebrow}>
          {isQueueView
            ? "Technical triage & verification"
            : "Sovereign infrastructure inventory"}
        </p>
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: "Manrope, sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#15231e",
          }}
        >
          {isQueueView ? "Verification Queue" : "Infrastructure Assets"}
        </h1>
        <p style={{ margin: 0, color: "#637269", fontSize: 13 }}>
          {isQueueView
            ? "Submissions awaiting independent engineering review and sign-off in your jurisdiction."
            : "Comprehensive registry of road segments and fixed assets within your assigned departments."}
        </p>
      </div>

      <AssetTable
        assets={mappedAssets}
        canRegister={canRegister}
        departmentName={departmentName}
        initialStatus={params.status || "ALL"}
      />
    </WorkspaceShell>
  );
}
