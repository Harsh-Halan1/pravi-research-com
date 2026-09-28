"use server";

import { randomUUID } from "node:crypto";
import {
  AssetStatus,
  ConditionRating,
  FindingSeverity,
  InspectionStatus,
  LifecycleEventType,
  LifecycleStage,
  RoadSegmentStatus,
  WorkOrderStatus,
  WorkPriority,
} from "@prisma/client";
import { redirect } from "next/navigation";
import {
  type AppRole,
  canAccessDepartment,
  hasAnyRole,
  requireUserProfile,
} from "@/lib/auth";
import { withUserDbContext } from "@/lib/prisma";
import {
  canReviewRoadSubmission,
  canTransitionWorkOrder,
  stageAfterWorkOrderResolution,
  workOrderTransitionRequiresReason,
} from "@/lib/workflow-policies";

export type ActionState = { error?: string } | null;

class WorkflowConflict extends Error {}

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function numericValue(input: string) {
  if (!input) return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null && longitude === null) return true;
  return (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

async function getActiveProfile() {
  const result = await requireUserProfile();
  return result.kind === "active" ? result.profile : null;
}

function hasDepartmentRole(
  profile: NonNullable<Awaited<ReturnType<typeof getActiveProfile>>>,
  departmentId: string,
  roles: AppRole[],
) {
  return hasAnyRole(profile, roles, departmentId);
}

export async function registerRoadSegment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  if (!profile)
    return { error: "Your account is not active in this workspace." };

  const departmentId = value(formData, "departmentId");
  if (!hasDepartmentRole(profile, departmentId, ["SUBMITTER", "ADMIN"])) {
    return {
      error:
        "You do not have permission to register assets in that department.",
    };
  }

  const assetCode = value(formData, "assetCode").toUpperCase();
  const name = value(formData, "name");
  const routeName = value(formData, "routeName");
  const externalRoadId = value(formData, "externalRoadId") || null;
  const startMarker = value(formData, "startMarker");
  const endMarker = value(formData, "endMarker");
  const surfaceType = value(formData, "surfaceType");
  const lengthKm = numericValue(value(formData, "lengthKm"));
  const latitude = numericValue(value(formData, "latitude"));
  const longitude = numericValue(value(formData, "longitude"));
  const startLatitude = numericValue(value(formData, "startLatitude"));
  const startLongitude = numericValue(value(formData, "startLongitude"));
  const endLatitude = numericValue(value(formData, "endLatitude"));
  const endLongitude = numericValue(value(formData, "endLongitude"));

  if (
    !assetCode ||
    !name ||
    !routeName ||
    !startMarker ||
    !endMarker ||
    !surfaceType
  ) {
    return { error: "Complete all required asset and road-segment fields." };
  }
  if (lengthKm === null || !Number.isFinite(lengthKm) || lengthKm <= 0) {
    return { error: "Road length must be a positive number of kilometres." };
  }
  if (!validCoordinates(latitude, longitude)) {
    return {
      error:
        "Enter both representative coordinates within valid latitude/longitude ranges.",
    };
  }
  if (
    !validCoordinates(startLatitude, startLongitude) ||
    !validCoordinates(endLatitude, endLongitude)
  ) {
    return {
      error: "Each road endpoint needs a valid latitude and longitude pair.",
    };
  }

  try {
    const asset = await withUserDbContext(
      profile.clerkUserId,
      async (transaction) => {
        const created = await transaction.asset.create({
          data: {
            assetCode,
            name,
            assetType: "ROAD_SEGMENT",
            status: AssetStatus.DRAFT,
            lifecycleStage: LifecycleStage.REGISTRATION,
            latitude,
            longitude,
            departmentId,
            createdById: profile.id,
            roadSegment: {
              create: {
                routeName,
                externalRoadId,
                startMarker,
                endMarker,
                lengthKm,
                surfaceType,
                workflowStatus: RoadSegmentStatus.DRAFT,
                startLatitude,
                startLongitude,
                endLatitude,
                endLongitude,
              },
            },
            events: {
              create: {
                actorId: profile.id,
                type: LifecycleEventType.ASSET_CREATED,
                toStatus: AssetStatus.DRAFT,
                toStage: LifecycleStage.REGISTRATION,
                details: { category: "ROAD_SEGMENT" },
              },
            },
          },
          include: { roadSegment: true },
        });
        const roadSegmentId = created.roadSegment?.id;
        if (!roadSegmentId) {
          throw new Error("Road segment details were not created.");
        }

        await transaction.asset.update({
          where: { id: created.id },
          data: { status: AssetStatus.PENDING_VERIFICATION },
        });
        await transaction.roadSegment.update({
          where: { id: roadSegmentId },
          data: { workflowStatus: RoadSegmentStatus.PENDING_VERIFICATION },
        });
        await transaction.roadSegmentStatusEvent.create({
          data: {
            roadSegmentId,
            actorId: profile.id,
            toStatus: RoadSegmentStatus.DRAFT,
          },
        });
        await transaction.lifecycleEvent.create({
          data: {
            assetId: created.id,
            actorId: profile.id,
            type: LifecycleEventType.ASSET_SUBMITTED,
            fromStatus: AssetStatus.DRAFT,
            toStatus: AssetStatus.PENDING_VERIFICATION,
            fromStage: LifecycleStage.REGISTRATION,
            toStage: LifecycleStage.REGISTRATION,
          },
        });
        await transaction.roadSegmentStatusEvent.create({
          data: {
            roadSegmentId,
            actorId: profile.id,
            fromStatus: RoadSegmentStatus.DRAFT,
            toStatus: RoadSegmentStatus.PENDING_VERIFICATION,
          },
        });
        await transaction.auditEvent.create({
          data: {
            actorId: profile.id,
            assetId: created.id,
            action: "ROAD_SEGMENT_REGISTERED",
            targetType: "Asset",
            targetId: created.id,
            changeSummary: { assetCode, departmentId },
          },
        });
        return created;
      },
    );
    redirect(`/assets/${asset.id}?registered=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      error:
        "That asset code may already exist, or the record could not be saved. Check it and try again.",
    };
  }
}

export async function reviewRoadSegment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const assetId = value(formData, "assetId");
  const decision = value(formData, "decision");
  const reason = value(formData, "reason");
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (decision !== "approve" && decision !== "return") {
    return { error: "Choose approve or return for correction." };
  }
  if (decision === "return" && !reason) {
    return { error: "A reason is required when returning a record." };
  }

  const asset = await withUserDbContext(profile.clerkUserId, (transaction) =>
    transaction.asset.findUnique({
      where: { id: assetId },
      include: { roadSegment: true },
    }),
  );
  if (
    !asset?.roadSegment ||
    !hasDepartmentRole(profile, asset.departmentId, ["VERIFIER", "ADMIN"])
  ) {
    return { error: "You do not have permission to review this road segment." };
  }
  if (!canReviewRoadSubmission(asset.createdById, profile.id)) {
    return { error: "You cannot verify a road segment that you submitted." };
  }
  const roadSegment = asset.roadSegment;
  if (roadSegment.workflowStatus !== RoadSegmentStatus.PENDING_VERIFICATION) {
    return { error: "This road segment is no longer awaiting verification." };
  }

  const approved = decision === "approve";
  const nextRoadStatus = approved
    ? RoadSegmentStatus.VERIFIED
    : RoadSegmentStatus.NEEDS_CHANGES;
  const nextAssetStatus = approved
    ? AssetStatus.ACTIVE
    : AssetStatus.NEEDS_CHANGES;
  const nextStage = approved
    ? LifecycleStage.OWNERSHIP_LOCATION_ASSIGNMENT
    : asset.lifecycleStage;

  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const roadChanged = await transaction.roadSegment.updateMany({
        where: {
          id: roadSegment.id,
          workflowStatus: RoadSegmentStatus.PENDING_VERIFICATION,
        },
        data: { workflowStatus: nextRoadStatus },
      });
      if (roadChanged.count !== 1) {
        throw new WorkflowConflict("This road segment was already reviewed.");
      }
      const assetChanged = await transaction.asset.updateMany({
        where: { id: asset.id, status: asset.status },
        data: { status: nextAssetStatus, lifecycleStage: nextStage },
      });
      if (assetChanged.count !== 1) {
        throw new WorkflowConflict(
          "The asset changed while it was being reviewed.",
        );
      }
      await transaction.lifecycleEvent.create({
        data: {
          assetId: asset.id,
          actorId: profile.id,
          type: approved
            ? LifecycleEventType.ASSET_APPROVED
            : LifecycleEventType.ASSET_RETURNED,
          fromStatus: asset.status,
          toStatus: nextAssetStatus,
          fromStage: asset.lifecycleStage,
          toStage: nextStage,
          reason: reason || null,
        },
      });
      await transaction.roadSegmentStatusEvent.create({
        data: {
          roadSegmentId: roadSegment.id,
          actorId: profile.id,
          fromStatus: roadSegment.workflowStatus,
          toStatus: nextRoadStatus,
          reason: reason || null,
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId: asset.id,
          action: approved ? "ROAD_SEGMENT_APPROVED" : "ROAD_SEGMENT_RETURNED",
          targetType: "Asset",
          targetId: asset.id,
          changeSummary: {
            from: asset.status,
            to: nextAssetStatus,
            reason: reason || null,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof WorkflowConflict) return { error: error.message };
    throw error;
  }

  redirect(`/assets/${asset.id}?reviewed=1`);
}

export async function correctRoadSegment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const assetId = value(formData, "assetId");
  const name = value(formData, "name");
  const routeName = value(formData, "routeName");
  const externalRoadId = value(formData, "externalRoadId") || null;
  const startMarker = value(formData, "startMarker");
  const endMarker = value(formData, "endMarker");
  const surfaceType = value(formData, "surfaceType");
  const lengthKm = numericValue(value(formData, "lengthKm"));
  const latitude = numericValue(value(formData, "latitude"));
  const longitude = numericValue(value(formData, "longitude"));
  const startLatitude = numericValue(value(formData, "startLatitude"));
  const startLongitude = numericValue(value(formData, "startLongitude"));
  const endLatitude = numericValue(value(formData, "endLatitude"));
  const endLongitude = numericValue(value(formData, "endLongitude"));

  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (!name || !routeName || !startMarker || !endMarker || !surfaceType) {
    return { error: "Complete all required asset and road-segment fields." };
  }
  if (lengthKm === null || !Number.isFinite(lengthKm) || lengthKm <= 0) {
    return { error: "Road length must be a positive number of kilometres." };
  }
  if (!validCoordinates(latitude, longitude)) {
    return {
      error:
        "Enter both representative coordinates within valid latitude/longitude ranges.",
    };
  }
  if (
    !validCoordinates(startLatitude, startLongitude) ||
    !validCoordinates(endLatitude, endLongitude)
  ) {
    return {
      error: "Each road endpoint needs a valid latitude and longitude pair.",
    };
  }

  const asset = await withUserDbContext(profile.clerkUserId, (transaction) =>
    transaction.asset.findUnique({
      where: { id: assetId },
      include: { roadSegment: true },
    }),
  );
  if (
    !asset?.roadSegment ||
    !hasDepartmentRole(profile, asset.departmentId, ["SUBMITTER", "ADMIN"])
  ) {
    return {
      error: "You do not have permission to correct this road segment.",
    };
  }
  if (asset.roadSegment.workflowStatus !== RoadSegmentStatus.NEEDS_CHANGES) {
    return { error: "This road segment is not awaiting correction." };
  }

  const roadSegment = asset.roadSegment;
  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const changed = await transaction.roadSegment.updateMany({
        where: {
          id: roadSegment.id,
          workflowStatus: RoadSegmentStatus.NEEDS_CHANGES,
        },
        data: {
          routeName,
          externalRoadId,
          startMarker,
          endMarker,
          lengthKm,
          surfaceType,
          startLatitude,
          startLongitude,
          endLatitude,
          endLongitude,
          workflowStatus: RoadSegmentStatus.PENDING_VERIFICATION,
        },
      });
      if (changed.count !== 1) {
        throw new WorkflowConflict(
          "This road segment is already being updated.",
        );
      }
      const assetChanged = await transaction.asset.updateMany({
        where: { id: asset.id, status: AssetStatus.NEEDS_CHANGES },
        data: {
          name,
          latitude,
          longitude,
          status: AssetStatus.PENDING_VERIFICATION,
        },
      });
      if (assetChanged.count !== 1) {
        throw new WorkflowConflict(
          "The asset status changed before your correction was saved.",
        );
      }
      await transaction.lifecycleEvent.create({
        data: {
          assetId: asset.id,
          actorId: profile.id,
          type: LifecycleEventType.ASSET_SUBMITTED,
          fromStatus: AssetStatus.NEEDS_CHANGES,
          toStatus: AssetStatus.PENDING_VERIFICATION,
          fromStage: asset.lifecycleStage,
          toStage: asset.lifecycleStage,
          details: { resubmission: true },
        },
      });
      await transaction.roadSegmentStatusEvent.create({
        data: {
          roadSegmentId: roadSegment.id,
          actorId: profile.id,
          fromStatus: RoadSegmentStatus.NEEDS_CHANGES,
          toStatus: RoadSegmentStatus.PENDING_VERIFICATION,
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId: asset.id,
          action: "ROAD_SEGMENT_CORRECTED_AND_RESUBMITTED",
          targetType: "Asset",
          targetId: asset.id,
          changeSummary: { resubmission: true },
        },
      });
    });
  } catch (error) {
    if (error instanceof WorkflowConflict) return { error: error.message };
    throw error;
  }

  redirect(`/assets/${asset.id}?resubmitted=1`);
}

export async function recordInspection(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const assetId = value(formData, "assetId");
  const condition = value(formData, "condition") as ConditionRating;
  const notes = value(formData, "notes");
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (!Object.values(ConditionRating).includes(condition)) {
    return { error: "Select a valid condition rating." };
  }
  if (notes.length > 2000) {
    return { error: "Inspection notes must be 2,000 characters or fewer." };
  }
  const findings: {
    category: string;
    severity: FindingSeverity;
    description: string;
    recommendedAction: string | null;
    startMarker: string | null;
    endMarker: string | null;
  }[] = [];
  for (let index = 0; index < 10; index += 1) {
    const category = value(formData, `finding-${index}-category`);
    const severity = value(formData, `finding-${index}-severity`);
    const description = value(formData, `finding-${index}-description`);
    const recommendedAction = value(
      formData,
      `finding-${index}-recommendedAction`,
    );
    const startMarker = value(formData, `finding-${index}-startMarker`);
    const endMarker = value(formData, `finding-${index}-endMarker`);
    if (
      !category &&
      !severity &&
      !description &&
      !recommendedAction &&
      !startMarker &&
      !endMarker
    ) {
      continue;
    }
    if (
      !category ||
      category.length > 80 ||
      !description ||
      description.length > 2000 ||
      recommendedAction.length > 500 ||
      startMarker.length > 80 ||
      endMarker.length > 80 ||
      !Object.values(FindingSeverity).includes(severity as FindingSeverity)
    ) {
      return {
        error: `Finding ${index + 1} needs valid details within the field limits.`,
      };
    }
    findings.push({
      category,
      severity: severity as FindingSeverity,
      description,
      recommendedAction: recommendedAction || null,
      startMarker: startMarker || null,
      endMarker: endMarker || null,
    });
  }

  const asset = await withUserDbContext(profile.clerkUserId, (transaction) =>
    transaction.asset.findUnique({ where: { id: assetId } }),
  );
  if (
    !asset ||
    !hasDepartmentRole(profile, asset.departmentId, ["INSPECTOR", "ADMIN"])
  ) {
    return { error: "You do not have inspection access to this asset." };
  }
  if (asset.status !== AssetStatus.ACTIVE) {
    return {
      error:
        "Only an active asset can receive a new inspection in this prototype.",
    };
  }

  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const inspection = await transaction.inspection.create({
        data: {
          assetId,
          inspectorId: profile.id,
          inspectedAt: new Date(),
          condition,
          notes: notes || null,
          status: InspectionStatus.SUBMITTED,
          findings: { create: findings },
        },
      });
      await transaction.inspectionEvent.create({
        data: {
          inspectionId: inspection.id,
          actorId: profile.id,
          toStatus: InspectionStatus.SUBMITTED,
          details: {
            condition,
            notes: notes || null,
            findings,
          },
        },
      });
      await transaction.lifecycleEvent.create({
        data: {
          assetId,
          actorId: profile.id,
          type: LifecycleEventType.INSPECTION_RECORDED,
          fromStatus: asset.status,
          toStatus: asset.status,
          fromStage: asset.lifecycleStage,
          toStage: LifecycleStage.INSPECTION,
          details: { inspectionId: inspection.id },
        },
      });
      await transaction.asset.update({
        where: { id: assetId },
        data: { lifecycleStage: LifecycleStage.INSPECTION },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId,
          action: "INSPECTION_SUBMITTED",
          targetType: "Inspection",
          targetId: inspection.id,
          changeSummary: { condition, findingCount: findings.length },
        },
      });
    });
  } catch {
    return { error: "The inspection could not be saved. Please try again." };
  }

  redirect(`/assets/${assetId}?inspection=recorded`);
}

export async function correctInspection(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const inspectionId = value(formData, "inspectionId");
  const condition = value(formData, "condition") as ConditionRating;
  const notes = value(formData, "notes");
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (!Object.values(ConditionRating).includes(condition)) {
    return { error: "Select a valid condition rating." };
  }
  if (notes.length > 2000) {
    return { error: "Inspection notes must be 2,000 characters or fewer." };
  }

  const inspection = await withUserDbContext(
    profile.clerkUserId,
    (transaction) =>
      transaction.inspection.findUnique({
        where: { id: inspectionId },
        include: { asset: true, findings: true },
      }),
  );
  if (
    !inspection ||
    inspection.status !== InspectionStatus.NEEDS_CHANGES ||
    !hasDepartmentRole(profile, inspection.asset.departmentId, [
      "INSPECTOR",
      "ADMIN",
    ]) ||
    (inspection.inspectorId !== profile.id &&
      !hasDepartmentRole(profile, inspection.asset.departmentId, ["ADMIN"]))
  ) {
    return {
      error:
        "Only the assigned inspector or a department admin can correct this returned inspection.",
    };
  }

  const findings: {
    id: string | null;
    category: string;
    severity: FindingSeverity;
    description: string;
    recommendedAction: string | null;
    startMarker: string | null;
    endMarker: string | null;
  }[] = [];
  for (let index = 0; index < 10; index += 1) {
    const id = value(formData, `finding-${index}-id`) || null;
    const category = value(formData, `finding-${index}-category`);
    const severity = value(formData, `finding-${index}-severity`);
    const description = value(formData, `finding-${index}-description`);
    const recommendedAction = value(
      formData,
      `finding-${index}-recommendedAction`,
    );
    const startMarker = value(formData, `finding-${index}-startMarker`);
    const endMarker = value(formData, `finding-${index}-endMarker`);
    if (
      !category &&
      !severity &&
      !description &&
      !recommendedAction &&
      !startMarker &&
      !endMarker
    ) {
      continue;
    }
    if (
      !category ||
      category.length > 80 ||
      !description ||
      description.length > 2000 ||
      recommendedAction.length > 500 ||
      startMarker.length > 80 ||
      endMarker.length > 80 ||
      !Object.values(FindingSeverity).includes(severity as FindingSeverity)
    ) {
      return {
        error: `Finding ${index + 1} needs valid details within the field limits.`,
      };
    }
    if (id && !inspection.findings.some((finding) => finding.id === id)) {
      return { error: "A finding no longer belongs to this inspection." };
    }
    findings.push({
      id,
      category,
      severity: severity as FindingSeverity,
      description,
      recommendedAction: recommendedAction || null,
      startMarker: startMarker || null,
      endMarker: endMarker || null,
    });
  }

  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const changed = await transaction.inspection.updateMany({
        where: {
          id: inspection.id,
          inspectorId: inspection.inspectorId,
          status: InspectionStatus.NEEDS_CHANGES,
        },
        data: {
          condition,
          notes: notes || null,
          status: InspectionStatus.SUBMITTED,
        },
      });
      if (changed.count !== 1) {
        throw new WorkflowConflict(
          "This inspection was already corrected or reviewed.",
        );
      }
      const retainedIds = findings.flatMap((finding) =>
        finding.id ? [finding.id] : [],
      );
      const removedIds = inspection.findings
        .filter((finding) => !retainedIds.includes(finding.id))
        .map((finding) => finding.id);
      if (removedIds.length) {
        const attachedEvidence = await transaction.evidence.count({
          where: { findingId: { in: removedIds } },
        });
        if (attachedEvidence) {
          throw new WorkflowConflict(
            "A finding with linked evidence cannot be removed. Keep it and update its details instead.",
          );
        }
        await transaction.inspectionFinding.deleteMany({
          where: { id: { in: removedIds } },
        });
      }
      for (const finding of findings) {
        const data = {
          category: finding.category,
          severity: finding.severity,
          description: finding.description,
          recommendedAction: finding.recommendedAction,
          startMarker: finding.startMarker,
          endMarker: finding.endMarker,
        };
        if (finding.id) {
          await transaction.inspectionFinding.updateMany({
            where: { id: finding.id, inspectionId: inspection.id },
            data,
          });
        } else {
          await transaction.inspectionFinding.create({
            data: { ...data, inspectionId: inspection.id },
          });
        }
      }
      await transaction.inspectionEvent.create({
        data: {
          inspectionId: inspection.id,
          actorId: profile.id,
          fromStatus: InspectionStatus.NEEDS_CHANGES,
          toStatus: InspectionStatus.SUBMITTED,
          reason: "Corrected and resubmitted",
          details: {
            condition,
            notes: notes || null,
            findings,
          },
        },
      });
      await transaction.lifecycleEvent.create({
        data: {
          assetId: inspection.assetId,
          actorId: profile.id,
          type: LifecycleEventType.INSPECTION_RECORDED,
          fromStatus: inspection.asset.status,
          toStatus: inspection.asset.status,
          fromStage: inspection.asset.lifecycleStage,
          toStage: inspection.asset.lifecycleStage,
          details: { inspectionId: inspection.id, action: "RESUBMITTED" },
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId: inspection.assetId,
          action: "INSPECTION_RESUBMITTED",
          targetType: "Inspection",
          targetId: inspection.id,
          changeSummary: { condition, findingCount: findings.length },
        },
      });
    });
  } catch (error) {
    if (error instanceof WorkflowConflict) return { error: error.message };
    return {
      error: "The inspection could not be resubmitted. Please try again.",
    };
  }

  redirect(`/assets/${inspection.assetId}?inspection=resubmitted`);
}

export async function reviewInspection(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const inspectionId = value(formData, "inspectionId");
  const decision = value(formData, "decision");
  const reason = value(formData, "reason");
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (decision !== "verify" && decision !== "return") {
    return { error: "Choose verify or return for correction." };
  }
  if (decision === "return" && !reason) {
    return { error: "A reason is required when returning an inspection." };
  }

  const inspection = await withUserDbContext(
    profile.clerkUserId,
    (transaction) =>
      transaction.inspection.findUnique({
        where: { id: inspectionId },
        include: { asset: true },
      }),
  );
  if (
    !inspection ||
    !hasDepartmentRole(profile, inspection.asset.departmentId, [
      "VERIFIER",
      "ADMIN",
    ]) ||
    inspection.inspectorId === profile.id
  ) {
    return {
      error:
        "A different verifier with department access must review this inspection.",
    };
  }
  if (inspection.status !== InspectionStatus.SUBMITTED) {
    return { error: "This inspection has already been reviewed." };
  }

  const nextStatus =
    decision === "verify"
      ? InspectionStatus.VERIFIED
      : InspectionStatus.NEEDS_CHANGES;
  const nextStage =
    decision === "verify"
      ? LifecycleStage.CONDITION_RISK_ASSESSMENT
      : inspection.asset.lifecycleStage;

  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const changed = await transaction.inspection.updateMany({
        where: { id: inspection.id, status: InspectionStatus.SUBMITTED },
        data: { status: nextStatus },
      });
      if (changed.count !== 1) {
        throw new WorkflowConflict("This inspection was already reviewed.");
      }
      await transaction.inspectionEvent.create({
        data: {
          inspectionId: inspection.id,
          actorId: profile.id,
          fromStatus: inspection.status,
          toStatus: nextStatus,
          reason: reason || null,
        },
      });
      if (decision === "verify") {
        await transaction.asset.update({
          where: { id: inspection.assetId },
          data: {
            currentCondition: inspection.condition,
            lifecycleStage: nextStage,
          },
        });
      }
      await transaction.lifecycleEvent.create({
        data: {
          assetId: inspection.assetId,
          actorId: profile.id,
          type: LifecycleEventType.INSPECTION_RECORDED,
          fromStatus: inspection.asset.status,
          toStatus: inspection.asset.status,
          fromStage: inspection.asset.lifecycleStage,
          toStage: nextStage,
          reason: reason || null,
          details: { inspectionId: inspection.id, review: nextStatus },
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId: inspection.assetId,
          action:
            decision === "verify"
              ? "INSPECTION_VERIFIED"
              : "INSPECTION_RETURNED",
          targetType: "Inspection",
          targetId: inspection.id,
          changeSummary: {
            from: inspection.status,
            to: nextStatus,
            reason: reason || null,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof WorkflowConflict) return { error: error.message };
    throw error;
  }

  redirect(`/assets/${inspection.assetId}?inspection=reviewed`);
}

export async function createWorkOrder(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const assetId = value(formData, "assetId");
  const title = value(formData, "title");
  const workType = value(formData, "workType");
  const description = value(formData, "description");
  const priority = value(formData, "priority") as WorkPriority;
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (!title || !workType || !Object.values(WorkPriority).includes(priority)) {
    return { error: "Enter a work title, type, and valid priority." };
  }

  const asset = await withUserDbContext(profile.clerkUserId, (transaction) =>
    transaction.asset.findUnique({ where: { id: assetId } }),
  );
  if (
    !asset ||
    !hasDepartmentRole(profile, asset.departmentId, [
      "MAINTENANCE_OFFICER",
      "ADMIN",
    ])
  ) {
    return { error: "You do not have maintenance access to this asset." };
  }
  if (asset.status !== AssetStatus.ACTIVE) {
    return { error: "Work orders can only be created for active assets." };
  }

  const workOrderCode = `WO-${randomUUID().slice(0, 8).toUpperCase()}`;
  let workOrderId: string;
  try {
    workOrderId = await withUserDbContext(
      profile.clerkUserId,
      async (transaction) => {
        const created = await transaction.workOrder.create({
          data: {
            workOrderCode,
            title,
            workType,
            priority,
            description: description || null,
            createdById: profile.id,
            assets: { create: { assetId } },
          },
        });
        await transaction.workOrderEvent.create({
          data: {
            workOrderId: created.id,
            actorId: profile.id,
            toStatus: WorkOrderStatus.PLANNED,
          },
        });
        await transaction.asset.update({
          where: { id: assetId },
          data: { lifecycleStage: LifecycleStage.MAINTENANCE_REPAIR },
        });
        await transaction.lifecycleEvent.create({
          data: {
            assetId,
            actorId: profile.id,
            type: LifecycleEventType.WORK_ORDER_CREATED,
            fromStatus: asset.status,
            toStatus: asset.status,
            fromStage: asset.lifecycleStage,
            toStage: LifecycleStage.MAINTENANCE_REPAIR,
            details: { workOrderId: created.id },
          },
        });
        await transaction.auditEvent.create({
          data: {
            actorId: profile.id,
            assetId,
            action: "WORK_ORDER_CREATED",
            targetType: "WorkOrder",
            targetId: created.id,
            changeSummary: { workOrderCode, priority },
          },
        });
        return created.id;
      },
    );
  } catch {
    return { error: "The work order could not be saved. Please try again." };
  }

  redirect(`/assets/${assetId}?workOrder=${workOrderId}`);
}

export async function changeWorkOrderStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getActiveProfile();
  const workOrderId = value(formData, "workOrderId");
  const requestedStatus = value(formData, "status") as WorkOrderStatus;
  const requestedAssigneeId = value(formData, "assigneeId");
  const reason = value(formData, "reason");
  if (!profile)
    return { error: "Your account is not active in this workspace." };
  if (!Object.values(WorkOrderStatus).includes(requestedStatus)) {
    return { error: "Choose a valid work-order status." };
  }

  const workOrder = await withUserDbContext(
    profile.clerkUserId,
    (transaction) =>
      transaction.workOrder.findUnique({
        where: { id: workOrderId },
        include: { assets: { include: { asset: true } } },
      }),
  );
  if (!workOrder || workOrder.assets.length !== 1) {
    return {
      error: "This work order is unavailable in the current prototype.",
    };
  }
  const workOrderAsset = workOrder.assets[0];
  if (!workOrderAsset) {
    return { error: "This work order has no linked asset." };
  }
  const asset = workOrderAsset.asset;
  if (!canAccessDepartment(profile, asset.departmentId)) {
    return { error: "You do not have access to this work order." };
  }

  if (!canTransitionWorkOrder(workOrder.status, requestedStatus)) {
    return { error: "That work-order transition is not allowed." };
  }
  const verifying = requestedStatus === WorkOrderStatus.VERIFIED;
  const managing = hasDepartmentRole(profile, asset.departmentId, [
    "MAINTENANCE_OFFICER",
    "ADMIN",
  ]);
  if (
    (verifying &&
      !hasDepartmentRole(profile, asset.departmentId, ["VERIFIER", "ADMIN"])) ||
    (!verifying && !managing)
  ) {
    return { error: "Your role cannot make this work-order transition." };
  }
  if (requestedStatus === WorkOrderStatus.ASSIGNED) {
    const eligibleAssignee = requestedAssigneeId
      ? await withUserDbContext(profile.clerkUserId, (transaction) =>
          transaction.roleAssignment.findFirst({
            where: {
              userId: requestedAssigneeId,
              departmentId: asset.departmentId,
              role: "MAINTENANCE_OFFICER",
              active: true,
              user: { active: true },
            },
            select: { id: true },
          }),
        )
      : null;
    if (!eligibleAssignee) {
      return {
        error:
          "Choose an active maintenance officer assigned to this department.",
      };
    }
  }
  if (workOrderTransitionRequiresReason(requestedStatus) && !reason) {
    return {
      error:
        "Add completion notes when completing work, or a reason when verifying or cancelling it.",
    };
  }

  const statusData =
    requestedStatus === WorkOrderStatus.ASSIGNED
      ? { assigneeId: requestedAssigneeId }
      : requestedStatus === WorkOrderStatus.IN_PROGRESS
        ? { actualStart: new Date() }
        : requestedStatus === WorkOrderStatus.COMPLETED
          ? { actualEnd: new Date(), completionNotes: reason || null }
          : {};

  try {
    await withUserDbContext(profile.clerkUserId, async (transaction) => {
      const changed = await transaction.workOrder.updateMany({
        where: { id: workOrder.id, status: workOrder.status },
        data: { status: requestedStatus, ...statusData },
      });
      if (changed.count !== 1) {
        throw new WorkflowConflict(
          "This work order changed before your update was saved.",
        );
      }
      await transaction.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          actorId: profile.id,
          fromStatus: workOrder.status,
          toStatus: requestedStatus,
          reason: reason || null,
        },
      });
      let nextStage = asset.lifecycleStage;
      if (
        requestedStatus === WorkOrderStatus.VERIFIED ||
        requestedStatus === WorkOrderStatus.CANCELLED
      ) {
        const remainingOpenWorkOrders = await transaction.workOrderAsset.count({
          where: {
            assetId: asset.id,
            workOrder: {
              id: { not: workOrder.id },
              status: {
                in: [
                  WorkOrderStatus.PLANNED,
                  WorkOrderStatus.ASSIGNED,
                  WorkOrderStatus.IN_PROGRESS,
                  WorkOrderStatus.COMPLETED,
                ],
              },
            },
          },
        });
        const resolvedStage = stageAfterWorkOrderResolution(
          asset.lifecycleStage,
          remainingOpenWorkOrders,
          asset.currentCondition,
        );
        if (resolvedStage) {
          nextStage = resolvedStage;
          await transaction.asset.updateMany({
            where: {
              id: asset.id,
              lifecycleStage: LifecycleStage.MAINTENANCE_REPAIR,
            },
            data: { lifecycleStage: nextStage },
          });
        }
      }
      await transaction.lifecycleEvent.create({
        data: {
          assetId: asset.id,
          actorId: profile.id,
          type:
            requestedStatus === WorkOrderStatus.COMPLETED
              ? LifecycleEventType.WORK_COMPLETED
              : LifecycleEventType.WORK_ORDER_UPDATED,
          fromStatus: asset.status,
          toStatus: asset.status,
          fromStage: asset.lifecycleStage,
          toStage: nextStage,
          reason: reason || null,
          details: {
            workOrderId: workOrder.id,
            from: workOrder.status,
            to: requestedStatus,
          },
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: profile.id,
          assetId: asset.id,
          action: "WORK_ORDER_STATUS_CHANGED",
          targetType: "WorkOrder",
          targetId: workOrder.id,
          changeSummary: {
            from: workOrder.status,
            to: requestedStatus,
            reason: reason || null,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof WorkflowConflict) return { error: error.message };
    throw error;
  }

  redirect(`/assets/${asset.id}?workOrderUpdated=1`);
}
