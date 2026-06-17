import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'manual-entry-flow-content.tsx'), 'utf8');
const pregnancyPanel = source.slice(source.indexOf('function PregnancyPanel'), source.indexOf('function ScreeningPanel'));

assert.ok(pregnancyPanel.includes('I. PREGNANCY IDENTITY (AUTO-FILLED)'), 'step 2 keeps the pregnancy identity section');
assert.ok(pregnancyPanel.includes('II. PREGNANCY HISTORY'), 'step 2 keeps the pregnancy history section');
assert.ok(pregnancyPanel.includes("III. TODAY\\'S EXAMINATION (MANUAL INPUT)"), 'step 2 keeps the manual examination section');

assert.equal(pregnancyPanel.includes('label="Current Gestational Age *"'), false, 'gestational age example must not be rendered as an editable field');
assert.equal(pregnancyPanel.includes('label="Last ANC Visit *"'), false, 'last ANC example must not be rendered as an editable field');
assert.equal(pregnancyPanel.includes('<input defaultValue='), false, 'GPA examples must not be rendered as default input values');

