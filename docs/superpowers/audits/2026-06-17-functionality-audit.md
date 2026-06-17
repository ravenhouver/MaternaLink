# MaternaLink Functionality Audit - 2026-06-17

## Priority

1. Batch A: no dead UI.
2. Batch B: no dummy data.
3. Batch C: all-role end-to-end workflow.

## Matrix

| Route | Component | Issue type | Severity | Current behavior | Expected behavior | Backend needed | Fix batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| /admin/users | SuperAdminUsersContent | dummy_data, dead_ui | blocker | local account rows and add/edit/delete buttons without persistence | users are loaded from API; add/edit/delete are real or disabled with reason | yes | A, B | batch_a_done | Add/edit/delete/settings/help/notifications now show explicit Batch B notices; fake pagination removed. |
| /admin/medicines | SuperAdminMedicinesContent | dummy_data, dead_ui | blocker | fallback medicine rows and edit/add/filter/download gaps | medicine data uses master API; controls act predictably | partial | A, B | batch_a_done | Download exports visible rows; add/edit/advanced filters show explicit Batch B notices; fake pagination removed. |
| /admin/health-centers | SuperAdminHealthCentersContent | dummy_data, dead_ui | blocker | fallback puskesmas rows and action buttons without durable effect | puskesmas data uses master API; actions persist or are disabled | partial | A, B | batch_a_done | Row actions/add/settings/help/notifications now show explicit Batch B notices; fake pagination removed. |
| /admin/facility-profiles | SuperAdminFacilityProfilesContent | dummy_data, api_gap | major | profile rows are static | profile data loads from DB or route explains unavailable fields | yes | A, B | batch_a_done | Edit/complete/settings/help/notifications now show explicit Batch B notices; fake pagination removed. |
| /medicine-needs | MedicineNeedsContent | dead_ui | major | edit, shipment, upload, pagination, and modal submit actions are partly local or close-only | actions save, request, import, paginate, or show disabled reason | partial | A | batch_a_done | Edit modal saves stock through existing API; shipment/upload show explicit Batch B notices; fake pagination removed. |
| /medicine-needs/[medicine] | MedicationDetailContent | dead_ui, hardcoded_state | major | analytics, remove, save, and timestamp are presentation-only | actions update/remove or are disabled with reason; timestamps reflect DB | partial | A, B | batch_a_done | Print/history actions work; analytics/remove/save show explicit Batch B notices; update timestamp uses stock data. |
| /ifk/clinics | MedicineSenderClinicsContent | dead_ui, dummy_data | major | clinic list has page buttons, export, add, filter, and menu gaps | list uses API, view/filter/export behave consistently | partial | A, B | batch_a_done | View/detail works; export CSV works; filter/add/menu/topbar actions show explicit Batch B notices; fake pagination removed. |
| /ifk/environment | EnvironmentMonitoringContent | dummy_data | major | environmental forecast and map context include static data | risk context is derived from DB/API or clearly marked unavailable | yes | B | batch_a_done | Print/collapse work; settings/topbar actions show explicit Batch B notices; route IDs are no longer fake anchor links. |
| /ifk | MedicineSenderContent | hardcoded_state | major | dashboard action/log data includes static module data | IFK dashboard is derived from recommendation, alert, and tracking APIs | partial | B | batch_a_done | Review queue/map mode work; settings/topbar actions show explicit Batch B notices. |
| /forecast-calendar | CalendarPredictionContent | workflow_gap | major | demo workflow runner exists but needs route smoke and data refresh proof | workflow runner updates forecast/LPLPO/recommendation state visibly | existing | C | batch_a_done | Run button disables while running, API errors show, and success refetches patient calendar data with explicit refresh message. |
