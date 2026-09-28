import {
  ConditionRating,
  LifecycleStage,
  type UserRole,
  WorkOrderStatus,
} from "@prisma/client";

export type ScopedRoleAssignment = {
  departmentId: string;
  role: UserRole;
  active?: boolean;
};

export function hasAnyRoleInDepartment(
  assignments: readonly ScopedRoleAssignment[],
  departmentId: string,
  roles: readonly UserRole[],
) {
  return assignments.some(
    (assignment) =>
      assignment.active !== false &&
      assignment.departmentId === departmentId &&
      roles.includes(assignment.role),
  );
}

export function canAccessDepartment(
  assignments: readonly ScopedRoleAssignment[],
  departmentId: string,
) {
  return assignments.some(
    (assignment) =>
      assignment.active !== false && assignment.departmentId === departmentId,
  );
}

const workOrderTransitions: Record<
  WorkOrderStatus,
  readonly WorkOrderStatus[]
> = {
  PLANNED: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
  ASSIGNED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  COMPLETED: [WorkOrderStatus.VERIFIED],
  VERIFIED: [],
  CANCELLED: [],
};

export function canTransitionWorkOrder(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
) {
  return workOrderTransitions[from].includes(to);
}

export function workOrderTransitionRequiresReason(status: WorkOrderStatus) {
  return (
    status === WorkOrderStatus.COMPLETED ||
    status === WorkOrderStatus.VERIFIED ||
    status === WorkOrderStatus.CANCELLED
  );
}

export function canReviewRoadSubmission(
  submitterId: string,
  reviewerId: string,
) {
  return submitterId !== reviewerId;
}

export function stageAfterWorkOrderResolution(
  currentStage: LifecycleStage,
  remainingOpenWorkOrders: number,
  currentCondition: ConditionRating,
): LifecycleStage | null {
  if (
    currentStage !== LifecycleStage.MAINTENANCE_REPAIR ||
    remainingOpenWorkOrders > 0
  ) {
    return null;
  }

  return currentCondition === ConditionRating.UNKNOWN
    ? LifecycleStage.OWNERSHIP_LOCATION_ASSIGNMENT
    : LifecycleStage.CONDITION_RISK_ASSESSMENT;
}
