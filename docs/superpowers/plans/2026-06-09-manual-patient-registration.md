# Manual Patient Registration Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every meaningful field from `/patients/new/manual` into the existing Patient, Pregnancy, PatientQueue, and Examination backend records.

**Architecture:** Keep the existing sequential API workflow and entity ownership. Extract form state, validation, and payload mapping into a pure frontend module so the large wizard component only renders controls and orchestrates requests; extend the examination DTO/service for the JSON columns already present in Prisma.

**Tech Stack:** Next.js 15, React 18, TypeScript, NestJS 10, class-validator, Prisma 5, Jest/Supertest, Vitest.

---

## File Map

- Create `apps/web/src/features/patient-registration/manual-registration-form.ts`: form types, defaults, validation, and request payload builders.
- Create `apps/web/src/features/patient-registration/manual-registration-form.test.ts`: focused validation and payload tests.
- Modify `apps/web/src/features/patient-registration/manual-entry-flow-content.tsx`: controlled inputs and sequential patient/queue/examination submission.
- Modify `apps/web/src/lib/api.ts`: typed examination JSON payload fields.
- Modify `apps/web/package.json`: add the focused Vitest command and dependency.
- Modify `apps/api/src/modules/examinations/examinations.dto.ts`: accept structured JSON objects.
- Modify `apps/api/src/modules/examinations/examinations.service.ts`: persist and update both JSON values.
- Modify `apps/api/test/app.e2e-spec.ts`: prove the end-to-end examination payload is stored.
- Modify `pnpm-lock.yaml`: lock the added Vitest dependency.

### Task 1: Persist Examination JSON Fields

**Files:**
- Modify: `apps/api/test/app.e2e-spec.ts`
- Modify: `apps/api/src/modules/examinations/examinations.dto.ts`
- Modify: `apps/api/src/modules/examinations/examinations.service.ts`

- [ ] **Step 1: Add failing API assertions**

Extend the existing patient workflow examination request with:

```ts
vitalSigns: {
  bloodPressure: '145/95',
  weightKg: 72,
  temperatureC: 38.2,
},
riskSummary: {
  riskLevel: 'HIGH',
  factors: ['HYPERTENSION', 'PREECLAMPSIA'],
  emergencySigns: ['BLEEDING'],
  responsibleDoctor: 'dr. Ratna Wulandari, Sp.OG',
},
notes: 'Kontrol ketat dalam 24 jam.',
```

Assert the response contains both objects:

```ts
expect(exam.body).toEqual(expect.objectContaining({
  queueId: queued.body.id,
  source: 'MANUAL',
  vitalSigns: expect.objectContaining({ bloodPressure: '145/95', weightKg: 72 }),
  riskSummary: expect.objectContaining({ riskLevel: 'HIGH', factors: ['HYPERTENSION', 'PREECLAMPSIA'] }),
}));
```

- [ ] **Step 2: Run the API test and verify RED**

Run: `pnpm --filter @maternalink/api test:e2e -- --runInBand`

Expected: the patient workflow test fails because whitelisting removes `vitalSigns` and the supplied `riskSummary`, while the service generates only its old minimal summary.

- [ ] **Step 3: Extend the DTO and service minimally**

In `examinations.dto.ts`, import `IsObject` and add:

```ts
@IsOptional()
@IsObject()
vitalSigns?: Record<string, unknown>;

@IsOptional()
@IsObject()
riskSummary?: Record<string, unknown>;
```

In create, convert both optional objects to Prisma JSON and preserve the current default summary:

```ts
vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
riskSummary: (data.riskSummary ?? { riskLevel: pregnancy.riskLevel }) as Prisma.InputJsonValue,
```

In update, add:

```ts
vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
riskSummary: data.riskSummary as Prisma.InputJsonValue | undefined,
```

- [ ] **Step 4: Run API tests and build**

Run:

```powershell
pnpm --filter @maternalink/api test:e2e -- --runInBand
pnpm --filter @maternalink/api build
```

Expected: all API e2e tests pass and the Nest build exits with code 0.

- [ ] **Step 5: Commit the backend change**

```powershell
git add apps/api/test/app.e2e-spec.ts apps/api/src/modules/examinations/examinations.dto.ts apps/api/src/modules/examinations/examinations.service.ts
git commit -m "feat(api): persist manual screening details"
```

### Task 2: Define And Test Manual Registration Mapping

**Files:**
- Create: `apps/web/src/features/patient-registration/manual-registration-form.ts`
- Create: `apps/web/src/features/patient-registration/manual-registration-form.test.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install the focused web test runner**

Run: `pnpm --filter @maternalink/web add -D vitest`

Add this script to `apps/web/package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write failing mapping tests**

Create tests covering required validation, numeric conversion, and entity ownership:

```ts
import { describe, expect, it } from 'vitest';
import { buildManualRegistrationPayloads, emptyManualRegistrationForm, validateManualRegistration } from './manual-registration-form';

describe('manual registration form', () => {
  it('requires identity, pregnancy, visit, and blood-pressure fields', () => {
    expect(validateManualRegistration(emptyManualRegistrationForm)).toEqual(expect.arrayContaining([
      'Nama pasien wajib diisi.',
      'NIK harus terdiri dari 16 digit.',
      'Tekanan darah wajib diisi.',
    ]));
  });

  it('maps controlled form data to patient and examination payloads', () => {
    const form = {
      ...emptyManualRegistrationForm,
      fullName: 'Siti Aminah', nik: '3404015203980001', dateOfBirth: '1998-03-15',
      phone: '08123456789', address: 'Umbulharjo', emergencyName: 'Budi', emergencyPhone: '081200000001',
      gestationalAge: '28', ancVisit: 'K3', visitReason: 'ANC_ROUTINE', pregnancyType: 'SINGLE',
      bloodPressure: '145/95', weight: '72', riskLevel: 'HIGH' as const,
      riskFactors: ['HYPERTENSION'], emergencySigns: ['BLEEDING'], routineMedication: ['IRON_TABLETS'],
    };
    const payloads = buildManualRegistrationPayloads(form);
    expect(payloads.patient).toEqual(expect.objectContaining({ fullName: 'Siti Aminah', gestationalAge: 28, pregnancyType: 'SINGLE' }));
    expect(payloads.examination).toEqual(expect.objectContaining({
      complaint: 'ANC_ROUTINE',
      vitalSigns: expect.objectContaining({ bloodPressure: '145/95', weightKg: 72 }),
      riskSummary: expect.objectContaining({ riskLevel: 'HIGH', factors: ['HYPERTENSION'] }),
    }));
  });
});
```

- [ ] **Step 3: Run the web tests and verify RED**

Run: `pnpm --filter @maternalink/web test`

Expected: FAIL because `manual-registration-form.ts` does not exist.

- [ ] **Step 4: Implement form types, defaults, validation, and mapping**

Define string-backed input values for all visible text/number fields and string arrays for checkbox groups. Export:

```ts
export type ManualRegistrationForm = { /* every controlled wizard value */ };
export const emptyManualRegistrationForm: ManualRegistrationForm = { /* stable defaults */ };
export function validateManualRegistration(form: ManualRegistrationForm): string[];
export function buildManualRegistrationPayloads(form: ManualRegistrationForm): {
  patient: CreatePatientPayload;
  examination: Omit<CreateExaminationPayload, 'patientId' | 'pregnancyId' | 'queueId'>;
};
```

Use a helper that returns `undefined` for blank numeric inputs and `Number(value)` otherwise. Join chronic disease selections into `chronicHistory`. Put emergency signs, risk factors, doctor, and selected risk level under `riskSummary`; put routine medication labels in the existing JSON `medication` field without inventing master-data IDs.

Extend `CreateExaminationPayload` in `api.ts`:

```ts
vitalSigns?: Record<string, unknown>;
riskSummary?: Record<string, unknown>;
medication?: Array<Record<string, unknown>>;
```

- [ ] **Step 5: Run the focused tests and type/build check**

Run:

```powershell
pnpm --filter @maternalink/web test
pnpm --filter @maternalink/web build
```

Expected: mapping tests pass and the Next.js build exits with code 0.

- [ ] **Step 6: Commit the mapping layer**

```powershell
git add apps/web/src/features/patient-registration/manual-registration-form.ts apps/web/src/features/patient-registration/manual-registration-form.test.ts apps/web/src/lib/api.ts apps/web/package.json pnpm-lock.yaml
git commit -m "test(web): define manual registration payload mapping"
```

### Task 3: Connect Every Wizard Input

**Files:**
- Modify: `apps/web/src/features/patient-registration/manual-entry-flow-content.tsx`

- [ ] **Step 1: Add a failing coverage test for all persisted fields**

Extend `manual-registration-form.test.ts` with a complete form fixture and assert `dateOfBirth`, `bpjsNumber`, emergency contact, blood type, allergy, chronic history, LMP, EDD, GPA history, pregnancy type, complaint, all vital signs, all screening arrays, notes, and responsible doctor appear in the correct payload.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @maternalink/web test`

Expected: FAIL for fields that are not yet represented or mapped.

- [ ] **Step 3: Replace the local partial form type with the shared form module**

Import:

```ts
import { buildManualRegistrationPayloads, emptyManualRegistrationForm, type ManualRegistrationForm, validateManualRegistration } from './manual-registration-form';
```

Initialize state from `emptyManualRegistrationForm`, remove the old seven-field type/default, and retain the generic `updateField` helper.

- [ ] **Step 4: Convert identity and pregnancy inputs to controlled fields**

Wire `value` and `onChange` for identity, emergency contact, medical history, LMP/EDD, gestational age, ANC, gravida/para/abortus, visit reason, pregnancy type, complaint, and emergency signs. Replace display-only hard-coded pregnancy dates and gestational values with their controlled form values.

For checkbox arrays, update immutably:

```ts
function toggleArrayField<K extends CheckboxArrayKey>(key: K, value: ManualRegistrationForm[K][number], checked: boolean) {
  setForm((current) => ({
    ...current,
    [key]: checked ? [...current[key], value] : current[key].filter((item) => item !== value),
  }));
}
```

- [ ] **Step 5: Convert screening inputs to controlled fields**

Wire all vital signs, risk-factor cards, doctor, risk level, routine medication, and additional notes. Preserve labels and CSS classes so this is a behavioral change rather than a redesign.

- [ ] **Step 6: Update validation and sequential submit orchestration**

Use `validateManualRegistration` at stage transitions for stage-relevant checks and on final submit for all checks. Replace the partial payload with:

```ts
const payloads = buildManualRegistrationPayloads(form);
const created = await createPatient(payloads.patient);
const queue = await createQueue({ patientId: created.patient.id, pregnancyId: created.pregnancy.id });
await createExamination({
  ...payloads.examination,
  patientId: created.patient.id,
  pregnancyId: created.pregnancy.id,
  queueId: queue.id,
  source: 'MANUAL',
});
router.push(routes.queue);
```

Keep the current `try/catch/finally`, error rendering, and disabled submit behavior.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
pnpm --filter @maternalink/web test
pnpm --filter @maternalink/web build
```

Expected: all web tests pass and the production build exits with code 0.

- [ ] **Step 8: Commit the connected wizard**

```powershell
git add apps/web/src/features/patient-registration/manual-entry-flow-content.tsx apps/web/src/features/patient-registration/manual-registration-form.test.ts
git commit -m "feat(web): connect manual patient registration fields"
```

### Task 4: End-To-End Verification

**Files:**
- Verify only; modify implementation files only if a reproduced defect requires a TDD fix.

- [ ] **Step 1: Run the complete automated verification set**

Run:

```powershell
pnpm --filter @maternalink/api test:e2e -- --runInBand
pnpm --filter @maternalink/web test
pnpm build
git diff --check
```

Expected: zero failed tests, both builds exit with code 0, and no whitespace errors.

- [ ] **Step 2: Start the local application**

Run: `pnpm dev`

Wait until web is available at `http://localhost:3000` and API at `http://localhost:3001/api`.

- [ ] **Step 3: Perform a browser smoke test**

Using the Browser plugin, log in as the seeded bidan user, open `http://localhost:3000/patients/new/manual`, complete all three stages with a unique 16-digit NIK, submit, and verify navigation to the queue page without a visible error.

- [ ] **Step 4: Verify persisted records through the UI and API**

Confirm the patient appears in the patient list and the completed queue/examination response contains the submitted identity, pregnancy, vital signs, screening risk, medications, and notes. Record any environment limitation rather than claiming browser verification if services or seeded credentials are unavailable.

- [ ] **Step 5: Inspect final repository state**

Run:

```powershell
git status --short
git log -4 --oneline
```

Expected: only intentional changes remain and the implementation commits are present.
