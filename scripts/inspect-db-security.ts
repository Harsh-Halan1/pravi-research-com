import { config as loadEnv } from "dotenv";
import { getPrisma } from "../src/lib/prisma";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const prisma = getPrisma();
let hadInspectionError = false;
type DbError = { meta?: { code?: unknown; message?: unknown } };

async function inspectStep<T>(name: string, operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    hadInspectionError = true;
    const dbError = error as DbError;
    const pgCode =
      typeof dbError.meta?.code === "string" ? dbError.meta.code : undefined;
    const message =
      typeof dbError.meta?.message === "string"
        ? dbError.meta.message
        : undefined;
    console.error(
      `Read-only database check failed at ${name}.`,
      pgCode ? `PostgreSQL code: ${pgCode}.` : "",
      message ? `Database message: ${message}` : "",
    );
    return null;
  }
}

async function main() {
  const connection = await inspectStep(
    "runtime role",
    () =>
      prisma.$queryRaw<
        Array<{
          currentSchema: string | null;
          currentRole: string;
          isSuperuser: boolean;
          bypassRls: boolean;
        }>
      >`
      SELECT
        current_schema()::text AS "currentSchema",
        current_user::text AS "currentRole",
        coalesce(role.rolsuper, false) AS "isSuperuser",
        coalesce(role.rolbypassrls, false) AS "bypassRls"
      FROM (SELECT 1) AS seed
      LEFT JOIN pg_roles AS role ON role.rolname = current_user
    `,
  );

  const appObjects = await inspectStep(
    "application table locations",
    () =>
      prisma.$queryRaw<Array<{ schemaName: string; objectCount: bigint }>>`
      SELECT table_schema::text AS "schemaName", count(*) AS "objectCount"
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'pravi')
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      GROUP BY table_schema
      ORDER BY table_schema
    `,
  );

  const rowSecurity = await inspectStep(
    "row security flags",
    () =>
      prisma.$queryRaw<
        Array<{
          tableName: string;
          rlsEnabled: boolean;
          rlsForced: boolean;
        }>
      >`
      SELECT
        relation.relname::text AS "tableName",
        relation.relrowsecurity AS "rlsEnabled",
        relation.relforcerowsecurity AS "rlsForced"
      FROM pg_catalog.pg_class AS relation
      JOIN pg_catalog.pg_namespace AS namespace
        ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'pravi'
        AND relation.relkind IN ('r', 'p')
      ORDER BY relation.relname
    `,
  );

  console.log(
    JSON.stringify(
      {
        connection: connection?.[0] ?? null,
        applicationTablesBySchema:
          appObjects?.map((row) => ({
            schema: row.schemaName,
            count: Number(row.objectCount),
          })) ?? null,
        rowSecurity: rowSecurity ?? null,
      },
      null,
      2,
    ),
  );
  if (hadInspectionError) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    const safeError = error as { name?: unknown };
    console.error(
      "Database inspection failed.",
      typeof safeError.name === "string" ? `Type: ${safeError.name}` : "",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
