-- Shared cross-category lifecycle reporting and road-specific workflow history.

-- Stop before changing schema if legacy free-form evidence visibility values
-- cannot be represented by the controlled enum without losing meaning.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."Evidence"
    WHERE "visibility" NOT IN ('INTERNAL', 'RESTRICTED', 'PUBLIC_APPROVED')
  ) THEN
    RAISE EXCEPTION 'Evidence.visibility contains values outside the supported enum; normalize them before applying this migration.';
  END IF;
END $$;

CREATE TYPE "public"."LifecycleStage" AS ENUM (
  'PLANNING_ACQUISITION',
  'REGISTRATION',
  'OWNERSHIP_LOCATION_ASSIGNMENT',
  'INSPECTION',
  'CONDITION_RISK_ASSESSMENT',
  'MAINTENANCE_REPAIR',
  'IMPROVEMENT_UPGRADE',
  'TRANSFER',
  'DECOMMISSIONED'
);

CREATE TYPE "public"."RoadSegmentStatus" AS ENUM (
  'DRAFT',
  'PENDING_VERIFICATION',
  'NEEDS_CHANGES',
  'VERIFIED'
);

CREATE TYPE "public"."EvidenceVisibility" AS ENUM (
  'INTERNAL',
  'RESTRICTED',
  'PUBLIC_APPROVED'
);

ALTER TYPE "public"."LifecycleEventType" ADD VALUE IF NOT EXISTS 'ASSET_TRANSFERRED';
ALTER TYPE "public"."LifecycleEventType" ADD VALUE IF NOT EXISTS 'ASSET_DECOMMISSIONED';

ALTER TABLE "public"."Asset"
  ADD COLUMN "lifecycleStage" "public"."LifecycleStage" NOT NULL DEFAULT 'REGISTRATION',
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6);

-- Preserve the meaning of existing shared statuses in the new lifecycle stage.
UPDATE "public"."Asset" AS asset
SET "lifecycleStage" = CASE
  WHEN asset."status" = 'RETIRED' THEN 'DECOMMISSIONED'::"public"."LifecycleStage"
  WHEN asset."status" = 'ACTIVE' AND EXISTS (
    SELECT 1
    FROM "public"."WorkOrderAsset" AS link
    JOIN "public"."WorkOrder" AS work ON work."id" = link."workOrderId"
    WHERE link."assetId" = asset."id"
      AND work."status" IN ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
  ) THEN 'MAINTENANCE_REPAIR'::"public"."LifecycleStage"
  WHEN asset."status" = 'ACTIVE' AND asset."currentCondition" <> 'UNKNOWN'
    THEN 'CONDITION_RISK_ASSESSMENT'::"public"."LifecycleStage"
  WHEN asset."status" = 'ACTIVE'
    THEN 'OWNERSHIP_LOCATION_ASSIGNMENT'::"public"."LifecycleStage"
  ELSE 'REGISTRATION'::"public"."LifecycleStage"
END;

CREATE INDEX "Asset_lifecycleStage_idx" ON "public"."Asset"("lifecycleStage");

ALTER TABLE "public"."RoadSegment"
  ADD COLUMN "workflowStatus" "public"."RoadSegmentStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "public"."RoadSegment" AS road
SET "workflowStatus" = CASE asset."status"
  WHEN 'PENDING_VERIFICATION' THEN 'PENDING_VERIFICATION'::"public"."RoadSegmentStatus"
  WHEN 'NEEDS_CHANGES' THEN 'NEEDS_CHANGES'::"public"."RoadSegmentStatus"
  WHEN 'ACTIVE' THEN 'VERIFIED'::"public"."RoadSegmentStatus"
  WHEN 'RETIRED' THEN 'VERIFIED'::"public"."RoadSegmentStatus"
  ELSE 'DRAFT'::"public"."RoadSegmentStatus"
END
FROM "public"."Asset" AS asset
WHERE asset."id" = road."assetId";

ALTER TABLE "public"."LifecycleEvent"
  ADD COLUMN "fromStage" "public"."LifecycleStage",
  ADD COLUMN "toStage" "public"."LifecycleStage";

CREATE TABLE "public"."RoadSegmentStatusEvent" (
  "id" TEXT NOT NULL,
  "roadSegmentId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "fromStatus" "public"."RoadSegmentStatus",
  "toStatus" "public"."RoadSegmentStatus" NOT NULL,
  "reason" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoadSegmentStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoadSegmentStatusEvent_roadSegmentId_occurredAt_idx"
  ON "public"."RoadSegmentStatusEvent"("roadSegmentId", "occurredAt");
CREATE INDEX "RoadSegmentStatusEvent_actorId_occurredAt_idx"
  ON "public"."RoadSegmentStatusEvent"("actorId", "occurredAt");

ALTER TABLE "public"."RoadSegmentStatusEvent"
  ADD CONSTRAINT "RoadSegmentStatusEvent_roadSegmentId_fkey"
    FOREIGN KEY ("roadSegmentId") REFERENCES "public"."RoadSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "RoadSegmentStatusEvent_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."Evidence" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "public"."Evidence"
  ALTER COLUMN "visibility" TYPE "public"."EvidenceVisibility"
  USING "visibility"::"public"."EvidenceVisibility";
ALTER TABLE "public"."Evidence"
  ALTER COLUMN "visibility" SET DEFAULT 'INTERNAL';

ALTER TABLE "public"."Asset"
  ADD CONSTRAINT "Asset_latitude_range" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "Asset_longitude_range" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
  ADD CONSTRAINT "Asset_location_coordinate_pair" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));
