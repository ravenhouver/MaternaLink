import { Injectable } from '@nestjs/common';

type RemoteHealth = {
  service?: string;
  version?: string;
  status?: string;
};

@Injectable()
export class AiService {
  async getHealth() {
    const mode = process.env.AI_MODE ?? 'fallback';
    if (mode !== 'remote') {
      return { mode: 'fallback', remote: false, status: 'fallback-ready' };
    }

    const baseUrl = process.env.AI_SERVICE_BASE_URL ?? 'http://localhost:8000';
    const timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS ?? '30000');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
      if (!response.ok) return { mode, remote: true, status: 'unavailable' };
      const remote = (await response.json()) as RemoteHealth;
      return { mode, remote: true, status: remote.status ?? 'unknown', service: remote.service, version: remote.version };
    } catch {
      return { mode, remote: true, status: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
