-- Create a least-privilege application login. Set its password out of band
-- before switching DATABASE_URL away from the privileged postgres role.
DO $$
DECLARE
  runtime_role record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pravi_app') THEN
    CREATE ROLE pravi_app NOLOGIN NOBYPASSRLS;
  END IF;

  SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    INTO runtime_role
  FROM pg_roles
  WHERE rolname = 'pravi_app';

  IF runtime_role.rolcanlogin
    OR runtime_role.rolsuper
    OR runtime_role.rolcreatedb
    OR runtime_role.rolcreaterole
    OR runtime_role.rolreplication
    OR runtime_role.rolbypassrls
  THEN
    RAISE EXCEPTION 'The existing pravi_app role has unexpected privileges; review it with a database administrator before applying this migration.';
  END IF;
END $$;
GRANT CONNECT ON DATABASE postgres TO pravi_app;

REVOKE ALL ON SCHEMA pravi FROM PUBLIC;
REVOKE ALL ON SCHEMA pravi FROM anon, authenticated;
GRANT USAGE ON SCHEMA pravi TO pravi_app;
REVOKE ALL ON ALL TABLES IN SCHEMA pravi FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA pravi
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA pravi
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

GRANT USAGE ON TYPE pravi."AssetType", pravi."AssetStatus", pravi."LifecycleStage",
  pravi."RoadSegmentStatus", pravi."EvidenceVisibility", pravi."ConditionRating",
  pravi."UserRole", pravi."LifecycleEventType", pravi."InspectionStatus",
  pravi."FindingSeverity", pravi."WorkOrderStatus", pravi."WorkPriority"
TO pravi_app;

GRANT SELECT ON pravi."Department", pravi."RoleAssignment" TO pravi_app;
GRANT SELECT (id, "clerkUserId", "displayName", active)
  ON pravi."UserProfile" TO pravi_app;
GRANT SELECT, INSERT, UPDATE ON pravi."Asset", pravi."RoadSegment", pravi."Inspection",
  pravi."InspectionFinding", pravi."WorkOrder", pravi."WorkOrderAsset", pravi."Evidence"
TO pravi_app;
GRANT DELETE ON pravi."InspectionFinding" TO pravi_app;
GRANT SELECT, INSERT ON pravi."RoadSegmentStatusEvent", pravi."LifecycleEvent",
  pravi."InspectionEvent", pravi."WorkOrderEvent", pravi."AuditEvent"
TO pravi_app;

CREATE OR REPLACE FUNCTION pravi.current_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT nullif(current_setting('app.clerk_user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION pravi.current_profile_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT profile.id
  FROM pravi."UserProfile" AS profile
  WHERE profile."clerkUserId" = pravi.current_clerk_user_id()
    AND profile.active
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION pravi.has_department_role(target_department_id text, role_names text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."RoleAssignment" AS assignment
    JOIN pravi."UserProfile" AS profile ON profile.id = assignment."userId"
    WHERE profile.id = pravi.current_profile_id()
      AND profile.active
      AND assignment.active
      AND assignment."departmentId" = target_department_id
      AND (role_names IS NULL OR assignment.role::text = ANY(role_names))
  )
$$;

CREATE OR REPLACE FUNCTION pravi.has_any_department_role(role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."RoleAssignment" AS assignment
    JOIN pravi."UserProfile" AS profile ON profile.id = assignment."userId"
    WHERE profile.id = pravi.current_profile_id()
      AND profile.active
      AND assignment.active
      AND assignment.role::text = ANY(role_names)
  )
$$;

CREATE OR REPLACE FUNCTION pravi.has_asset_role(target_asset_id text, role_names text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."Asset" AS asset
    WHERE asset.id = target_asset_id
      AND pravi.has_department_role(asset."departmentId", role_names)
  )
$$;

CREATE OR REPLACE FUNCTION pravi.can_access_asset(target_asset_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT pravi.has_asset_role(target_asset_id, NULL)
$$;

CREATE OR REPLACE FUNCTION pravi.can_access_inspection(target_inspection_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."Inspection" AS inspection
    WHERE inspection.id = target_inspection_id
      AND pravi.can_access_asset(inspection."assetId")
  )
$$;

CREATE OR REPLACE FUNCTION pravi.has_inspection_role(target_inspection_id text, role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."Inspection" AS inspection
    WHERE inspection.id = target_inspection_id
      AND pravi.has_asset_role(inspection."assetId", role_names)
  )
$$;

CREATE OR REPLACE FUNCTION pravi.has_work_order_role(target_work_order_id text, role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pravi."WorkOrderAsset" AS link
    JOIN pravi."Asset" AS asset ON asset.id = link."assetId"
    WHERE link."workOrderId" = target_work_order_id
      AND pravi.has_department_role(asset."departmentId", role_names)
  )
$$;

CREATE OR REPLACE FUNCTION pravi.can_access_work_order(target_work_order_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM pravi."WorkOrderAsset" AS link
      JOIN pravi."Asset" AS asset ON asset.id = link."assetId"
      WHERE link."workOrderId" = target_work_order_id
        AND pravi.has_department_role(asset."departmentId", NULL)
    )
    OR EXISTS (
      SELECT 1
      FROM pravi."WorkOrder" AS work_order
      WHERE work_order.id = target_work_order_id
        AND work_order."createdById" = pravi.current_profile_id()
        AND pravi.has_any_department_role(ARRAY['MAINTENANCE_OFFICER', 'ADMIN'])
    )
$$;

CREATE OR REPLACE FUNCTION pravi.can_view_profile(target_profile_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pravi
AS $$
  SELECT target_profile_id = pravi.current_profile_id()
    OR EXISTS (
      SELECT 1
      FROM pravi."RoleAssignment" AS target_assignment
      JOIN pravi."RoleAssignment" AS actor_assignment
        ON actor_assignment."departmentId" = target_assignment."departmentId"
      WHERE target_assignment."userId" = target_profile_id
        AND target_assignment.active
        AND actor_assignment."userId" = pravi.current_profile_id()
        AND actor_assignment.active
    )
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pravi FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pravi FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION pravi.current_clerk_user_id(), pravi.current_profile_id(),
  pravi.has_department_role(text, text[]), pravi.has_any_department_role(text[]),
  pravi.has_asset_role(text, text[]), pravi.can_access_asset(text),
  pravi.can_access_inspection(text), pravi.has_inspection_role(text, text[]),
  pravi.can_access_work_order(text), pravi.has_work_order_role(text, text[]), pravi.can_view_profile(text)
TO pravi_app;

ALTER TABLE pravi."Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."Department" FORCE ROW LEVEL SECURITY;
CREATE POLICY department_read_scope ON pravi."Department"
  FOR SELECT TO pravi_app USING (pravi.has_department_role(id, NULL));

ALTER TABLE pravi."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."UserProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY profile_read_scope ON pravi."UserProfile"
  FOR SELECT TO pravi_app USING (pravi.can_view_profile(id));

ALTER TABLE pravi."RoleAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."RoleAssignment" FORCE ROW LEVEL SECURITY;
CREATE POLICY role_assignment_read_scope ON pravi."RoleAssignment"
  FOR SELECT TO pravi_app USING (
    "userId" = pravi.current_profile_id()
    OR pravi.has_department_role("departmentId", NULL)
  );

ALTER TABLE pravi."Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."Asset" FORCE ROW LEVEL SECURITY;
CREATE POLICY asset_read_scope ON pravi."Asset"
  FOR SELECT TO pravi_app USING (pravi.has_department_role("departmentId", NULL));
CREATE POLICY asset_create_scope ON pravi."Asset"
  FOR INSERT TO pravi_app WITH CHECK (
    "createdById" = pravi.current_profile_id()
    AND pravi.has_department_role("departmentId", ARRAY['SUBMITTER', 'ADMIN'])
  );
CREATE POLICY asset_update_scope ON pravi."Asset"
  FOR UPDATE TO pravi_app
  USING (pravi.has_department_role("departmentId", ARRAY['SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'ADMIN']))
  WITH CHECK (pravi.has_department_role("departmentId", ARRAY['SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'ADMIN']));

ALTER TABLE pravi."RoadSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."RoadSegment" FORCE ROW LEVEL SECURITY;
CREATE POLICY road_segment_read_scope ON pravi."RoadSegment"
  FOR SELECT TO pravi_app USING (pravi.can_access_asset("assetId"));
CREATE POLICY road_segment_create_scope ON pravi."RoadSegment"
  FOR INSERT TO pravi_app WITH CHECK (
    pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'ADMIN'])
  );
CREATE POLICY road_segment_update_scope ON pravi."RoadSegment"
  FOR UPDATE TO pravi_app
  USING (pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'VERIFIER', 'ADMIN']))
  WITH CHECK (pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'VERIFIER', 'ADMIN']));

ALTER TABLE pravi."RoadSegmentStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."RoadSegmentStatusEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY road_status_event_read_scope ON pravi."RoadSegmentStatusEvent"
  FOR SELECT TO pravi_app USING (EXISTS (
    SELECT 1 FROM pravi."RoadSegment" AS road
    WHERE road.id = "roadSegmentId"
      AND pravi.can_access_asset(road."assetId")
  ));
CREATE POLICY road_status_event_append ON pravi."RoadSegmentStatusEvent"
  FOR INSERT TO pravi_app WITH CHECK (
    "actorId" = pravi.current_profile_id()
    AND EXISTS (
      SELECT 1 FROM pravi."RoadSegment" AS road
      WHERE road.id = "roadSegmentId"
        AND pravi.has_asset_role(road."assetId", ARRAY['SUBMITTER', 'VERIFIER', 'ADMIN'])
    )
  );

ALTER TABLE pravi."LifecycleEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."LifecycleEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_event_read_scope ON pravi."LifecycleEvent"
  FOR SELECT TO pravi_app USING (pravi.can_access_asset("assetId"));
CREATE POLICY lifecycle_event_append ON pravi."LifecycleEvent"
  FOR INSERT TO pravi_app WITH CHECK (
    "actorId" = pravi.current_profile_id()
    AND pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'ADMIN'])
  );

ALTER TABLE pravi."Inspection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."Inspection" FORCE ROW LEVEL SECURITY;
CREATE POLICY inspection_read_scope ON pravi."Inspection"
  FOR SELECT TO pravi_app USING (pravi.can_access_asset("assetId"));
CREATE POLICY inspection_create_scope ON pravi."Inspection"
  FOR INSERT TO pravi_app WITH CHECK (
    "inspectorId" = pravi.current_profile_id()
    AND pravi.has_asset_role("assetId", ARRAY['INSPECTOR', 'ADMIN'])
  );
CREATE POLICY inspection_update_scope ON pravi."Inspection"
  FOR UPDATE TO pravi_app
  USING (pravi.has_asset_role("assetId", ARRAY['INSPECTOR', 'VERIFIER', 'ADMIN']))
  WITH CHECK (pravi.has_asset_role("assetId", ARRAY['INSPECTOR', 'VERIFIER', 'ADMIN']));

ALTER TABLE pravi."InspectionEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."InspectionEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY inspection_event_read_scope ON pravi."InspectionEvent"
  FOR SELECT TO pravi_app USING (pravi.can_access_inspection("inspectionId"));
CREATE POLICY inspection_event_append ON pravi."InspectionEvent"
  FOR INSERT TO pravi_app WITH CHECK (
    "actorId" = pravi.current_profile_id()
    AND pravi.has_inspection_role("inspectionId", ARRAY['INSPECTOR', 'VERIFIER', 'ADMIN'])
  );

ALTER TABLE pravi."InspectionFinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."InspectionFinding" FORCE ROW LEVEL SECURITY;
CREATE POLICY inspection_finding_read_scope ON pravi."InspectionFinding"
  FOR SELECT TO pravi_app USING (pravi.can_access_inspection("inspectionId"));
CREATE POLICY inspection_finding_create_scope ON pravi."InspectionFinding"
  FOR INSERT TO pravi_app WITH CHECK (
    pravi.has_inspection_role("inspectionId", ARRAY['INSPECTOR', 'ADMIN'])
  );
CREATE POLICY inspection_finding_update_scope ON pravi."InspectionFinding"
  FOR UPDATE TO pravi_app
  USING (pravi.has_inspection_role("inspectionId", ARRAY['INSPECTOR', 'ADMIN']))
  WITH CHECK (pravi.has_inspection_role("inspectionId", ARRAY['INSPECTOR', 'ADMIN']));
CREATE POLICY inspection_finding_delete_scope ON pravi."InspectionFinding"
  FOR DELETE TO pravi_app USING (
    pravi.has_inspection_role("inspectionId", ARRAY['INSPECTOR', 'ADMIN'])
  );

ALTER TABLE pravi."WorkOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."WorkOrder" FORCE ROW LEVEL SECURITY;
CREATE POLICY work_order_read_scope ON pravi."WorkOrder"
  FOR SELECT TO pravi_app USING (pravi.can_access_work_order(id));
CREATE POLICY work_order_create_scope ON pravi."WorkOrder"
  FOR INSERT TO pravi_app WITH CHECK (
    "createdById" = pravi.current_profile_id()
    AND pravi.has_any_department_role(ARRAY['MAINTENANCE_OFFICER', 'ADMIN'])
  );
CREATE POLICY work_order_update_scope ON pravi."WorkOrder"
  FOR UPDATE TO pravi_app
  USING (pravi.has_work_order_role(id, ARRAY['MAINTENANCE_OFFICER', 'VERIFIER', 'ADMIN']))
  WITH CHECK (pravi.has_work_order_role(id, ARRAY['MAINTENANCE_OFFICER', 'VERIFIER', 'ADMIN']));

ALTER TABLE pravi."WorkOrderAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."WorkOrderAsset" FORCE ROW LEVEL SECURITY;
CREATE POLICY work_order_asset_read_scope ON pravi."WorkOrderAsset"
  FOR SELECT TO pravi_app USING (
    pravi.can_access_work_order("workOrderId")
    AND pravi.can_access_asset("assetId")
  );
CREATE POLICY work_order_asset_create_scope ON pravi."WorkOrderAsset"
  FOR INSERT TO pravi_app WITH CHECK (
    pravi.can_access_work_order("workOrderId")
    AND pravi.has_asset_role("assetId", ARRAY['MAINTENANCE_OFFICER', 'ADMIN'])
  );

ALTER TABLE pravi."WorkOrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."WorkOrderEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY work_order_event_read_scope ON pravi."WorkOrderEvent"
  FOR SELECT TO pravi_app USING (pravi.can_access_work_order("workOrderId"));
CREATE POLICY work_order_event_append ON pravi."WorkOrderEvent"
  FOR INSERT TO pravi_app WITH CHECK (
    "actorId" = pravi.current_profile_id()
    AND pravi.has_work_order_role("workOrderId", ARRAY['MAINTENANCE_OFFICER', 'VERIFIER', 'ADMIN'])
  );

ALTER TABLE pravi."Evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."Evidence" FORCE ROW LEVEL SECURITY;
CREATE POLICY evidence_read_scope ON pravi."Evidence"
  FOR SELECT TO pravi_app USING (pravi.can_access_asset("assetId"));
CREATE POLICY evidence_create_scope ON pravi."Evidence"
  FOR INSERT TO pravi_app WITH CHECK (
    "uploadedById" = pravi.current_profile_id()
    AND pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'ADMIN'])
  );

ALTER TABLE pravi."AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE pravi."AuditEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_read_scope ON pravi."AuditEvent"
  FOR SELECT TO pravi_app USING (
    "assetId" IS NOT NULL AND pravi.can_access_asset("assetId")
  );
CREATE POLICY audit_event_append ON pravi."AuditEvent"
  FOR INSERT TO pravi_app WITH CHECK (
    "actorId" = pravi.current_profile_id()
    AND "assetId" IS NOT NULL
    AND pravi.has_asset_role("assetId", ARRAY['SUBMITTER', 'VERIFIER', 'INSPECTOR', 'MAINTENANCE_OFFICER', 'ADMIN'])
  );
