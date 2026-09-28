-- Move application-owned objects out of Supabase's default public schema.
-- Prisma's migration ledger remains in public so the already-applied migration
-- history continues to be recognized by Prisma Migrate.
CREATE SCHEMA IF NOT EXISTS "pravi";
COMMENT ON SCHEMA "pravi" IS 'Pravi application data; keep this schema out of Supabase Data API exposed schemas unless explicitly required.';

REVOKE ALL ON SCHEMA "pravi" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA "pravi" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA "pravi" FROM authenticated;
  END IF;
END $$;

ALTER TYPE "public"."AssetType" SET SCHEMA "pravi";
ALTER TYPE "public"."AssetStatus" SET SCHEMA "pravi";
ALTER TYPE "public"."LifecycleStage" SET SCHEMA "pravi";
ALTER TYPE "public"."RoadSegmentStatus" SET SCHEMA "pravi";
ALTER TYPE "public"."EvidenceVisibility" SET SCHEMA "pravi";
ALTER TYPE "public"."ConditionRating" SET SCHEMA "pravi";
ALTER TYPE "public"."UserRole" SET SCHEMA "pravi";
ALTER TYPE "public"."LifecycleEventType" SET SCHEMA "pravi";
ALTER TYPE "public"."InspectionStatus" SET SCHEMA "pravi";
ALTER TYPE "public"."FindingSeverity" SET SCHEMA "pravi";
ALTER TYPE "public"."WorkOrderStatus" SET SCHEMA "pravi";
ALTER TYPE "public"."WorkPriority" SET SCHEMA "pravi";

ALTER TABLE "public"."Department" SET SCHEMA "pravi";
ALTER TABLE "public"."UserProfile" SET SCHEMA "pravi";
ALTER TABLE "public"."RoleAssignment" SET SCHEMA "pravi";
ALTER TABLE "public"."Asset" SET SCHEMA "pravi";
ALTER TABLE "public"."RoadSegment" SET SCHEMA "pravi";
ALTER TABLE "public"."RoadSegmentStatusEvent" SET SCHEMA "pravi";
ALTER TABLE "public"."LifecycleEvent" SET SCHEMA "pravi";
ALTER TABLE "public"."Inspection" SET SCHEMA "pravi";
ALTER TABLE "public"."InspectionEvent" SET SCHEMA "pravi";
ALTER TABLE "public"."InspectionFinding" SET SCHEMA "pravi";
ALTER TABLE "public"."WorkOrder" SET SCHEMA "pravi";
ALTER TABLE "public"."WorkOrderAsset" SET SCHEMA "pravi";
ALTER TABLE "public"."WorkOrderEvent" SET SCHEMA "pravi";
ALTER TABLE "public"."Evidence" SET SCHEMA "pravi";
ALTER TABLE "public"."AuditEvent" SET SCHEMA "pravi";
