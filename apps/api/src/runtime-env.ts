import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_ENV_KEYS = new Set([
  'DATABASE_URL',
  'JWT_SECRET',
  'WEB_ORIGIN',
  'AI_MODE',
  'AI_SERVICE_BASE_URL',
  'AI_SERVICE_TIMEOUT_MS',
  'AI_LAYER2_TIMEOUT_MS',
  'KIA_OCR_SERVICE_URL',
  'KIA_OCR_TIMEOUT_MS',
  'SPEECH_STT_SERVICE_URL',
  'SPEECH_STT_TIMEOUT_MS',
  'PORT',
  'SESSION_COOKIE_SECURE',
]);
const ROOT_ENV_KEYS = new Set([
  'DATABASE_URL',
  'JWT_SECRET',
  'WEB_ORIGIN',
  'AI_MODE',
  'AI_SERVICE_BASE_URL',
  'AI_SERVICE_TIMEOUT_MS',
  'AI_LAYER2_TIMEOUT_MS',
  'KIA_OCR_SERVICE_URL',
  'KIA_OCR_TIMEOUT_MS',
  'SPEECH_STT_SERVICE_URL',
  'SPEECH_STT_TIMEOUT_MS',
  'SESSION_COOKIE_SECURE',
]);

function parseEnvFile(path: string) {
  if (!existsSync(path)) return [];

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      if (separator === -1) return null;
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, '');
      return { key, value };
    })
    .filter((entry): entry is { key: string; value: string } => Boolean(entry));
}

function applyEnv(path: string, allowedKeys: Set<string>) {
  for (const { key, value } of parseEnvFile(path)) {
    if (!allowedKeys.has(key) || process.env[key]) continue;
    process.env[key] = value;
  }
}

export function loadRuntimeEnv() {
  const appRoot = resolve(__dirname, '../../..');

  applyEnv(resolve(appRoot, '.env'), ROOT_ENV_KEYS);
  applyEnv(resolve(appRoot, 'apps/api/.env'), API_ENV_KEYS);

  process.env.DATABASE_URL ??= 'postgresql://maternalink:maternalink@localhost:55432/maternalink?schema=public';
  process.env.AI_MODE ??= 'remote';
  process.env.AI_SERVICE_BASE_URL ??= 'https://azrilfahmiardi-maternalink-ai.hf.space';
  process.env.AI_SERVICE_TIMEOUT_MS ??= '30000';
  process.env.AI_LAYER2_TIMEOUT_MS ??= '600000';
  process.env.KIA_OCR_SERVICE_URL ??= 'http://localhost:8001';
  process.env.KIA_OCR_TIMEOUT_MS ??= '60000';
  process.env.SPEECH_STT_SERVICE_URL ??= 'http://localhost:8002';
  process.env.SPEECH_STT_TIMEOUT_MS ??= '120000';
}
