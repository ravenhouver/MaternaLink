import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';

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
      return { ...transcription, draft: this.toDraft(transcription.transcript), needsReview: true };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException(error instanceof Error ? error.message : 'Speech STT service unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private baseUrl() {
    return (process.env.SPEECH_STT_SERVICE_URL ?? 'http://localhost:8002').replace(/\/$/, '');
  }

  private toDraft(transcript: string): SpeechExaminationDraft['draft'] {
    const lower = transcript.toLowerCase();
    const symptoms = ['pusing', 'mual', 'muntah', 'bengkak', 'nyeri perut', 'perdarahan', 'sesak', 'demam'].filter((term) => lower.includes(term));
    const bloodPressure = match(transcript, /(?:tekanan darah|tensi|td)\s*(\d{2,3}\s*\/\s*\d{2,3})/i);
    const pulse = match(transcript, /(?:nadi|pulse)\s*(\d{2,3})/i);
    const gestationalAgeText = match(transcript, /(?:usia kehamilan|umur kehamilan|gestasi)\s*(\d{1,2})\s*(?:minggu|week)/i);
    const ancVisit = match(transcript, /\b(K[1-6])\b/i)?.toUpperCase() ?? null;
    const medicine = lower.includes('mgso4') || lower.includes('magnesium') ? 'OBT-010' : null;

    return {
      complaint: transcript,
      bloodPressure,
      pulse,
      gestationalAge: gestationalAgeText ? Number(gestationalAgeText) : null,
      ancVisit,
      symptoms,
      diagnosis: symptoms.some((term) => ['pusing', 'bengkak', 'nyeri perut'].includes(term)) || bloodPressure ? 'K03' : null,
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
