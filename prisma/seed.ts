import { getAdminPrisma } from "./admin-client";

const demoRoles = [
  {
    envKey: "DEMO_SUBMITTER_CLERK_USER_ID",
    role: "SUBMITTER",
    displayName: "Demo Submitter",
  },
  {
    envKey: "DEMO_VERIFIER_CLERK_USER_ID",
    role: "VERIFIER",
    displayName: "Demo Verifier",
  },
  {
    envKey: "DEMO_INSPECTOR_CLERK_USER_ID",
    role: "INSPECTOR",
    displayName: "Demo Inspector",
  },
  {
    envKey: "DEMO_MAINTENANCE_CLERK_USER_ID",
    role: "MAINTENANCE_OFFICER",
    displayName: "Demo Maintenance Officer",
  },
  {
    envKey: "DEMO_PLANNER_CLERK_USER_ID",
    role: "PLANNER",
    displayName: "Demo Planner",
  },
] as const;

let prisma: ReturnType<typeof getAdminPrisma> | undefined;

async function main() {
  prisma = getAdminPrisma();
  const department = await prisma.department.upsert({
    where: { code: "PUBLIC_WORKS_DEMO" },
    update: { name: "Public Works Department", jurisdiction: "Demo district" },
    create: {
      code: "PUBLIC_WORKS_DEMO",
      name: "Public Works Department",
      jurisdiction: "Demo district",
    },
  });

  let provisioned = 0;

  for (const demoRole of demoRoles) {
    const clerkUserId = process.env[demoRole.envKey];
    if (!clerkUserId) continue;

    const profile = await prisma.userProfile.upsert({
      where: { clerkUserId },
      update: { displayName: demoRole.displayName, active: true },
      create: {
        clerkUserId,
        displayName: demoRole.displayName,
        active: true,
      },
    });

    await prisma.roleAssignment.upsert({
      where: {
        userId_departmentId_role: {
          userId: profile.id,
          departmentId: department.id,
          role: demoRole.role,
        },
      },
      update: { active: true },
      create: {
        userId: profile.id,
        departmentId: department.id,
        role: demoRole.role,
        active: true,
      },
    });
    provisioned += 1;
  }

  console.info(
    `Seeded demo department; provisioned ${provisioned} role assignment(s).`,
  );
  if (provisioned === 0) {
    console.info(
      "Set DEMO_*_CLERK_USER_ID values to provision Clerk users for the demo.",
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
