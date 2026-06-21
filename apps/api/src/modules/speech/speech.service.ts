import { BadGatewayException, BadRequestException, GatewayTimeoutException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SttSegment = { start: number; end: number; text: string };

export type SttTranscription = {
  transcript: string;
  language: string;
  durationSeconds?: number | null;
  confidence?: number | null;
  segments: SttSegment[];
};

export type SpeechExaminationDraft = SttTranscription & {
  draft: {
    complaint: string;
    bloodPressure?: string | null;
    pulse?: string | null;
    gestationalAge?: number | null;
    ancVisit?: string | null;
    symptoms: string[];
    diagnosis?: string | null;
    medicine?: string | null;
    dosage?: string | null;
    unit?: string | null;
    notes?: string | null;
  };
  needsReview: boolean;
};

@Injectable()
export class SpeechService {
  constructor(private readonly prisma: PrismaService) {}

  async transcribe(file: { buffer: Buffer; mimetype: string; originalname: string; size: number }): Promise<SpeechExaminationDraft> {
    if (!file) throw new BadRequestException('Audio recording is required');
    if (!['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav'].includes(file.mimetype)) {
      throw new BadRequestException('Only WebM, OGG, MP3, M4A, or WAV audio is supported');
    }
    if (file.size > 15 * 1024 * 1024) throw new BadRequestException('Audio recording must be 15MB or smaller');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.SPEECH_STT_TIMEOUT_MS ?? '120000'));

    try {
      const response = await fetch(`${this.baseUrl()}/v1/stt/transcribe`, { method: 'POST', body: form, signal: controller.signal });
      if (!response.ok) throw new BadGatewayException(`Speech STT service returned HTTP ${response.status}`);
      const transcription = (await response.json()) as SttTranscription;
      return { ...transcription, draft: await this.toDraft(transcription.transcript), needsReview: true };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new GatewayTimeoutException('Speech STT service timed out while processing the recording');
      throw new BadGatewayException(error instanceof Error ? error.message : 'Speech STT service unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private baseUrl() {
    const configuredUrl = process.env.SPEECH_STT_SERVICE_URL?.trim();
    if (!configuredUrl) return 'http://localhost:8002';

    const shellFallback = /^\$\{SPEECH_STT_SERVICE_URL:-([^}]+)\}$/.exec(configuredUrl)?.[1];
    const normalizedUrl = shellFallback ?? configuredUrl;
    try {
      return new URL(normalizedUrl).toString().replace(/\/$/, '');
    } catch {
      return 'http://speech-stt:8002';
    }
  }

  private async toDraft(transcript: string): Promise<SpeechExaminationDraft['draft']> {
    const lower = transcript.toLowerCase();
    const [symptomMatches, conditionMatches, medicineMatches] = await Promise.all([
      this.prisma.gejala.findMany(),
      this.prisma.kondisi.findMany(),
      this.prisma.obat.findMany(),
    ]);
    const symptoms = symptomMatches.filter((item) => lower.includes(item.nama.toLowerCase()) || lower.includes(item.id.toLowerCase())).map((item) => item.id);
    const bloodPressure = match(transcript, /(?:tekanan darah|tensi|td)\s*(\d{2,3}\s*\/\s*\d{2,3})/i);
    const pulse = match(transcript, /(?:nadi|pulse)\s*(\d{2,3})/i);
    const gestationalAgeText = match(transcript, /(?:usia kehamilan|umur kehamilan|gestasi)\s*(\d{1,2})\s*(?:minggu|week)/i);
    const ancVisit = match(transcript, /\b(K[1-6])\b/i)?.toUpperCase() ?? null;
    const diagnosis = conditionMatches.find((item) => lower.includes(item.nama.toLowerCase()) || lower.includes(item.id.toLowerCase()))?.id ?? null;
    const medicine = medicineMatches.find((item) => lower.includes(item.nama.toLowerCase()) || lower.includes(item.id.toLowerCase()))?.id ?? null;

    return {
      complaint: transcript,
      bloodPressure,
      pulse,
      gestationalAge: gestationalAgeText ? Number(gestationalAgeText) : null,
      ancVisit,
      symptoms,
      diagnosis,
      medicine,
      dosage: medicine ? '1' : null,
      unit: medicine ? 'Ampul' : null,
      notes: 'Transcribed by speech STT service. Review before saving.',
    };
  }
}

function match(text: string, pattern: RegExp) {
  return pattern.exec(text)?.[1]?.trim() ?? null;
}
