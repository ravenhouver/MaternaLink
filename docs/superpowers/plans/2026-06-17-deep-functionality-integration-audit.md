# Deep Functionality Integration Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a route-level audit matrix and complete the first repair pass so main MaternaLink routes no longer expose dead or misleading UI.

**Architecture:** Treat the approved spec as a staged program: first create an auditable inventory, then repair controls in route groups while preserving existing UI. This plan focuses on Batch A and records Batch B/C issues discovered during implementation so follow-up plans can remove dummy data and complete all-role workflows without guessing.

**Tech Stack:** Next.js 15, React 18, NestJS 10, Prisma 5, TypeScript, pnpm, Jest/Supertest.

---

## Scope Check

The approved spec covers admin, bidan, IFK, stock, forecast, and cross-role workflows. That is too broad for one reliable implementation pass. This plan produces working software for the first slice: audit matrix plus no-dead-UI repairs across the scoped routes. Follow-up plans should handle Batch B API/data replacement and Batch C all-role workflow hardening using the matrix created here.

## File Structure

- Create: `docs/superpowers/audits/2026-06-17-functionality-audit.md` - living audit matrix for route issues and decisions.
- Modify: `apps/web/src/features/super-admin/super-admin-users-content.tsx` - make Add/Edit/Delete/Settings/Help/pagination honest.
- Modify: `apps/web/src/features/super-admin/super-admin-medicines-content.tsx` - make Add/Edit/Filter/Download/pagination honest.
- Modify: `apps/web/src/features/super-admin/super-admin-health-centers-content.tsx` - make Add/Edit/View/Activate/Deactivate/pagination honest.
- Modify: `apps/web/src/features/super-admin/super-admin-facility-profiles-content.tsx` - make profile actions and header icons honest.
- Modify: `apps/web/src/features/medicine/medicine-needs-content.tsx` - make edit/shipment/upload/pagination modal actions honest.
- Modify: `apps/web/src/features/medicine/medication-detail-content.tsx` - make analytics/remove/save/print controls honest.
- Modify: `apps/web/src/features/medicine-sender/medicine-sender-clinics-content.tsx` - make filter/export/add/menu/pagination actions honest.
- Modify: `apps/web/src/features/medicine-sender/medicine-sender-content.tsx` - make dashboard header icons and static action panels honest.
- Modify: `apps/web/src/features/environment-monitoring/environment-monitoring-content.tsx` - make collapse/filter/risk controls honest.
- Modify: `apps/web/src/features/calendar/calendar-prediction-content.tsx` - make workflow runner refresh feedback explicit.
- Modify: `apps/web/src/components/ui/app-icon.tsx` only if an existing action needs an icon already represented by local patterns.
- Test: `pnpm run build:web`, `pnpm run build:api`, `pnpm run test:e2e`.

### Task 1: Create The Audit Matrix

**Files:**
- Create: `docs/superpowers/audits/2026-06-17-functionality-audit.md`
- Read: `docs/superpowers/specs/2026-06-17-deep-functionality-integration-audit-design.md`

- [ ] **Step 1: Create the audit file from the approved spec**

Use this exact file content as the starting point:

```markdown
# MaternaLink Functionality Audit - 2026-06-17

## Priority

1. Batch A: no dead UI.
2. Batch B: no dummy data.
3. Batch C: all-role end-to-end workflow.

## Matrix

| Route | Component | Issue type | Severity | Current behavior | Expected behavior | Backend needed | Fix batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/admin/users` | `SuperAdminUsersContent` | `dummy_data`, `dead_ui` | blocker | local account rows and add/edit/delete buttons without persistence | users are loaded from API; add/edit/delete are real or disabled with reason | yes | A, B | open | Start with honest disabled/modal behavior, then API users in Batch B. |
| `/admin/medicines` | `SuperAdminMedicinesContent` | `dummy_data`, `dead_ui` | blocker | fallback medicine rows and edit/add/filter/download gaps | medicine data uses master API; controls act predictably | partial | A, B | open | Master medicine API exists. |
| `/admin/health-centers` | `SuperAdminHealthCentersContent` | `dummy_data`, `dead_ui` | blocker | fallback puskesmas rows and action buttons without durable effect | puskesmas data uses master API; actions persist or are disabled | partial | A, B | open | Master puskesmas API exists. |
| `/admin/facility-profiles` | `SuperAdminFacilityProfilesContent` | `dummy_data`, `api_gap` | major | profile rows are static | profile data loads from DB or route explains unavailable fields | yes | A, B | open | Likely needs backend endpoint later. |
| `/medicine-needs` | `MedicineNeedsContent` | `dead_ui` | major | edit, shipment, upload, pagination, and modal submit actions are partly local or close-only | actions save, request, import, paginate, or show disabled reason | partial | A | open | Avoid fake close-only success. |
| `/medicine-needs/[medicine]` | `MedicationDetailContent` | `dead_ui`, `hardcoded_state` | major | analytics, remove, save, and timestamp are presentation-only | actions update/remove or are disabled with reason; timestamps reflect DB | partial | A, B | open | Detail route already reads API stock/medicine. |
| `/ifk/clinics` | `MedicineSenderClinicsContent` | `dead_ui`, `dummy_data` | major | clinic list has page buttons, export, add, filter, and menu gaps | list uses API, view/filter/export behave consistently | partial | A, B | open | View detail already works locally. |
| `/ifk/environment` | `EnvironmentMonitoringContent` | `dummy_data` | major | environmental forecast and map context include static data | risk context is derived from DB/API or clearly marked unavailable | yes | B | open | Batch A only handles visible dead controls. |
| `/ifk` | `MedicineSenderContent` | `hardcoded_state` | major | dashboard action/log data includes static module data | IFK dashboard is derived from recommendation, alert, and tracking APIs | partial | B | open | Batch A handles controls. |
| `/forecast-calendar` | `CalendarPredictionContent` | `workflow_gap` | major | demo workflow runner exists but needs route smoke and data refresh proof | workflow runner updates forecast/LPLPO/recommendation state visibly | existing | C | open | Batch A verifies visible feedback. |
```

- [ ] **Step 2: Verify the file is tracked despite `docs/` ignore**

Run:

```powershell
git check-ignore -v docs\superpowers\audits\2026-06-17-functionality-audit.md
```

Expected: output mentions `.gitignore` and `docs`, so later add with `git add -f`.

- [ ] **Step 3: Commit the audit baseline**

Run:

```powershell
git add -f docs\superpowers\audits\2026-06-17-functionality-audit.md
git commit -m "docs: add functionality audit baseline" -- docs\superpowers\audits\2026-06-17-functionality-audit.md
```

Expected: one commit with the audit file only.

### Task 2: Add Shared Honest-UI Helpers Inside Existing Components

**Files:**
- Modify: each touched feature component as needed; do not create a new shared helper until at least three files need identical behavior.

- [ ] **Step 1: For every dead button, choose a behavior category before editing**

Use this decision table while editing each route group:

```text
Primary domain mutation available in API -> action
Existing destination route exists -> navigation
Needs short user input -> modal
Only filters current rows -> state-only
Feature belongs to Batch B/C -> disabled-explained
Decorative duplicate control -> removed
```

- [ ] **Step 2: Use a local unavailable message pattern for Batch B/C controls**

When a component has no existing message area, add local state with this shape near other `useState` calls:

```tsx
const [notice, setNotice] = useState<string | null>(null);
```

Render it near the toolbar or card header:

```tsx
{notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}
```

If the CSS module lacks `noticeText`, add a small style matching the local design language:

```css
.noticeText {
  margin: 0;
  color: #4b5563;
  font-size: 13px;
}
```

- [ ] **Step 3: Use this exact disabled handler for unavailable future actions**

```tsx
function explainUnavailable(feature: string) {
  setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
}
```

Buttons that are visible but not implemented must use it:

```tsx
<button type="button" onClick={() => explainUnavailable('Add user')}>
  Add User
</button>
```

- [ ] **Step 4: Run a quick type/build check after the first component edit**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: build completes or fails only with a pre-existing unrelated issue captured in the task notes.

### Task 3: Repair Super Admin Route Controls

**Files:**
- Modify: `apps/web/src/features/super-admin/super-admin-users-content.tsx`
- Modify: `apps/web/src/features/super-admin/super-admin-medicines-content.tsx`
- Modify: `apps/web/src/features/super-admin/super-admin-health-centers-content.tsx`
- Modify: `apps/web/src/features/super-admin/super-admin-facility-profiles-content.tsx`
- Update: `docs/superpowers/audits/2026-06-17-functionality-audit.md`

- [ ] **Step 1: Users page - make Add/Edit/Delete honest**

Expected behavior:

```text
Add User -> opens a small modal or notice explaining user API integration is Batch B.
Edit row -> opens modal/notice naming the selected user.
Delete row -> opens confirm-style modal/notice, but does not fake deletion.
Pagination -> if local row count fits one page, remove fake page buttons or disable with clear state.
Settings/Help -> show notice instead of anchor-only hash navigation.
```

- [ ] **Step 2: Medicines page - preserve current local search/filter, fix fake actions**

Expected behavior:

```text
Search and category filter keep working locally.
Add Medicine -> notice or modal explaining master medicine mutation is Batch B if not wired now.
Edit -> notice naming selected medicine if no API mutation is implemented in this task.
Advanced filter -> opens lightweight filter panel or shows notice.
Download -> export current visible rows to CSV if simple; otherwise show disabled-explained.
Pagination -> remove fake pages or implement local pagination over current rows.
```

CSV export can be implemented with this local helper if selected:

```tsx
function downloadCsv(filename: string, rows: MedicineRow[]) {
  const header = ['id', 'name', 'category', 'unit', 'stock'].join(',');
  const body = rows.map((row) => [row.id, row.name, row.category, row.unit, row.stock].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Health centers page - preserve search, fix row actions**

Expected behavior:

```text
Add Health Center -> notice or modal if not persisted in this task.
Edit/View/Detail -> show selected row modal using existing row data.
Activate/Deactivate -> confirm modal/notice, no fake status change unless API call is wired.
Pagination -> remove fake pages or implement local pagination.
```

- [ ] **Step 4: Facility profiles page - make static profile actions explicit**

Expected behavior:

```text
Any visible profile action opens detail/notice with selected profile.
Header settings/help/notifications behave like the other admin pages.
Audit matrix records that durable facility profile API is Batch B.
```

- [ ] **Step 5: Update audit statuses**

Change admin rows in the audit matrix from `open` to `batch_a_done` when the route has no dead controls left. Add notes for every remaining Batch B API requirement.

- [ ] **Step 6: Build and commit**

Run:

```powershell
pnpm --filter @maternalink/web build
git add -f docs\superpowers\audits\2026-06-17-functionality-audit.md
git add apps\web\src\features\super-admin\super-admin-users-content.tsx apps\web\src\features\super-admin\super-admin-medicines-content.tsx apps\web\src\features\super-admin\super-admin-health-centers-content.tsx apps\web\src\features\super-admin\super-admin-facility-profiles-content.tsx
git commit -m "fix: make super admin controls honest"
```

Expected: web build passes; commit includes only admin route files and audit file.

### Task 4: Repair Medicine Route Controls

**Files:**
- Modify: `apps/web/src/features/medicine/medicine-needs-content.tsx`
- Modify: `apps/web/src/features/medicine/medication-detail-content.tsx`
- Update: `docs/superpowers/audits/2026-06-17-functionality-audit.md`

- [ ] **Step 1: Medicine needs page - keep existing real stock save path**

Do not break these existing behaviors:

```text
Refresh -> calls `refreshRows()`.
Select medication + quantity + Add Medication -> calls `saveStock()`.
Save -> calls `saveStock()`.
View detail -> navigates to `/medicine-needs/[medicine]`.
```

- [ ] **Step 2: Replace close-only modal submits**

Expected behavior:

```text
Edit stock modal Save -> either calls the same stock save path with selected row values or shows disabled-explained if required fields are unavailable.
Shipment modal Submit Request -> disabled-explained unless a distribution allocation endpoint is wired in the same task.
Upload modal Confirm & Enter into Form -> transfers parsed preview values into the form if available; otherwise disabled-explained.
Pagination -> remove fake page 2/3 controls or implement local pagination.
```

- [ ] **Step 3: Medication detail page - remove fake action affordances**

Expected behavior:

```text
Print -> calls `window.print()`.
View Detailed Analytics -> disabled-explained or opens a detail panel based on existing stock rows.
Daily dropdown -> state-only menu if choices exist, otherwise remove.
View All History -> expands all loaded stock history or disabled-explained.
Remove from Inventory -> confirm then disabled-explained unless `DELETE /master/obat/:id` is wired.
Save Changes -> disabled-explained unless there are editable fields in the page.
```

- [ ] **Step 4: Update audit statuses**

Set medicine route rows to `batch_a_done` when all visible controls are action, navigation, modal, state-only, disabled-explained, or removed.

- [ ] **Step 5: Build and commit**

Run:

```powershell
pnpm --filter @maternalink/web build
git add -f docs\superpowers\audits\2026-06-17-functionality-audit.md
git add apps\web\src\features\medicine\medicine-needs-content.tsx apps\web\src\features\medicine\medication-detail-content.tsx
git commit -m "fix: make medicine route controls honest"
```

Expected: web build passes; commit contains medicine route files and audit file.

### Task 5: Repair IFK Route Controls

**Files:**
- Modify: `apps/web/src/features/medicine-sender/medicine-sender-clinics-content.tsx`
- Modify: `apps/web/src/features/medicine-sender/medicine-sender-content.tsx`
- Modify: `apps/web/src/features/environment-monitoring/environment-monitoring-content.tsx`
- Update: `docs/superpowers/audits/2026-06-17-functionality-audit.md`

- [ ] **Step 1: Preserve existing recommendation review behavior**

Do not regress `apps/web/src/features/medicine-sender/medicine-sender-recommendations-content.tsx`. It already calls recommendation APIs for filter, refresh, edit, approve, reject, tracking, and reorder.

- [ ] **Step 2: Clinics page - fix controls**

Expected behavior:

```text
View eye button -> keeps opening existing detail.
Filter -> opens local filter panel or filters by visible row fields.
Export CSV -> downloads current visible clinics.
Add Clinic -> disabled-explained unless API mutation is wired.
More menu -> opens local menu with available actions, not inert icon button.
Pagination -> remove fake pages or implement local pagination.
```

- [ ] **Step 3: IFK dashboard - fix header and action panel controls**

Expected behavior:

```text
Review queue -> navigates to recommendations.
Map/Satellite -> keeps state-only segment behavior.
Notification/settings -> show notice panel or disabled-explained.
Static dashboard actions/logs -> record Batch B issue in audit; do not show fake action success.
```

- [ ] **Step 4: Environment page - fix visible controls only**

Expected behavior:

```text
Collapse/expand controls keep working locally.
Any filter/action buttons are state-only or disabled-explained.
Static forecast/environment data remains recorded as Batch B.
```

- [ ] **Step 5: Update audit statuses**

Set IFK route rows to `batch_a_done` when no dead UI remains. Keep `dummy_data` notes open for Batch B.

- [ ] **Step 6: Build and commit**

Run:

```powershell
pnpm --filter @maternalink/web build
git add -f docs\superpowers\audits\2026-06-17-functionality-audit.md
git add apps\web\src\features\medicine-sender\medicine-sender-clinics-content.tsx apps\web\src\features\medicine-sender\medicine-sender-content.tsx apps\web\src\features\environment-monitoring\environment-monitoring-content.tsx
git commit -m "fix: make ifk route controls honest"
```

Expected: web build passes; commit includes IFK route files and audit file.

### Task 6: Repair Forecast Calendar Feedback

**Files:**
- Modify: `apps/web/src/features/calendar/calendar-prediction-content.tsx`
- Update: `docs/superpowers/audits/2026-06-17-functionality-audit.md`

- [ ] **Step 1: Preserve existing workflow API call**

Keep `runDemoWorkflow()` and related API usage intact.

- [ ] **Step 2: Make run feedback explicit**

Expected behavior:

```text
Run button disables while running.
Success message identifies that forecast/LPLPO/recommendation data was refreshed.
Failure message shows API error.
After success, visible patients/events/summary refresh from API if existing component already has fetch paths; otherwise audit notes Batch C refresh gap.
```

- [ ] **Step 3: Update audit status**

Set `/forecast-calendar` to `batch_a_done` only if the visible runner has no fake success or silent failure.

- [ ] **Step 4: Build and commit**

Run:

```powershell
pnpm --filter @maternalink/web build
git add -f docs\superpowers\audits\2026-06-17-functionality-audit.md
git add apps\web\src\features\calendar\calendar-prediction-content.tsx
git commit -m "fix: clarify forecast workflow feedback"
```

Expected: web build passes; commit includes calendar component and audit file.

### Task 7: Repository Verification

**Files:**
- Read: `package.json`
- Update: `docs/superpowers/audits/2026-06-17-functionality-audit.md` only if verification discovers new gaps.

- [ ] **Step 1: Run API build**

Run:

```powershell
pnpm run build:api
```

Expected: Nest build passes.

- [ ] **Step 2: Run web build**

Run:

```powershell
pnpm run build:web
```

Expected: Next build passes.

- [ ] **Step 3: Run API e2e tests**

Run:

```powershell
pnpm run test:e2e
```

Expected: Jest e2e suite passes. If DB is unavailable, capture the exact connection error and do not claim e2e passed.

- [ ] **Step 4: Inspect final diff**

Run:

```powershell
git status --short
git diff --stat HEAD
```

Expected: only intended uncommitted changes remain, or clean relative to this plan's commits except pre-existing dirty worktree files.

### Task 8: Prepare Follow-Up Batch B/C Plans

**Files:**
- Read: `docs/superpowers/audits/2026-06-17-functionality-audit.md`
- Create later: `docs/superpowers/plans/2026-06-17-no-dummy-data-integration.md`
- Create later: `docs/superpowers/plans/2026-06-17-all-role-e2e-workflows.md`

- [ ] **Step 1: List remaining Batch B issues from the audit matrix**

Run:

```powershell
Select-String -Path docs\superpowers\audits\2026-06-17-functionality-audit.md -Pattern "B |A, B|dummy_data|api_gap"
```

Expected: list of rows that still need API/DB integration.

- [ ] **Step 2: List remaining Batch C issues from the audit matrix**

Run:

```powershell
Select-String -Path docs\superpowers\audits\2026-06-17-functionality-audit.md -Pattern "C |workflow_gap|role|handoff"
```

Expected: list of rows that still need all-role workflow verification.

- [ ] **Step 3: Stop after reporting next plan boundaries**

Report the remaining Batch B/C boundaries to the user before writing the follow-up plans. Do not silently expand this plan into backend feature work.

## Self-Review Notes

- Spec coverage: this plan covers the audit matrix, Batch A no-dead-UI pass, verification commands, and follow-up boundaries for Batch B/C.
- Intentional gap: full no-dummy-data and all-role E2E implementation are deferred into separate plans because the approved spec spans multiple subsystems.
- Red-flag scan: this plan contains no incomplete implementation markers.
