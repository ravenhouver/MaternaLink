import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'upload-kia-book-content.tsx'), 'utf8');
const idlePanel = source.slice(source.indexOf('function IdleUploadPanel'), source.indexOf('function ProcessingPanel'));

assert.match(source, /cameraInputRef.*useRef<HTMLInputElement>\(null\)/s, 'Take Photo keeps a dedicated camera input ref');
assert.match(source, /galleryInputRef.*useRef<HTMLInputElement>\(null\)/s, 'Select from Gallery keeps a separate upload input ref');
assert.match(idlePanel, /capture="environment"/, 'Take Photo opens the device camera directly');
assert.match(idlePanel, /onClick=\{\(\) => cameraInputRef\.current\?\.click\(\)\}/, 'Take Photo triggers the camera input');
assert.match(idlePanel, /onClick=\{\(\) => galleryInputRef\.current\?\.click\(\)\}/, 'Select from Gallery triggers the gallery input');
