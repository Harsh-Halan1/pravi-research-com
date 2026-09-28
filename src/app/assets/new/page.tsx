import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { hasAnyRole, requireUserProfile } from "@/lib/auth";
import { RoadRegistrationForm } from "../asset-forms";
import styles from "../assets.module.css";

function humanizeRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function NewRoadSegmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
            Your account needs an active department role before you can register
            an asset.
          </div>
        </section>
      </main>
    );
  }

  const { profile } = result;
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

  const departments = profile.roleAssignments
    .filter((assignment) =>
      hasAnyRole(profile, ["SUBMITTER", "ADMIN"], assignment.departmentId),
    )
    .map((assignment) => ({
      id: assignment.departmentId,
      name: assignment.department.name,
    }))
    .filter(
      (department, index, all) =>
        all.findIndex((candidate) => candidate.id === department.id) === index,
    );

  const params = await searchParams;

  if (!departments.length) {
    return (
      <WorkspaceShell
        departmentName={departmentName}
        displayName={profile.displayName}
        roleLabel={roleLabel}
        activeNav="new"
        canRegister={false}
        breadcrumbs={[
          { label: departmentName, href: "/dashboard" },
          { label: "Asset register", href: "/assets" },
          { label: "Register road" },
        ]}
      >
        <div className={styles.empty}>
          An active submitter or administrator assignment is required to
          register a road segment.
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      departmentName={departmentName}
      displayName={profile.displayName}
      roleLabel={roleLabel}
      activeNav="new"
      canRegister={true}
      breadcrumbs={[
        { label: departmentName, href: "/dashboard" },
        { label: "Asset register", href: "/assets" },
        { label: "Register road segment" },
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
      <div style={{ maxWidth: 880 }}>
        <p className={styles.eyebrow}>Road network · New entry</p>
        <h1
          style={{
            margin: "0 0 8px",
            fontFamily: "Manrope, sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#15231e",
          }}
        >
          Register a Road Segment
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            color: "#637269",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Enter the statutory asset details and verified spatial extent.
          Submitting creates an immutable provenance record and routes it to the
          department technical verification queue.
        </p>

        <div className={styles.panel}>
          {params.error && (
            <p className={styles.formError} role="alert">
              {params.error}
            </p>
          )}
          <RoadRegistrationForm departments={departments} />
        </div>
      </div>
    </WorkspaceShell>
  );
}
