# MaternaLink Functionality Audit - 2026-06-17

## Priority

1. Batch A: no dead UI.
2. Batch B: no dummy data.
3. Batch C: all-role end-to-end workflow.

## Matrix

| Route | Component | Issue type | Severity | Current behavior | Expected behavior | Backend needed | Fix batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| /admin/users | SuperAdminUsersContent | mutation_gap | major | account rows load from `/auth/users`; add/edit/delete are not persisted | add/edit/delete need durable account mutation flow | partial | B | batch_b_partial | User list is DB-backed through SUPER_ADMIN-only API; passwordHash is not exposed; add/edit/delete remain explicit unavailable notices. |
| /admin/medicines | SuperAdminMedicinesContent | mutation_gap | major | medicine rows load from `/master/obat`; add/edit still unavailable | add/edit should call existing master mutation endpoints with form validation | existing | B | batch_b_partial | Removed design fallback rows; empty/error states are honest; CSV export uses visible API rows. |
| /admin/health-centers | SuperAdminHealthCentersContent | mutation_gap | major | health center rows load from `/master/puskesmas`; add/edit/activate remain unavailable | add/edit/activate should call existing master mutation endpoints with form validation | existing | B | batch_b_partial | Removed design fallback rows; table uses DB rows and honest empty/error states. |
| /admin/facility-profiles | SuperAdminFacilityProfilesContent | mutation_gap | major | profile rows derive from `/master/puskesmas` logistics metadata | complete/edit should patch puskesmas logistics fields | existing | B | batch_b_partial | Removed static profile rows; lead time, access, cold chain, distance, capacity derive from DB. |
| /medicine-needs | MedicineNeedsContent | dead_ui | major | edit, shipment, upload, pagination, and modal submit actions are partly local or close-only | actions save, request, import, paginate, or show disabled reason | partial | A | batch_a_done | Edit modal saves stock through existing API; shipment/upload show explicit Batch B notices; fake pagination removed. |
| /medicine-needs/[medicine] | MedicationDetailContent | dead_ui, hardcoded_state | major | analytics, remove, save, and timestamp are presentation-only | actions update/remove or are disabled with reason; timestamps reflect DB | partial | A, B | batch_a_done | Print/history actions work; analytics/remove/save show explicit Batch B notices; update timestamp uses stock data. |
| /ifk/clinics | MedicineSenderClinicsContent | dead_ui, dummy_data | major | clinic list has page buttons, export, add, filter, and menu gaps | list uses API, view/filter/export behave consistently | partial | A, B | batch_a_done | View/detail works; export CSV works; filter/add/menu/topbar actions show explicit Batch B notices; fake pagination removed. |
| /ifk/environment | EnvironmentMonitoringContent | dummy_data | major | environmental forecast and map context include static data | risk context is derived from DB/API or clearly marked unavailable | yes | B | batch_a_done | Print/collapse work; settings/topbar actions show explicit Batch B notices; route IDs are no longer fake anchor links. |
| /ifk | MedicineSenderContent | hardcoded_state | major | dashboard action/log data includes static module data | IFK dashboard is derived from recommendation, alert, and tracking APIs | partial | B | batch_a_done | Review queue/map mode work; settings/topbar actions show explicit Batch B notices. |
| /forecast-calendar | CalendarPredictionContent | workflow_gap | major | demo workflow runner exists but needs route smoke and data refresh proof | workflow runner updates forecast/LPLPO/recommendation state visibly | existing | C | batch_a_done | Run button disables while running, API errors show, and success refetches patient calendar data with explicit refresh message. |
