import { UserButton } from "@clerk/nextjs";
import DashboardOverview from "@/components/dashboard-overview";
import { hasAnyRole, requireUserProfile } from "@/lib/auth";
import { withUserDbContext } from "@/lib/prisma";

function humanizeRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const result = await requireUserProfile();

  if (result.kind !== "active" || result.profile.roleAssignments.length === 0) {
    return (
      <main className="access-pending">
        <div className="access-card">
          <div className="pending-mark">P</div>
          <p className="pending-eyebrow">PRAVI · PUBLIC ASSET REGISTRY</p>
          <h1>
            {result.kind === "inactive"
              ? "Your workspace access is inactive."
              : "Your workspace access is being set up."}
          </h1>
          <p>
            {result.kind === "inactive"
              ? "Your account has been deactivated for this workspace. Contact your administrator if you believe this is a mistake."
              : "Your sign-in is working, but an administrator still needs to assign your department and role before you can view government asset data."}
          </p>
          <div className="pending-user">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </main>
    );
  }

  const assignments = [...result.profile.roleAssignments].sort(
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
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    roadSegmentCount,
    pendingVerificationCount,
    recentInspectionCount,
    openWorkOrderCount,
    conditionGroups,
    verificationQueue,
    recentAssets,
  ] = await withUserDbContext(result.profile.clerkUserId, (prisma) =>
    Promise.all([
      prisma.asset.count({
        where: {
          departmentId: { in: departmentIds },
          assetType: "ROAD_SEGMENT",
        },
      }),
      prisma.roadSegment.count({
        where: {
          workflowStatus: "PENDING_VERIFICATION",
          asset: { departmentId: { in: departmentIds } },
        },
      }),
      prisma.inspection.count({
        where: {
          inspectedAt: { gte: since },
          asset: {
            departmentId: { in: departmentIds },
            assetType: "ROAD_SEGMENT",
          },
        },
      }),
      prisma.workOrder.count({
        where: {
          status: { notIn: ["COMPLETED", "VERIFIED", "CANCELLED"] },
          assets: {
            some: {
              asset: {
                departmentId: { in: departmentIds },
                assetType: "ROAD_SEGMENT",
              },
            },
          },
        },
      }),
      prisma.asset.groupBy({
        by: ["currentCondition"],
        where: {
          departmentId: { in: departmentIds },
          assetType: "ROAD_SEGMENT",
        },
        _count: { _all: true },
      }),
      prisma.roadSegment.findMany({
        where: {
          workflowStatus: "PENDING_VERIFICATION",
          asset: { departmentId: { in: departmentIds } },
        },
        include: { asset: true },
        orderBy: { asset: { updatedAt: "asc" } },
        take: 4,
      }),
      prisma.asset.findMany({
        where: {
          departmentId: { in: departmentIds },
          assetType: "ROAD_SEGMENT",
        },
        include: { department: true, roadSegment: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]),
  );

  const canRegister = hasAnyRole(result.profile, ["SUBMITTER", "ADMIN"]);
  const conditionCounts = Object.fromEntries(
    conditionGroups.map((group) => [group.currentCondition, group._count._all]),
  );
  const conditionTotal = Object.values(conditionCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const conditionData = ["GOOD", "FAIR", "POOR", "CRITICAL", "UNKNOWN"].map(
    (condition) => ({
      label: condition.charAt(0) + condition.slice(1).toLowerCase(),
      count: conditionCounts[condition] ?? 0,
      percent: conditionTotal
        ? Math.round(((conditionCounts[condition] ?? 0) / conditionTotal) * 100)
        : 0,
    }),
  );
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <output className="demo-data-banner">
        Prototype workspace · scoped data from assigned departments; records may
        be synthetic
      </output>
      <DashboardOverview
        displayName={result.profile.displayName}
        departmentName={departmentName}
        roleLabel={roleLabel}
        todayLabel={todayLabel}
        canRegister={canRegister}
        metrics={{
          roadSegmentCount,
          pendingVerificationCount,
          recentInspectionCount,
          openWorkOrderCount,
        }}
        conditionData={conditionData}
        verificationQueue={verificationQueue.map(({ asset, ...road }) => ({
          id: asset.id,
          assetCode: asset.assetCode,
          name: asset.name,
          routeName: road.routeName,
          submittedAt: asset.updatedAt.toISOString(),
        }))}
        recentAssets={recentAssets.map((asset) => ({
          id: asset.id,
          assetCode: asset.assetCode,
          name: asset.name,
          departmentName: asset.department.name,
          condition: asset.currentCondition,
          status: asset.roadSegment?.workflowStatus ?? asset.status,
          routeName: asset.roadSegment?.routeName ?? null,
          lengthKm: asset.roadSegment?.lengthKm.toString() ?? null,
        }))}
      />
      <div className="account-button">
        <UserButton afterSignOutUrl="/" />
      </div>
    </>
  );
}
