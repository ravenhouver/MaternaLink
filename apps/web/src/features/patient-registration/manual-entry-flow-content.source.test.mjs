import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'manual-entry-flow-content.tsx'), 'utf8');
const pregnancyPanel = source.slice(source.indexOf('function PregnancyPanel'), source.indexOf('function ScreeningPanel'));

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
