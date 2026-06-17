import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';

export type KiaOcrExtraction = {
  fullName?: string | null;
  nik?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  bloodType?: string | null;
  lmp?: string | null;
  edd?: string | null;
  gestationalAge?: number | null;
  ancVisit?: string | null;
  gravida?: number | null;
  para?: number | null;
  abortus?: number | null;
  riskFactors?: string[];
  rawText?: string;
  confidence: Record<string, number>;
  needsReview: boolean;
};

@Injectable()
export class KiaOcrService {
  async extract(file: { buffer: Buffer; mimetype: string; originalname: string; size: number }): Promise<KiaOcrExtraction> {
    if (!file) throw new BadRequestException('KIA photo is required');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Only JPG, PNG, or WebP KIA photos are supported');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('KIA photo must be 5MB or smaller');

    const form = new FormData();
    const bytes = new Uint8Array(file.buffer);
    form.append('file', new Blob([bytes], { type: file.mimetype }), file.originalname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.KIA_OCR_TIMEOUT_MS ?? '60000'));

    try {
      const response = await fetch(`${this.baseUrl()}/v1/kia/extract`, { method: 'POST', body: form, signal: controller.signal });
      if (!response.ok) throw new BadGatewayException(`KIA OCR service returned HTTP ${response.status}`);
      return (await response.json()) as KiaOcrExtraction;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException(error instanceof Error ? error.message : 'KIA OCR service unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private baseUrl() {
    return (process.env.KIA_OCR_SERVICE_URL ?? 'http://localhost:8001').replace(/\/$/, '');
  }
}
