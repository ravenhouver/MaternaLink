# Responsive Component Refactor Design

Date: 2026-06-06
Workspace: `D:\Furap-Jogja`
App: `apps/web`

## Goal

Refactor the current Figma-sliced frontend into a responsive, component-based Next.js UI while preserving the current visual direction. The current implementation is tied too closely to the original Figma canvas and page-level components. This causes stretching on real screens and makes reuse hard.

The refactor covers all current web pages:

- `/`
- `/master`
- `/forecast`
- `/lplpo`
- `/master/add-patient`

Target viewports are `1440`, `1280`, `1024`, `768`, and `390` pixels wide.

## Current Context

`apps/web` is a Next.js 15 and React 18 app using Ant Design. Current UI code is concentrated in large page components under `apps/web/src/components`:

- `dashboard-content.tsx`
- `patients-page-content.tsx`
- `calendar-prediction-content.tsx`
- `medicine-needs-content.tsx`
- `add-patient-method-content.tsx`
- `app-shell.tsx`

Most styles live in `apps/web/src/app/globals.css`, which is about 3192 lines. This mixes reset, shell styles, page-specific styles, and component styles. Several layouts use fixed dimensions, fixed grid assumptions, or max widths from the Figma source.

## Design Direction

Use a practical component hierarchy. Avoid making every DOM element a component, but split each page into reusable layout, section, card, table, and form units.

Keep Ant Design as the base UI dependency. Wrap Ant Design controls where the app needs a consistent visual contract.

Use CSS Modules for component and feature styles. Keep `globals.css` small and reserved for global reset, body defaults, app-level tokens, and any unavoidable Ant Design global overrides.

## Target Structure

```text
apps/web/src/components/layout/
  app-shell.tsx
  sidebar.tsx
  topbar.tsx
  page-container.tsx
  page-header.tsx
  breadcrumbs.tsx

apps/web/src/components/ui/
  action-card.tsx
  form-field.tsx
  icon-button.tsx
  metric-card.tsx
  responsive-card-grid.tsx
  section-header.tsx
  status-pill.tsx
  step-indicator.tsx

apps/web/src/features/dashboard/
  dashboard-content.tsx
  dashboard-data.ts
  components/
    dashboard-header.tsx
    alert-banner.tsx
    stats-grid.tsx
    quick-actions.tsx
    activity-list.tsx

apps/web/src/features/patients/
  patients-page-content.tsx
  patients-data.ts
  components/
    patients-header.tsx
    patients-filters.tsx
    patients-table.tsx
    pagination-bar.tsx

apps/web/src/features/calendar/
  calendar-prediction-content.tsx
  calendar-data.ts
  components/
    calendar-summary.tsx
    calendar-toolbar.tsx
    monthly-calendar.tsx
    events-panel.tsx

apps/web/src/features/medicine/
  medicine-needs-content.tsx
  medicine-data.ts
  components/
    medicine-header.tsx
    medicine-section-card.tsx
    medicine-item-row.tsx
    submission-card.tsx

apps/web/src/features/patient-registration/
  add-patient-method-content.tsx
  registration-data.ts
  components/
    add-patient-method-selector.tsx
    input-method-card.tsx
    manual-patient-registration.tsx
    registration-step-one.tsx
    registration-step-two.tsx
    registration-step-three.tsx
```

Page files under `apps/web/src/app` should import from `src/features/*`, not from page-level files in `src/components`.

Feature root folders should stay shallow. Each root contains only the entry-point composer, resource/data files, and other feature-level constants or types. Feature-specific UI parts live under that feature's `components/` folder.

## Layout Design

`AppShell` becomes a composition layer:

- `Sidebar` owns brand, navigation, collapsed state visuals, and profile block.
- `Topbar` owns mobile/tablet top actions and page-level app identity.
- `PageContainer` owns content width, responsive padding, and vertical spacing.
- `Breadcrumbs` provides consistent breadcrumb markup across pages.
- `PageHeader` provides title, subtitle, optional actions, and consistent wrapping.

Large desktop should not stretch content endlessly. Content should use a controlled maximum width and remain centered or aligned consistently inside the shell. The shell should use responsive content padding instead of hard-coded Figma spacing.

## Shared UI Components

Shared components should have small, clear contracts:

- `IconButton`: fixed-size icon action with accessible label.
- `MetricCard`: reusable metric/stat card with icon, label, value, optional tag, and accent color.
- `StatusPill`: status/risk/stock labels with tone variants.
- `SectionHeader`: title with optional icon/action.
- `ActionCard`: click target for quick actions and method choices.
- `ResponsiveCardGrid`: common grid wrapper using responsive minmax columns.
- `FormField`: label, hint, input wrapper, and validation-ready layout.
- `StepIndicator`: registration stepper with responsive label handling.

These components should not know feature-specific copy or data shape beyond props.

## Feature Components

### Dashboard

`DashboardContent` should compose:

- `DashboardHeader`
- `AlertBanner`
- `StatsGrid`
- `QuickActions`
- `ActivityList`
- existing floating action button behavior

Dashboard data moves into `dashboard-data.ts`.

### Patients

`PatientsPageContent` should compose:

- `PatientsHeader`
- `PatientsFilters`
- `PatientsTable`
- `PaginationBar`

The Ant Design table keeps horizontal scroll for small screens. Page-level horizontal overflow is not allowed; only the table container may scroll.

### Calendar

`CalendarPredictionContent` should compose:

- `CalendarSummary`
- `CalendarToolbar`
- `MonthlyCalendar`
- `EventsPanel`

The calendar grid should preserve a stable seven-column grid on desktop and tablet. On narrow screens, it should remain readable with smaller cell spacing and internal sizing, not overflow the page.

### Medicine

`MedicineNeedsContent` should compose:

- `MedicineHeader`
- `MedicineSectionCard`
- `MedicineItemRow`
- `SubmissionCard`

Medicine sections should collapse from three columns to two and then one column.

### Add Patient and Registration

`AddPatientMethodContent` keeps the mode switch between method selection and manual registration, but delegates UI to focused children:

- `AddPatientMethodSelector`
- `InputMethodCard`
- `ManualPatientRegistration`
- `RegistrationStepOne`
- `RegistrationStepTwo`
- `RegistrationStepThree`

Registration step state stays in `ManualPatientRegistration`. Form sections use shared `FormField`, `StepIndicator`, and reusable card/panel styles.

## Responsive Rules

General rules:

- No page root depends on a fixed Figma canvas size.
- Use `width: min(100%, value)` for constrained content.
- Use `grid-template-columns: repeat(auto-fit, minmax(...))` where cards can naturally wrap.
- Use fixed dimensions only for icons, avatars, controls, and calendar primitives that need stable shape.
- Use `min-width: 0` on flex/grid children that hold text.
- Text should wrap instead of forcing horizontal page overflow.
- Buttons may become full-width on mobile where needed.
- Tables may scroll internally, but the page must not horizontally scroll at `390px`.

Viewport expectations:

- `1440`: content remains controlled, not stretched across the full shell width.
- `1280`: current Figma density remains close to the original visual.
- `1024`: sidebar narrows or collapses; card grids drop columns where needed.
- `768`: main content becomes single flow; topbar and spacing tighten.
- `390`: cards are single column, controls fit, table scroll is isolated, and no visible overlap occurs.

## Styling Strategy

CSS Modules are the default for layout, shared UI, and feature components.

`globals.css` should keep only:

- CSS reset and `box-sizing`
- `html`, `body`, base background, font smoothing if used
- global CSS variables or tokens
- minimal Ant Design global overrides that cannot be scoped cleanly

When styling Ant Design internals from CSS Modules, use `:global(...)` only for the smallest selector needed.

## Migration Order

1. Create layout components and shared CSS token conventions.
2. Create shared UI primitives.
3. Move dashboard into `features/dashboard` and validate responsive behavior.
4. Move patients into `features/patients` and validate table scroll behavior.
5. Move calendar into `features/calendar` and validate calendar grid behavior.
6. Move medicine into `features/medicine` and validate grid collapse behavior.
7. Move add-patient and registration into `features/patient-registration` and validate stepper/forms.
8. Trim `globals.css` after feature styles are moved.
9. Run build and visual viewport checks.

## Testing and Verification

Required command:

```bash
pnpm --filter @maternalink/web build
```

Visual QA should cover these routes:

- `/`
- `/master`
- `/forecast`
- `/lplpo`
- `/master/add-patient`

Each route should be checked at:

- `1440`
- `1280`
- `1024`
- `768`
- `390`

Acceptance criteria:

- Build succeeds.
- No page-level horizontal overflow at `390px`, except intended table container scroll.
- Large screens do not stretch the Figma slice awkwardly.
- Components under `src/components` are reusable primitives or layout components, not full pages.
- Feature page content files are composer components with data and markup split into smaller units.
- `globals.css` is reduced to global concerns and unavoidable overrides.
- Current routes and visible UI semantics remain intact.

## Out of Scope

- Backend/API changes.
- New data fetching behavior.
- New product features beyond responsive layout and component refactor.
- Replacing Ant Design.
- Pixel-perfect redesign that changes the visual identity.
