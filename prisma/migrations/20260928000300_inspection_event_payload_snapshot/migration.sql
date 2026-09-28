-- Preserve submitted inspection content in the append-only review history.
ALTER TABLE "public"."InspectionEvent"
  ADD COLUMN "details" JSONB;
