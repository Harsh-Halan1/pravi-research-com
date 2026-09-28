-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('ROAD_SEGMENT');

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'NEEDS_CHANGES', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "public"."ConditionRating" AS ENUM ('UNKNOWN', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'PLANNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."LifecycleEventType" AS ENUM ('ASSET_CREATED', 'ASSET_SUBMITTED', 'ASSET_APPROVED', 'ASSET_RETURNED', 'ASSET_UPDATED', 'INSPECTION_RECORDED', 'WORK_ORDER_CREATED', 'WORK_ORDER_UPDATED', 'WORK_COMPLETED', 'ASSET_RETIRED');

-- CreateEnum
CREATE TYPE "public"."InspectionStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'NEEDS_CHANGES');

-- CreateEnum
CREATE TYPE "public"."FindingSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."WorkOrderStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WorkPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" "public"."AssetType" NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentCondition" "public"."ConditionRating" NOT NULL DEFAULT 'UNKNOWN',
    "departmentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoadSegment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "externalRoadId" TEXT,
    "startMarker" TEXT NOT NULL,
    "endMarker" TEXT NOT NULL,
    "lengthKm" DECIMAL(9,3) NOT NULL,
    "surfaceType" TEXT NOT NULL,
    "startLatitude" DECIMAL(9,6),
    "startLongitude" DECIMAL(9,6),
    "endLatitude" DECIMAL(9,6),
    "endLongitude" DECIMAL(9,6),

    CONSTRAINT "RoadSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LifecycleEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "public"."LifecycleEventType" NOT NULL,
    "fromStatus" "public"."AssetStatus",
    "toStatus" "public"."AssetStatus",
    "reason" TEXT,
    "details" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inspection" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "condition" "public"."ConditionRating" NOT NULL,
    "notes" TEXT,
    "status" "public"."InspectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InspectionEvent" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromStatus" "public"."InspectionStatus",
    "toStatus" "public"."InspectionStatus" NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InspectionFinding" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "public"."FindingSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "recommendedAction" TEXT,
    "startMarker" TEXT,
    "endMarker" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrder" (
    "id" TEXT NOT NULL,
    "workOrderCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "priority" "public"."WorkPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."WorkOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "startMarker" TEXT,
    "endMarker" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "estimatedCost" DECIMAL(14,2),
    "actualCost" DECIMAL(14,2),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrderEvent" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromStatus" "public"."WorkOrderStatus",
    "toStatus" "public"."WorkOrderStatus" NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrderAsset" (
    "workOrderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderAsset_pkey" PRIMARY KEY ("workOrderId","assetId")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "capturedAt" TIMESTAMP(3),
    "capturedLatitude" DECIMAL(9,6),
    "capturedLongitude" DECIMAL(9,6),
    "uploadedById" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "inspectionId" TEXT,
    "findingId" TEXT,
    "workOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "assetId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "changeSummary" JSONB,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "public"."Department"("code");

-- CreateIndex
CREATE INDEX "Department_parentId_idx" ON "public"."Department"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkUserId_key" ON "public"."UserProfile"("clerkUserId");

-- CreateIndex
CREATE INDEX "RoleAssignment_departmentId_role_active_idx" ON "public"."RoleAssignment"("departmentId", "role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_departmentId_role_key" ON "public"."RoleAssignment"("userId", "departmentId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "public"."Asset"("assetCode");

-- CreateIndex
CREATE INDEX "Asset_assetType_status_idx" ON "public"."Asset"("assetType", "status");

-- CreateIndex
CREATE INDEX "Asset_departmentId_status_idx" ON "public"."Asset"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Asset_currentCondition_idx" ON "public"."Asset"("currentCondition");

-- CreateIndex
CREATE UNIQUE INDEX "RoadSegment_assetId_key" ON "public"."RoadSegment"("assetId");

-- CreateIndex
CREATE INDEX "RoadSegment_routeName_idx" ON "public"."RoadSegment"("routeName");

-- CreateIndex
CREATE INDEX "RoadSegment_externalRoadId_idx" ON "public"."RoadSegment"("externalRoadId");

-- CreateIndex
CREATE INDEX "LifecycleEvent_assetId_occurredAt_idx" ON "public"."LifecycleEvent"("assetId", "occurredAt");

-- CreateIndex
CREATE INDEX "LifecycleEvent_actorId_occurredAt_idx" ON "public"."LifecycleEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "Inspection_assetId_inspectedAt_idx" ON "public"."Inspection"("assetId", "inspectedAt");

-- CreateIndex
CREATE INDEX "Inspection_status_inspectedAt_idx" ON "public"."Inspection"("status", "inspectedAt");

-- CreateIndex
CREATE INDEX "InspectionEvent_inspectionId_occurredAt_idx" ON "public"."InspectionEvent"("inspectionId", "occurredAt");

-- CreateIndex
CREATE INDEX "InspectionEvent_actorId_occurredAt_idx" ON "public"."InspectionEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "InspectionFinding_inspectionId_severity_idx" ON "public"."InspectionFinding"("inspectionId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderCode_key" ON "public"."WorkOrder"("workOrderCode");

-- CreateIndex
CREATE INDEX "WorkOrder_status_priority_idx" ON "public"."WorkOrder"("status", "priority");

-- CreateIndex
CREATE INDEX "WorkOrder_assigneeId_status_idx" ON "public"."WorkOrder"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "WorkOrderEvent_workOrderId_occurredAt_idx" ON "public"."WorkOrderEvent"("workOrderId", "occurredAt");

-- CreateIndex
CREATE INDEX "WorkOrderEvent_actorId_occurredAt_idx" ON "public"."WorkOrderEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "WorkOrderAsset_assetId_idx" ON "public"."WorkOrderAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_storageKey_key" ON "public"."Evidence"("storageKey");

-- CreateIndex
CREATE INDEX "Evidence_assetId_idx" ON "public"."Evidence"("assetId");

-- CreateIndex
CREATE INDEX "Evidence_inspectionId_idx" ON "public"."Evidence"("inspectionId");

-- CreateIndex
CREATE INDEX "Evidence_findingId_idx" ON "public"."Evidence"("findingId");

-- CreateIndex
CREATE INDEX "Evidence_workOrderId_idx" ON "public"."Evidence"("workOrderId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_occurredAt_idx" ON "public"."AuditEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_occurredAt_idx" ON "public"."AuditEvent"("targetType", "targetId", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LifecycleEvent" ADD CONSTRAINT "LifecycleEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LifecycleEvent" ADD CONSTRAINT "LifecycleEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inspection" ADD CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InspectionEvent" ADD CONSTRAINT "InspectionEvent_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "public"."Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InspectionEvent" ADD CONSTRAINT "InspectionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InspectionFinding" ADD CONSTRAINT "InspectionFinding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "public"."Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderEvent" ADD CONSTRAINT "WorkOrderEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderEvent" ADD CONSTRAINT "WorkOrderEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderAsset" ADD CONSTRAINT "WorkOrderAsset_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderAsset" ADD CONSTRAINT "WorkOrderAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "public"."Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "public"."InspectionFinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditEvent" ADD CONSTRAINT "AuditEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep structured road measurements within meaningful ranges.
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_lengthKm_positive" CHECK ("lengthKm" > 0);
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_startLatitude_range" CHECK ("startLatitude" IS NULL OR "startLatitude" BETWEEN -90 AND 90);
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_startLongitude_range" CHECK ("startLongitude" IS NULL OR "startLongitude" BETWEEN -180 AND 180);
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_endLatitude_range" CHECK ("endLatitude" IS NULL OR "endLatitude" BETWEEN -90 AND 90);
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_endLongitude_range" CHECK ("endLongitude" IS NULL OR "endLongitude" BETWEEN -180 AND 180);
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_start_coordinates_pair" CHECK (("startLatitude" IS NULL) = ("startLongitude" IS NULL));
ALTER TABLE "public"."RoadSegment" ADD CONSTRAINT "RoadSegment_end_coordinates_pair" CHECK (("endLatitude" IS NULL) = ("endLongitude" IS NULL));

-- Each evidence object belongs to one asset and at most one specific operational record.
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_single_operational_link" CHECK (num_nonnulls("inspectionId", "findingId", "workOrderId") <= 1);
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_size_positive" CHECK ("sizeBytes" > 0);

