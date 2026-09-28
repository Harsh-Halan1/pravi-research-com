---
name: asset-category-scaffold
description: Plan, design, and scaffold new asset categories in the Pravi infrastructure platform. Use when designing models, migrations, forms, or workflows for new physical asset classes (e.g. bridges, public buildings, water facilities) following the completion of the road-segment slice.
---

# Asset Category Scaffolding Guide

## Purpose

Establish a structured, consistent pattern for adding new physical infrastructure asset classes to Pravi without compromising the shared asset contract or prematurely forcing different physical realities into one generic workflow.

## Boundary rules

1. **Finish the road-segment slice first:** Complete the primary road-segment vertical slice (registration, verification, inspection, maintenance, and audit reporting) before scaffolding additional categories.
2. **Preserve the shared asset contract:** Every physical asset belongs to a parent `Asset` record containing:
   - Stable identity (`id`, `assetCode`, `name`)
   - Asset category discriminator (`assetType` enum)
   - Owning department & jurisdiction (`departmentId`)
   - High-level lifecycle stage (`lifecycleStage`)
   - Representative geographic coordinates (`latitude`, `longitude`)
   - Current condition projection (`currentCondition`)
3. **Category-specific operational models:** Do not force category-specific attributes (e.g. bridge clearance, building occupancy, water flow rate) into JSON blobs or loose generic columns. Create dedicated relational models (e.g. `BridgeDetail`, `BuildingDetail`) linked 1-to-1 to `Asset`.
4. **Distinct lifecycle state machines:** Each asset category may have distinct engineering review gates, statutory compliance steps, and inspection standards. Define category-specific workflow status enums and dedicated status event models.

## Scaffolding checklist

1. **Domain research & decisions:** Record confirmed decisions, prototype assumptions, and open questions in `Decision.md` before altering schema.
2. **Schema migration:**
   - Add new category literal to `AssetType` enum in `prisma/schema.prisma`.
   - Define dedicated 1-to-1 extension table with foreign key to `Asset`.
   - Define category-specific workflow status enum and append-only status event model.
   - Run `npx prisma validate` and generate a dedicated migration.
3. **Server actions & workflow policies:**
   - Implement category-specific transition policies in `src/lib/workflow-policies.ts`.
   - Create scoped server actions for registration, verification, and correction.
4. **UI components & routes:**
   - Add category-specific registration form and field validation.
   - Extend the asset detail view with category-specific attribute cards and workflows.
   - Maintain unified application shell, breadcrumbs, and localization strings.
