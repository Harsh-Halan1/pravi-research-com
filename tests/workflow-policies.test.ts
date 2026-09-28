import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ConditionRating,
  LifecycleStage,
  UserRole,
  WorkOrderStatus,
} from "@prisma/client";
import {
  canAccessDepartment,
  canReviewRoadSubmission,
  canTransitionWorkOrder,
  hasAnyRoleInDepartment,
  stageAfterWorkOrderResolution,
  workOrderTransitionRequiresReason,
} from "../src/lib/workflow-policies";

describe("department authorization policies", () => {
  const assignments = [
    { departmentId: "roads-north", role: UserRole.SUBMITTER },
    { departmentId: "roads-south", role: UserRole.PLANNER },
    {
      departmentId: "roads-west",
      role: UserRole.ADMIN,
      active: false,
    },
  ] as const;

  it("grants only roles assigned to the requested department", () => {
    assert.equal(
      hasAnyRoleInDepartment(assignments, "roads-north", [UserRole.SUBMITTER]),
      true,
    );
    assert.equal(
      hasAnyRoleInDepartment(assignments, "roads-north", [UserRole.PLANNER]),
      false,
    );
  });

  it("treats a read-only assignment as scoped access, without granting another department", () => {
    assert.equal(canAccessDepartment(assignments, "roads-south"), true);
    assert.equal(canAccessDepartment(assignments, "roads-east"), false);
    assert.equal(
      hasAnyRoleInDepartment(assignments, "roads-south", [UserRole.ADMIN]),
      false,
    );
  });

  it("denies access from an inactive role assignment", () => {
    assert.equal(canAccessDepartment(assignments, "roads-west"), false);
    assert.equal(
      hasAnyRoleInDepartment(assignments, "roads-west", [UserRole.ADMIN]),
      false,
    );
  });
});

describe("road review separation of duties", () => {
  it("allows independent review and rejects submitter self-review", () => {
    assert.equal(canReviewRoadSubmission("submitter-1", "verifier-2"), true);
    assert.equal(canReviewRoadSubmission("submitter-1", "submitter-1"), false);
  });
});

describe("work-order status policy", () => {
  it("allows only the modeled forward, cancellation, and verification transitions", () => {
    const allowed: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
      PLANNED: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
      ASSIGNED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
      IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
      COMPLETED: [WorkOrderStatus.VERIFIED],
      VERIFIED: [],
      CANCELLED: [],
    };

    for (const from of Object.values(WorkOrderStatus)) {
      for (const to of Object.values(WorkOrderStatus)) {
        assert.equal(
          canTransitionWorkOrder(from, to),
          allowed[from].includes(to),
          `${from} → ${to}`,
        );
      }
    }
  });

  it("requires notes for completion and reasons for verification or cancellation", () => {
    assert.equal(
      workOrderTransitionRequiresReason(WorkOrderStatus.COMPLETED),
      true,
    );
    assert.equal(
      workOrderTransitionRequiresReason(WorkOrderStatus.VERIFIED),
      true,
    );
    assert.equal(
      workOrderTransitionRequiresReason(WorkOrderStatus.CANCELLED),
      true,
    );
    assert.equal(
      workOrderTransitionRequiresReason(WorkOrderStatus.ASSIGNED),
      false,
    );
  });

  it("returns to the appropriate shared lifecycle stage only after all open work is resolved", () => {
    assert.equal(
      stageAfterWorkOrderResolution(
        LifecycleStage.MAINTENANCE_REPAIR,
        0,
        ConditionRating.GOOD,
      ),
      LifecycleStage.CONDITION_RISK_ASSESSMENT,
    );
    assert.equal(
      stageAfterWorkOrderResolution(
        LifecycleStage.MAINTENANCE_REPAIR,
        0,
        ConditionRating.UNKNOWN,
      ),
      LifecycleStage.OWNERSHIP_LOCATION_ASSIGNMENT,
    );
    assert.equal(
      stageAfterWorkOrderResolution(
        LifecycleStage.MAINTENANCE_REPAIR,
        1,
        ConditionRating.GOOD,
      ),
      null,
    );
    assert.equal(
      stageAfterWorkOrderResolution(
        LifecycleStage.INSPECTION,
        0,
        ConditionRating.GOOD,
      ),
      null,
    );
  });
});
