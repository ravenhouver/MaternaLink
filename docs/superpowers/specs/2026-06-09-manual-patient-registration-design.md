# Manual Patient Registration Backend Integration Design

## Goal

Connect every meaningful input on `/patients/new/manual` to persisted backend data. The completed wizard creates a patient, an active pregnancy, a queue entry, and an examination containing the screening details.

## Scope

The existing three-step presentation remains unchanged. Inputs that currently display fixed values or do not update React state become controlled inputs. The implementation does not introduce new pages, database tables, or a replacement registration endpoint.

## Data Ownership

### Patient

Persist these identity and basic-history fields through `POST /api/patients`:

- Full name and NIK
- Date of birth
- Phone and address
- BPJS or insurance number
- Emergency contact name and phone
- Blood type
- Allergies
- Chronic disease history, serialized as readable text from the selected conditions and optional other value

### Pregnancy

Persist these fields in the pregnancy created by `POST /api/patients`:

- LMP and EDD
- Current gestational age and last ANC visit
- Gravida, para, and abortus
- Pregnancy type
- Risk level

### Queue

Create the queue after the patient transaction succeeds using `POST /api/queue`. Keep the returned queue ID for the examination record.

### Examination

Extend `POST /api/examinations` so it accepts structured `vitalSigns` and `riskSummary` values in addition to its existing fields. Persist:

- Reason for visit and chief complaint
- Emergency-sign selections
- Blood pressure, weight, height, MUAC, pulse, temperature, and fetal heart rate
- Screening risk-factor selections
- Routine medication selections
- Additional notes
- Responsible doctor display value
- The selected risk level and derived screening summary

The examination references the newly created patient, pregnancy, and queue. Creating it completes the queue because the existing examination service marks a referenced queue as `COMPLETED`.

## Frontend Data Flow

`ManualEntryFlowContent` owns one registration state object covering all wizard stages. Each visible input reads from and writes to that state. On submit:

1. Validate required identity, pregnancy, visit, and screening fields.
2. Call `createPatient` with patient and pregnancy fields.
3. Call `createQueue` with the returned patient and pregnancy IDs.
4. Call `createExamination` with all screening data and the returned queue ID.
5. Navigate to the queue page only after all three requests succeed.

Numeric inputs are converted to numbers only when non-empty. Date inputs use HTML date values so the API receives ISO-compatible `YYYY-MM-DD` strings.

## Validation And Errors

- Require full name, 16-digit NIK, date of birth, phone, address, emergency contact, gestational age, ANC visit, reason for visit, pregnancy type, blood pressure, and risk level.
- Reject malformed numeric values before making API requests.
- Disable the submit action while requests are running.
- Display the API error returned by the first failed operation and remain on the current wizard stage.
- The flow is sequential rather than fully atomic across endpoints. If queue or examination creation fails after patient creation, the error is visible and no false success redirect occurs. A new aggregate backend endpoint is outside this scoped change.

## Backend Changes

Add optional `vitalSigns` and `riskSummary` fields to `CreateExaminationDto` using object validation appropriate for JSON payloads. Pass both values to Prisma in examination create and update operations. Existing clients remain compatible because both fields are optional.

No Prisma migration is required because `Examination.vitalSigns` and `Examination.riskSummary` already exist as nullable JSON columns.

## Testing

- Add backend tests proving examination creation persists `vitalSigns` and `riskSummary`.
- Add focused frontend tests for payload construction and validation by extracting pure mapping helpers from the large wizard component.
- Run targeted API and web tests, TypeScript checks, and the relevant production builds.
- Perform a browser smoke test of `/patients/new/manual` when the local services and test credentials are available.

## Non-Goals

- Changing the visual layout or navigation structure
- Adding OCR behavior to the manual route
- Adding master-data mappings for diagnosis, symptom, or medicine IDs
- Making the three endpoint operations a single database transaction
- Changing authorization; registration remains restricted to `BIDAN_PUSKESMAS`
