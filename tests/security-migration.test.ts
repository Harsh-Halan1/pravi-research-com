import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260928000500_runtime_role_and_department_rls/migration.sql",
  "utf8",
);
const models = Array.from(
  schema.matchAll(/^model\s+(\w+)\s+\{/gm),
  (match) => match[1],
);

test("RLS migration covers every Prisma application model", () => {
  assert.ok(models.length > 0);
  for (const model of models) {
    assert.match(
      migration,
      new RegExp(`ALTER TABLE pravi\\."${model}" ENABLE ROW LEVEL SECURITY`),
      `${model} must enable row security`,
    );
    assert.match(
      migration,
      new RegExp(`ALTER TABLE pravi\\."${model}" FORCE ROW LEVEL SECURITY`),
      `${model} must force row security for table owners`,
    );
    assert.match(
      migration,
      new RegExp(`CREATE POLICY [\\w_]+ ON pravi\\."${model}"`),
      `${model} must have an explicit policy`,
    );
  }
});

test("runtime role cannot bypass row security or use public Data API access", () => {
  assert.match(migration, /NOBYPASSRLS/);
  assert.match(migration, /CREATE ROLE pravi_app NOLOGIN NOBYPASSRLS/);
  assert.doesNotMatch(migration, /\bALTER\s+ROLE\b/i);
  assert.match(
    migration,
    /runtime_role\.rolcanlogin[\s\S]*runtime_role\.rolbypassrls/,
  );
  assert.match(
    migration,
    /REVOKE ALL ON SCHEMA pravi FROM anon, authenticated/,
  );
  assert.match(
    migration,
    /REVOKE ALL ON ALL TABLES IN SCHEMA pravi FROM PUBLIC, anon, authenticated/,
  );
});

test("history tables grant append and read access without update/delete", () => {
  const appendOnlyTables = [
    "RoadSegmentStatusEvent",
    "LifecycleEvent",
    "InspectionEvent",
    "WorkOrderEvent",
    "AuditEvent",
  ];
  for (const table of appendOnlyTables) {
    assert.match(
      migration,
      new RegExp(`CREATE POLICY \\w+ ON pravi\\."${table}"`),
      `${table} must have an explicit policy`,
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`GRANT [^;]*\\b(?:UPDATE|DELETE)\\b[^;]*${table}`),
      `${table} must remain append-only for the application role`,
    );
  }
});
