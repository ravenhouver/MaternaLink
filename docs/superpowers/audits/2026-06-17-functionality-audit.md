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
| /medicine-needs/[medicine] | MedicationDetailContent | mutation_gap | major | detail, history, stock prediction, and timestamp use stock/medicine API; remove/save remain unavailable | remove/save need durable medicine mutation form | partial | B | batch_b_partial | Removed hardcoded timestamp/state; remaining gap is intentional disabled mutation controls. |
| /ifk/clinics | MedicineSenderClinicsContent | mutation_gap | major | clinic list/detail derive from puskesmas, recommendations, and tracking APIs | add clinic and advanced filters need durable form/filter implementation | partial | B | batch_b_partial | Removed static clinic detail copy, route history, nearby clinics, urgency/confidence values, and fake supply text. |
| /ifk/environment | EnvironmentMonitoringContent | none | resolved | risk cards, route table, alert feed, and map points derive from DB/API | persisted facility coordinates feed map heat points | done | B | batch_b_done | Added puskesmas latitude/longitude migration, seed data, API type, and map rendering from DB coordinates. |
| /ifk | MedicineSenderContent | none | resolved | dashboard KPIs/actions/logs and map route markers derive from DB/API | persisted facility coordinates feed route markers | done | B | batch_b_done | Added puskesmas latitude/longitude and removed hardcoded route marker coordinates/static officer labels. |
| /forecast-calendar | CalendarPredictionContent | workflow_gap | major | demo workflow runner refreshes visible calendar state after run | workflow runner updates forecast/LPLPO/recommendation state visibly across roles | existing | C | batch_c_verified | Run button disables while running, API errors show, success refetches patient calendar data, and API e2e verifies Super Admin -> Bidan -> IFK -> Bidan tracking handoff. |
