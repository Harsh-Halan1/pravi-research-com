import { auth } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { withUserDbContext } from "@/lib/prisma";
import {
  hasAnyRoleInDepartment,
  canAccessDepartment as isDepartmentAccessible,
} from "@/lib/workflow-policies";

export async function requireUserProfile() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await withUserDbContext(userId, (transaction) =>
    transaction.userProfile.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        clerkUserId: true,
        displayName: true,
        active: true,
        roleAssignments: {
          where: { active: true },
          include: { department: true },
        },
      },
    }),
  );

  if (!profile) {
    return { kind: "pending" as const, clerkUserId: userId };
  }

  if (!profile.active)
    return { kind: "inactive" as const, clerkUserId: userId };

  return { kind: "active" as const, profile };
}

export type ActiveProfile = Extract<
  Awaited<ReturnType<typeof requireUserProfile>>,
  { kind: "active" }
>["profile"];

export type AppRole = UserRole;

export function hasRole(
  profile: ActiveProfile,
  role: AppRole,
  departmentId?: string,
) {
  return hasAnyRole(profile, [role], departmentId);
}

export function hasAnyRole(
  profile: ActiveProfile,
  roles: readonly AppRole[],
  departmentId?: string,
) {
  return departmentId
    ? hasAnyRoleInDepartment(profile.roleAssignments, departmentId, roles)
    : profile.roleAssignments.some((assignment) =>
        roles.includes(assignment.role),
      );
}

export function canAccessDepartment(
  profile: ActiveProfile,
  departmentId: string,
) {
  return isDepartmentAccessible(profile.roleAssignments, departmentId);
}

export async function getRoleContext(roles: AppRole[], departmentId?: string) {
  const result = await requireUserProfile();
  if (result.kind !== "active") return null;

  const assignment = result.profile.roleAssignments.find(
    (candidate) =>
      roles.includes(candidate.role) &&
      (!departmentId || candidate.departmentId === departmentId),
  );

  if (!assignment) return null;
  return { profile: result.profile, assignment };
}
