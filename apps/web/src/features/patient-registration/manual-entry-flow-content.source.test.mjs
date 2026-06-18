import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'manual-entry-flow-content.tsx'), 'utf8');
const pregnancyPanel = source.slice(source.indexOf('function PregnancyPanel'), source.indexOf('function ScreeningPanel'));
const screeningPanel = source.slice(source.indexOf('function ScreeningPanel'), source.indexOf('type ManualFieldProps'));

assert.ok(source.includes("const manualStages: ManualStage[] = ['manual-personal', 'pregnancy', 'screening']"), 'manual input skips the KIA autofill review stage');
assert.ok(source.includes("const kiaStages: ManualStage[] = ['autofill-personal', 'pregnancy', 'screening']"), 'KIA upload flow starts with the autofill review stage');

assert.ok(pregnancyPanel.includes('I. PREGNANCY IDENTITY (AUTO-FILLED)'), 'step 2 keeps the pregnancy identity section');
assert.ok(pregnancyPanel.includes('II. PREGNANCY HISTORY'), 'step 2 keeps the pregnancy history section');
assert.ok(pregnancyPanel.includes("III. TODAY\\'S EXAMINATION (MANUAL INPUT)"), 'step 2 keeps the manual examination section');

assert.ok(source.includes('function calculateGestationalAge(lmp: string, edd: string'), 'gestational age is calculated from LMP or EDD');
assert.ok(source.includes("key === 'lmp' || key === 'edd'"), 'gestational age updates when LMP or EDD changes');
assert.equal(pregnancyPanel.includes('label="Current Gestational Age *"'), false, 'gestational age example must not be rendered as an editable field');
assert.equal(pregnancyPanel.includes('Data from the MCH Handbook has been auto-filled by MaternaLink AI.'), false, 'step 2 must not show MCH auto-fill banner');
assert.equal(pregnancyPanel.includes('Change Handbook Photo'), false, 'step 2 must not show change handbook photo link');
assert.equal(pregnancyPanel.includes("onChange={(event) => onFieldChange('gestationalAge', event.target.value)}"), false, 'gestational age must not be manually editable');
assert.ok(pregnancyPanel.includes('readOnly value={form.gestationalAge}'), 'gestational age is rendered as a read-only calculated field');
assert.ok(source.includes("const ancVisitOptions = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6+'] as const"), 'last ANC visit options are centralized');
assert.ok(pregnancyPanel.includes('label="Last ANC Visit *"'), 'last ANC visit is required');
assert.ok(pregnancyPanel.includes('select options={ancVisitOptions}'), 'last ANC visit is rendered as a dropdown');
assert.ok(source.includes('function getPregnancyValidationErrors(form: ManualRegistrationForm)'), 'pregnancy step has required field validation');
assert.ok(source.includes("if (!form.visitReason.trim()) errors.visitReason"), 'visit reason is required');
assert.ok(source.includes("if (!form.pregnancyType.trim()) errors.pregnancyType"), 'pregnancy type is required');
assert.ok(source.includes('if (form.emergencySigns.length === 0) errors.emergencySigns'), 'emergency signs checklist is required');
assert.equal(pregnancyPanel.includes('<input defaultValue='), false, 'GPA examples must not be rendered as default input values');

assert.equal(screeningPanel.includes('Data from the MCH Handbook has been auto-filled by MaternaLink AI.'), false, 'step 3 must not show the MCH auto-fill banner');
assert.equal(screeningPanel.includes('Change Handbook Photo'), false, 'step 3 must not show change handbook photo link');
assert.equal(screeningPanel.includes('<label className={styles.manualLabel}>Risk Level</label>'), false, 'step 3 must not show manual risk level card');
assert.ok(screeningPanel.includes('readOnly value={form.responsibleDoctor}'), 'responsible doctor is locked to the logged-in user');
assert.ok(screeningPanel.includes('PRIORITY SUGGESTION'), 'priority suggestion remains visible');
assert.ok(screeningPanel.includes('const riskLevel = calculatedRiskLevel(form)'), 'priority suggestion is calculated from current form data');
assert.ok(screeningPanel.includes('const detectedRisks = autoDetectedRisks(form)'), 'auto-detected risk chips use auto detection helper');
assert.ok(screeningPanel.includes('const riskSummary = riskSummaryItems(form)'), 'risk summary uses calculated summary helper');
assert.ok(screeningPanel.includes('Body Temperature (°C)'), 'temperature field uses Celsius label');
assert.ok(screeningPanel.includes("error={feverDetected ? 'Fever detected' : undefined}"), 'temperature field shows fever error state');
assert.ok(source.includes("if (value < 30) return 'OVERWEIGHT'"), 'BMI status includes overweight');
assert.ok(source.includes("if (value < 35) return 'OBESITY I'"), 'BMI status includes obesity class I');
assert.ok(source.includes("items.add('High Blood Pressure (Systolic >= 140)')"), 'risk summary includes high blood pressure rule');
assert.ok(source.includes("items.add('Maternal Age (High-Risk Maternal Age)')"), 'risk summary includes maternal age rule');
assert.ok(source.includes("detected.add(`Age ${age} years`)"), 'auto-detected risks include age text');
assert.ok(source.includes("detected.add('Emergency symptoms reported')"), 'auto-detected risks include emergency symptoms text');
assert.ok(source.includes('setForm((current) => ({ ...current, responsibleDoctor }))'), 'responsible doctor is filled from current user data');
