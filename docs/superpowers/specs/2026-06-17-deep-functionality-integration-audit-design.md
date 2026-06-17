# Deep Functionality Integration Audit Design

## Goal

Find and remove misleading or unfinished behavior across the main MaternaLink routes. The work starts with a deep audit, then fixes issues in priority order: no dead UI, no dummy data, then end-to-end workflows across every role.

## Scope

Audit and repair these route groups:

- `/dashboard`
- `/patients`, `/patients/new`, `/patients/new/manual`, `/patients/new/kia-upload`
- `/queue`, `/queue/examination`
- `/forecast-calendar`
- `/medicine-needs`, `/medicine-needs/[medicine]`
- `/deliveries`
- `/ifk`, `/ifk/recommendations`, `/ifk/clinics`, `/ifk/environment`, `/ifk/decision-history`
- `/admin`, `/admin/users`, `/admin/medicines`, `/admin/health-centers`, `/admin/facility-profiles`

The implementation must preserve existing visual direction and route structure unless a control is proven misleading and should be removed.

## Priority Order

### Batch A: No Dead UI

Every visible control must have one clear behavior:

- `action`: calls an API or updates durable state.
- `navigation`: links to a real route.
- `modal`: opens a real modal that can save, apply, cancel, or close.
- `state-only`: search, filter, sort, tab, or pagination changes the visible state.
- `disabled-explained`: unavailable actions are disabled with a clear reason.
- `removed`: decorative or misleading controls are removed.

Fix order is primary actions, table row actions, filters/search/pagination, header icons, then export/print/download actions.

### Batch B: No Dummy Data

Domain data must come from the API and database when it represents a real entity or workflow:

- patients
- queue entries
- examinations
- puskesmas and facility profiles
- medicines and stock rows
- forecast runs and LPLPO rows
- distribution recommendations, tracking, alerts, and decision history
- users and role-specific dashboard summaries

Static data remains allowed for labels, route config, menu items, tab definitions, icon mappings, and empty-state copy. Fallback rows should not silently replace failed API data. On API failure, show an error and retry action.

### Batch C: All-Role End-To-End Workflow

Verify and repair workflows for all roles defined by the Prisma schema and seed data.

- `SUPER_ADMIN`: login, admin dashboard, user/master-data management, health center and facility profile management, and propagation of changed master data to operational pages.
- `BIDAN_PUSKESMAS`: login, patient registration, queue, examination, medicine stock or needs input, and relevant dashboard updates.
- `IFK_ADMIN`: login, IFK dashboard, recommendation review, quantity or reason edits, approve/reject decisions, tracking, and history updates.
- Any additional seeded role must receive at least a clear landing route, permission behavior, and smoke coverage.

Cross-role handoff matters: super-admin data affects bidan choices, bidan input affects IFK recommendations, and IFK decisions become visible in tracking/history.

## Audit Matrix

Create or maintain an audit matrix during implementation with this shape:

| Route | Component | Issue type | Severity | Current behavior | Expected behavior | Backend needed | Fix batch |
|---|---|---|---|---|---|---|---|
| `/admin/users` | `SuperAdminUsersContent` | `dummy_data`, `dead_ui` | blocker | local account rows and add/edit/delete buttons without persistence | users are loaded from API; add/edit/delete are real or disabled with reason | likely yes | A, B |
| `/admin/medicines` | `SuperAdminMedicinesContent` | `dummy_data`, `dead_ui` | blocker | fallback medicine rows and edit/add/filter/download gaps | medicine data uses master API; controls act predictably | partial | A, B |
| `/admin/health-centers` | `SuperAdminHealthCentersContent` | `dummy_data`, `dead_ui` | blocker | fallback puskesmas rows and action buttons without durable effect | puskesmas data uses master API; actions persist or are disabled | partial | A, B |
| `/admin/facility-profiles` | `SuperAdminFacilityProfilesContent` | `dummy_data`, `api_gap` | major | profile rows are static | profile data loads from DB or route explains unavailable fields | likely yes | A, B |
| `/medicine-needs` | `MedicineNeedsContent` | `dead_ui` | major | edit, shipment, upload, pagination, and modal submit actions are partly local or close-only | actions save, request, import, paginate, or show disabled reason | partial | A |
| `/medicine-needs/[medicine]` | `MedicationDetailContent` | `dead_ui`, `hardcoded_state` | major | analytics, remove, save, and timestamp are presentation-only | actions update/remove or are disabled with reason; timestamps reflect DB | partial | A, B |
| `/ifk/clinics` | `MedicineSenderClinicsContent` | `dead_ui`, `dummy_data` | major | clinic list has page buttons, export, add, filter, and menu gaps | list uses API, view/filter/export behave consistently | partial | A, B |
| `/ifk/environment` | `EnvironmentMonitoringContent` | `dummy_data` | major | environmental forecast and map context include static data | risk context is derived from DB/API or clearly marked unavailable | likely yes | B |
| `/ifk` | `MedicineSenderContent` | `hardcoded_state` | major | dashboard action/log data includes static module data | IFK dashboard is derived from recommendation, alert, and tracking APIs | partial | B |
| `/forecast-calendar` | `CalendarPredictionContent` | `workflow_gap` | major | demo workflow runner exists but needs route smoke and data refresh proof | workflow runner updates forecast/LPLPO/recommendation state visibly | existing | C |

The matrix is a starting inventory, not the final audit. Implementation should add missing rows discovered by code and browser checks.

## Backend Strategy

Prefer existing modules before adding new ones:

- `auth` for login, logout, current user, role routing.
- `dashboard` for role-specific summaries.
- `master` for puskesmas and medicine CRUD.
- `patients`, `queue`, and `examinations` for bidan workflow.
- `inputs`, `forecast`, and `lplpo` for stock and forecast workflow.
- `distribution` for IFK recommendations, plans, alerts, tracking, and decisions.

Add endpoints only when a visible UI has no durable backend path. New endpoints should follow existing Nest controller/service/DTO patterns and Prisma model names.

## Frontend Strategy

Keep each page visually stable. Replace static data sources with API calls in the owning feature component. Add small local state only for interaction behavior such as selected row, modal draft, pagination, and filters.

Controls that cannot be completed in the first implementation batch must be made honest. They should be disabled with a reason, hidden, or moved behind a clear unavailable state. They must not show fake success.

## Error Handling

- Loading states show before API data arrives.
- Empty states appear only when the API returns an empty collection.
- API errors show a message and retry action.
- Destructive actions require confirmation.
- Successful actions refresh from API after the mutation.
- Permission failures redirect to login or show a role-specific denial state.

## Testing And Verification

Implementation must run:

- `pnpm run build:api`
- `pnpm run build:web`
- `pnpm run test:e2e`

When local services are available, also run browser smoke checks for the scoped routes with each seeded role. The smoke checks should confirm that primary buttons, table actions, filters, modal close/save paths, and cross-role handoffs do not produce dead UI or fake success.

## Non-Goals

- Large visual redesigns.
- New dashboard information architecture unless a route is unusable.
- Replacing the Prisma schema wholesale.
- Building real OCR, ML, or external logistics integrations unless they are already present behind an API contract.
- Fixing unrelated dirty worktree changes outside the audited feature paths.
