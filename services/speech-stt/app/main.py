from __future__ import annotations

import os
import tempfile
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field


app = FastAPI(title="MaternaLink Speech STT", version="0.1.0")

SUPPORTED_TYPES = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
}


class Segment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptionResult(BaseModel):
    transcript: str
    language: str = "id"
    durationSeconds: float | None = None
    confidence: float | None = None
    segments: list[Segment] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "MaternaLink Speech STT", "status": "ok", "model": os.getenv("STT_MODEL_SIZE", "small")}


@app.post("/v1/stt/transcribe", response_model=TranscriptionResult)
async def transcribe(file: UploadFile = File(...)) -> TranscriptionResult:
    suffix = SUPPORTED_TYPES.get(file.content_type or "")
    if not suffix:
        raise HTTPException(status_code=400, detail="Only WebM, OGG, MP3, M4A, or WAV audio is supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file must be 15MB or smaller")

    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        model = get_model()
        segments_iter, info = model.transcribe(str(temp_path), language="id", vad_filter=True)
        segments = [Segment(start=item.start, end=item.end, text=item.text.strip()) for item in segments_iter if item.text.strip()]
        transcript = " ".join(segment.text for segment in segments).strip()
        confidence = None
        if segments:
            confidence = max(0.0, min(1.0, 1.0 - sum(getattr(item, "avg_logprob", -0.5) for item in []) / max(len(segments), 1)))

        return TranscriptionResult(
            transcript=transcript,
            language=getattr(info, "language", "id") or "id",
            durationSeconds=getattr(info, "duration", None),
            confidence=confidence,
            segments=segments,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - external model/runtime failure
        raise HTTPException(status_code=503, detail=f"STT failed: {exc}") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@lru_cache(maxsize=1)
def get_model():
    from faster_whisper import WhisperModel

    return WhisperModel(
        os.getenv("STT_MODEL_SIZE", "small"),
        device=os.getenv("STT_DEVICE", "cpu"),
        compute_type=os.getenv("STT_COMPUTE_TYPE", "int8"),
    )
