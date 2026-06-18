import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'upload-kia-book-content.tsx'), 'utf8');
const idlePanel = source.slice(source.indexOf('function IdleUploadPanel'), source.indexOf('function ProcessingPanel'));

assert.match(source, /galleryInputRef.*useRef<HTMLInputElement>\(null\)/s, 'Select from Gallery keeps a separate upload input ref');
assert.match(source, /navigator\.mediaDevices\?\.getUserMedia/, 'Take Photo opens the browser camera instead of file upload');
assert.match(source, /canvas\.toBlob\(resolve, 'image\/jpeg', 0\.92\)/, 'Captured camera frame is converted to an image file');
assert.match(idlePanel, /<video ref=\{videoRef\}[^>]*autoPlay[^>]*playsInline/, 'Camera preview renders live video');
assert.match(idlePanel, /onClick=\{onOpenCamera\}/, 'Take Photo triggers camera open handler');
assert.match(idlePanel, /onClick=\{\(\) => galleryInputRef\.current\?\.click\(\)\}/, 'Select from Gallery triggers the gallery input');
