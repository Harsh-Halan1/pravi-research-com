"use client";

import { useActionState } from "react";
import {
  changeWorkOrderStatus,
  correctInspection,
  correctRoadSegment,
  createWorkOrder,
  recordInspection,
  registerRoadSegment,
  reviewInspection,
  reviewRoadSegment,
} from "./actions";
import styles from "./assets.module.css";

type DepartmentOption = { id: string; name: string };

function ErrorMessage({ message }: { message?: string }) {
  return message ? (
    <p className={styles.formError} role="alert">
      {message}
    </p>
  ) : null;
}

export function RoadRegistrationForm({
  departments,
}: {
  departments: DepartmentOption[];
}) {
  const [state, action, pending] = useActionState(registerRoadSegment, null);
  return (
    <form action={action} className={styles.form}>
      <div className={styles.formGrid}>
        <label>
          Department <span>*</span>
          <select name="departmentId" required>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Asset code <span>*</span>
          <input
            name="assetCode"
            required
            maxLength={48}
            placeholder="RD-DEMO-001"
          />
        </label>
        <label className={styles.fullField}>
          Asset name <span>*</span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder="North Link Road, Phase 1"
          />
        </label>
        <label>
          Route name <span>*</span>
          <input
            name="routeName"
            required
            maxLength={120}
            placeholder="North Link Road"
          />
        </label>
        <label>
          External road ID
          <input
            name="externalRoadId"
            maxLength={80}
            placeholder="Optional source register ID"
          />
        </label>
        <label>
          Start marker <span>*</span>
          <input
            name="startMarker"
            required
            maxLength={80}
            placeholder="Junction A / km 0"
          />
        </label>
        <label>
          End marker <span>*</span>
          <input
            name="endMarker"
            required
            maxLength={80}
            placeholder="Junction B / km 3.2"
          />
        </label>
        <label>
          Length (km) <span>*</span>
          <input
            name="lengthKm"
            required
            type="number"
            min="0.001"
            step="0.001"
          />
        </label>
        <label>
          Surface type <span>*</span>
          <input
            name="surfaceType"
            required
            maxLength={60}
            placeholder="Asphalt"
          />
        </label>
        <p className={`${styles.fieldNote} ${styles.fullField}`}>
          Representative coordinates are optional while the record is a draft.
          If entered, provide both values.
        </p>
        <label>
          Representative latitude
          <input
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
          />
        </label>
        <label>
          Representative longitude
          <input
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
          />
        </label>
        <label>
          Start latitude
          <input
            name="startLatitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
          />
        </label>
        <label>
          Start longitude
          <input
            name="startLongitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
          />
        </label>
        <label>
          End latitude
          <input
            name="endLatitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
          />
        </label>
        <label>
          End longitude
          <input
            name="endLongitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
          />
        </label>
      </div>
      <ErrorMessage message={state?.error} />
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={pending}
        >
          {pending ? "Submitting…" : "Register and submit for verification"}
        </button>
      </div>
    </form>
  );
}

export function RoadReviewForm({ assetId }: { assetId: string }) {
  const [state, action, pending] = useActionState(reviewRoadSegment, null);
  return (
    <form action={action} className={styles.inlineForm}>
      <input type="hidden" name="assetId" value={assetId} />
      <label className={styles.reasonField}>
        Reason when returning
        <textarea
          name="reason"
          rows={2}
          placeholder="Required only when returning for correction"
        />
      </label>
      <ErrorMessage message={state?.error} />
      <div className={styles.buttonRow}>
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className={styles.primaryButton}
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="return"
          disabled={pending}
          className={styles.secondaryButton}
        >
          Return for correction
        </button>
      </div>
    </form>
  );
}

type RoadCorrectionInitial = {
  name: string;
  routeName: string;
  externalRoadId: string;
  startMarker: string;
  endMarker: string;
  lengthKm: string;
  surfaceType: string;
  latitude: string;
  longitude: string;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
};

export function RoadCorrectionForm({
  assetId,
  initial,
}: {
  assetId: string;
  initial: RoadCorrectionInitial;
}) {
  const [state, action, pending] = useActionState(correctRoadSegment, null);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="assetId" value={assetId} />
      <div className={styles.formGrid}>
        <label className={styles.fullField}>
          Asset name <span>*</span>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={initial.name}
          />
        </label>
        <label>
          Route name <span>*</span>
          <input
            name="routeName"
            required
            maxLength={120}
            defaultValue={initial.routeName}
          />
        </label>
        <label>
          External road ID
          <input
            name="externalRoadId"
            maxLength={80}
            defaultValue={initial.externalRoadId}
          />
        </label>
        <label>
          Start marker <span>*</span>
          <input
            name="startMarker"
            required
            maxLength={80}
            defaultValue={initial.startMarker}
          />
        </label>
        <label>
          End marker <span>*</span>
          <input
            name="endMarker"
            required
            maxLength={80}
            defaultValue={initial.endMarker}
          />
        </label>
        <label>
          Length (km) <span>*</span>
          <input
            name="lengthKm"
            required
            type="number"
            min="0.001"
            step="0.001"
            defaultValue={initial.lengthKm}
          />
        </label>
        <label>
          Surface type <span>*</span>
          <input
            name="surfaceType"
            required
            maxLength={60}
            defaultValue={initial.surfaceType}
          />
        </label>
        <label>
          Representative latitude
          <input
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            defaultValue={initial.latitude}
          />
        </label>
        <label>
          Representative longitude
          <input
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            defaultValue={initial.longitude}
          />
        </label>
        <label>
          Start latitude
          <input
            name="startLatitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            defaultValue={initial.startLatitude}
          />
        </label>
        <label>
          Start longitude
          <input
            name="startLongitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            defaultValue={initial.startLongitude}
          />
        </label>
        <label>
          End latitude
          <input
            name="endLatitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            defaultValue={initial.endLatitude}
          />
        </label>
        <label>
          End longitude
          <input
            name="endLongitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            defaultValue={initial.endLongitude}
          />
        </label>
      </div>
      <ErrorMessage message={state?.error} />
      <button type="submit" className={styles.primaryButton} disabled={pending}>
        {pending ? "Resubmitting…" : "Save corrections and resubmit"}
      </button>
    </form>
  );
}

type InspectionFindingInput = {
  id?: string;
  category: string;
  severity: string;
  description: string;
  recommendedAction: string | null;
  startMarker: string | null;
  endMarker: string | null;
};

function InspectionFields({
  initial,
}: {
  initial?: {
    condition: string;
    notes: string | null;
    findings: InspectionFindingInput[];
  };
}) {
  const rows = Math.min(Math.max(initial?.findings.length ?? 0, 3), 10);
  return (
    <>
      <label>
        Observed condition <span>*</span>
        <select
          name="condition"
          required
          defaultValue={initial?.condition ?? ""}
        >
          <option value="" disabled>
            Select a rating
          </option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="POOR">Poor</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </label>
      <label>
        Inspection notes
        <textarea
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={initial?.notes ?? ""}
          placeholder="Describe the observed condition and any follow-up needed."
        />
      </label>
      <fieldset className={styles.form}>
        <legend>Findings (optional)</legend>
        {Array.from({ length: rows }, (_, index) => {
          const finding = initial?.findings[index];
          return (
            <fieldset key={finding?.id ?? index} className={styles.formGrid}>
              <legend>Finding {index + 1}</legend>
              {finding?.id && (
                <input
                  type="hidden"
                  name={`finding-${index}-id`}
                  value={finding.id}
                />
              )}
              <label>
                Category
                <input
                  name={`finding-${index}-category`}
                  maxLength={80}
                  defaultValue={finding?.category ?? ""}
                  placeholder="Pothole, crack, drainage…"
                />
              </label>
              <label>
                Severity
                <select
                  name={`finding-${index}-severity`}
                  defaultValue={finding?.severity ?? ""}
                >
                  <option value="">Select</option>
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label className={styles.fullField}>
                Description
                <textarea
                  name={`finding-${index}-description`}
                  rows={2}
                  maxLength={2000}
                  defaultValue={finding?.description ?? ""}
                />
              </label>
              <label className={styles.fullField}>
                Recommended action
                <input
                  name={`finding-${index}-recommendedAction`}
                  maxLength={500}
                  defaultValue={finding?.recommendedAction ?? ""}
                />
              </label>
              <label>
                Start marker
                <input
                  name={`finding-${index}-startMarker`}
                  maxLength={80}
                  defaultValue={finding?.startMarker ?? ""}
                />
              </label>
              <label>
                End marker
                <input
                  name={`finding-${index}-endMarker`}
                  maxLength={80}
                  defaultValue={finding?.endMarker ?? ""}
                />
              </label>
            </fieldset>
          );
        })}
      </fieldset>
    </>
  );
}

export function InspectionForm({ assetId }: { assetId: string }) {
  const [state, action, pending] = useActionState(recordInspection, null);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="assetId" value={assetId} />
      <InspectionFields />
      <ErrorMessage message={state?.error} />
      <button type="submit" className={styles.primaryButton} disabled={pending}>
        {pending ? "Saving…" : "Submit inspection"}
      </button>
    </form>
  );
}

export function InspectionCorrectionForm({
  inspectionId,
  initial,
}: {
  inspectionId: string;
  initial: {
    condition: string;
    notes: string | null;
    findings: InspectionFindingInput[];
  };
}) {
  const [state, action, pending] = useActionState(correctInspection, null);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="inspectionId" value={inspectionId} />
      <InspectionFields initial={initial} />
      <ErrorMessage message={state?.error} />
      <button type="submit" className={styles.primaryButton} disabled={pending}>
        {pending ? "Resubmitting…" : "Save corrections and resubmit"}
      </button>
    </form>
  );
}

export function InspectionReviewForm({
  inspectionId,
}: {
  inspectionId: string;
}) {
  const [state, action, pending] = useActionState(reviewInspection, null);
  return (
    <form action={action} className={styles.inlineForm}>
      <input type="hidden" name="inspectionId" value={inspectionId} />
      <label className={styles.reasonField}>
        Reason when returning
        <textarea
          name="reason"
          rows={2}
          placeholder="Required only when returning for correction"
        />
      </label>
      <ErrorMessage message={state?.error} />
      <div className={styles.buttonRow}>
        <button
          type="submit"
          name="decision"
          value="verify"
          disabled={pending}
          className={styles.primaryButton}
        >
          Verify inspection
        </button>
        <button
          type="submit"
          name="decision"
          value="return"
          disabled={pending}
          className={styles.secondaryButton}
        >
          Return inspection
        </button>
      </div>
    </form>
  );
}

export function WorkOrderForm({ assetId }: { assetId: string }) {
  const [state, action, pending] = useActionState(createWorkOrder, null);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="assetId" value={assetId} />
      <label>
        Work title <span>*</span>
        <input
          name="title"
          required
          maxLength={140}
          placeholder="Repair damaged surface section"
        />
      </label>
      <label>
        Work type <span>*</span>
        <input
          name="workType"
          required
          maxLength={80}
          placeholder="Patching, resurfacing, drainage…"
        />
      </label>
      <label>
        Priority
        <select name="priority" defaultValue="NORMAL">
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </label>
      <label>
        Work description
        <textarea name="description" rows={3} maxLength={2000} />
      </label>
      <ErrorMessage message={state?.error} />
      <button type="submit" className={styles.primaryButton} disabled={pending}>
        {pending ? "Creating…" : "Create work order"}
      </button>
    </form>
  );
}

export function WorkOrderStatusForm({
  workOrderId,
  nextStatuses,
  assignees,
}: {
  workOrderId: string;
  nextStatuses: string[];
  assignees: { id: string; displayName: string }[];
}) {
  const [state, action, pending] = useActionState(changeWorkOrderStatus, null);
  if (!nextStatuses.length) return null;
  return (
    <form action={action} className={styles.inlineForm}>
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <label>
        Next status
        <select name="status" defaultValue={nextStatuses[0]}>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      {nextStatuses.includes("ASSIGNED") && (
        <label>
          Assign to <span>*</span>
          <select name="assigneeId" required defaultValue="">
            <option value="" disabled>
              Select a maintenance officer
            </option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.displayName}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Completion / terminal reason
        <textarea
          name="reason"
          rows={2}
          placeholder="Required when completing, verifying, or cancelling"
        />
      </label>
      <ErrorMessage message={state?.error} />
      <button
        type="submit"
        className={styles.secondaryButton}
        disabled={pending}
      >
        {pending ? "Updating…" : "Update work status"}
      </button>
    </form>
  );
}
