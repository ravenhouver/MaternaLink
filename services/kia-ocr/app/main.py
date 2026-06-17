from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import Any

import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps
from pydantic import BaseModel, Field


app = FastAPI(title="MaternaLink KIA OCR", version="0.1.0")


MONTHS = {
    "jan": 1,
    "januari": 1,
    "feb": 2,
    "februari": 2,
    "mar": 3,
    "maret": 3,
    "apr": 4,
    "april": 4,
    "mei": 5,
    "may": 5,
    "jun": 6,
    "juni": 6,
    "jul": 7,
    "juli": 7,
    "aug": 8,
    "agt": 8,
    "agustus": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "okt": 10,
    "oct": 10,
    "oktober": 10,
    "nov": 11,
    "november": 11,
    "des": 12,
    "dec": 12,
    "desember": 12,
}


class KiaExtraction(BaseModel):
    fullName: str | None = None
    nik: str | None = None
    dateOfBirth: str | None = None
    address: str | None = None
    phone: str | None = None
    bloodType: str | None = None
    lmp: str | None = None
    edd: str | None = None
    gestationalAge: int | None = None
    ancVisit: str | None = None
    gravida: int | None = None
    para: int | None = None
    abortus: int | None = None
    riskFactors: list[str] = Field(default_factory=list)
    rawText: str
    confidence: dict[str, float] = Field(default_factory=dict)
    needsReview: bool


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "MaternaLink KIA OCR", "status": "ok"}


@app.post("/v1/kia/extract", response_model=KiaExtraction)
async def extract_kia(file: UploadFile = File(...)) -> KiaExtraction:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WebP files are supported")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be 5MB or smaller")

    try:
        image = Image.open(BytesIO(content))
        text = ocr_image(image)
    except Exception as exc:  # pragma: no cover - surfaced as API error
        raise HTTPException(status_code=422, detail=f"Could not read KIA image: {exc}") from exc

    return parse_kia_text(text)


def ocr_image(image: Image.Image) -> str:
    image = ImageOps.exif_transpose(image).convert("L")
    image = ImageOps.autocontrast(image)
    max_width = 1800
    if image.width > max_width:
        ratio = max_width / image.width
        image = image.resize((max_width, int(image.height * ratio)))
    return pytesseract.image_to_string(image, lang="ind+eng", config="--psm 6")


def parse_kia_text(raw_text: str) -> KiaExtraction:
    text = normalize_text(raw_text)
    fields: dict[str, Any] = {
        "rawText": raw_text.strip(),
        "confidence": {},
        "riskFactors": extract_risk_factors(text),
    }

    set_if(fields, "nik", find_regex(text, r"(?:nik|no\.?\s*ktp)\s*[:\-]?\s*(\d[\d\s]{14,20}\d)", digits_only=True), 0.9)
    set_if(fields, "fullName", find_labeled_value(text, ["nama ibu", "nama pasien", "nama"]), 0.72)
    set_if(fields, "address", find_labeled_value(text, ["alamat", "tempat tinggal"]), 0.55)
    set_if(fields, "phone", find_regex(text, r"(?:hp|telepon|telp|no\.?\s*hp)\s*[:\-]?\s*(\+?\d[\d\s\-]{8,16})", digits_only=False), 0.65)
    set_if(fields, "bloodType", find_regex(text, r"(?:gol(?:ongan)?\s*darah|blood\s*type)\s*[:\-]?\s*(AB|A|B|O)\b", flags=re.I), 0.8)
    set_if(fields, "dateOfBirth", find_date_after(text, ["tanggal lahir", "tgl lahir", "lahir"]), 0.65)
    set_if(fields, "lmp", find_date_after(text, ["hpht", "haid terakhir", "menstruasi terakhir", "lmp"]), 0.82)
    set_if(fields, "edd", find_date_after(text, ["hpl", "taksiran persalinan", "perkiraan lahir", "edd"]), 0.82)
    set_if(fields, "ancVisit", find_regex(text, r"\b(K[1-6])\b", flags=re.I, transform=lambda value: value.upper()), 0.55)
    set_if(fields, "gestationalAge", find_int_regex(text, r"(?:usia kehamilan|umur kehamilan|gestasi)\s*[:\-]?\s*(\d{1,2})\s*(?:minggu|week)"), 0.72)

    gpa = find_gpa(text)
    if gpa:
        fields.update(gpa)
        fields["confidence"].update({"gravida": 0.82, "para": 0.82, "abortus": 0.82})

    if not fields.get("edd") and fields.get("lmp"):
        fields["edd"] = add_days_iso(fields["lmp"], 280)
        fields["confidence"]["edd"] = 0.5

    required = ["fullName", "nik", "lmp", "edd", "gestationalAge"]
    fields["needsReview"] = any(not fields.get(key) for key in required)
    return KiaExtraction(**fields)


def normalize_text(text: str) -> str:
    cleaned = text.replace("\r", "\n")
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{2,}", "\n", cleaned)
    return cleaned.strip()


def set_if(fields: dict[str, Any], key: str, value: Any, confidence: float) -> None:
    if value not in (None, ""):
        fields[key] = value
        fields["confidence"][key] = confidence


def find_labeled_value(text: str, labels: list[str]) -> str | None:
    for label in labels:
        match = re.search(rf"{re.escape(label)}\s*[:\-]?\s*([^\n]+)", text, re.I)
        if match:
            value = re.split(r"\s{2,}|\b(?:nik|alamat|tanggal|tgl|hpht|hpl)\b", match.group(1), maxsplit=1, flags=re.I)[0]
            value = re.sub(r"[^A-Za-zÀ-ÿ0-9 .,'/-]", "", value).strip(" :-")
            return value or None
    return None


def find_regex(text: str, pattern: str, *, flags: int = 0, digits_only: bool = False, transform: Any = None) -> str | None:
    match = re.search(pattern, text, flags)
    if not match:
        return None
    value = match.group(1).strip()
    if digits_only:
        value = re.sub(r"\D", "", value)
    if transform:
        value = transform(value)
    return value or None


def find_int_regex(text: str, pattern: str) -> int | None:
    value = find_regex(text, pattern, flags=re.I)
    return int(value) if value and value.isdigit() else None


def find_date_after(text: str, labels: list[str]) -> str | None:
    for label in labels:
        match = re.search(rf"{re.escape(label)}\s*[:\-]?\s*([^\n]{{0,40}})", text, re.I)
        if match:
            parsed = parse_date(match.group(1))
            if parsed:
                return parsed
    return None


def parse_date(value: str) -> str | None:
    value = value.strip()
    numeric = re.search(r"(\d{1,2})[\-/\.](\d{1,2})[\-/\.](\d{2,4})", value)
    if numeric:
        day, month, year = map(int, numeric.groups())
        if year < 100:
            year += 2000 if year < 40 else 1900
        return to_iso_date(year, month, day)

    named = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})", value, re.I)
    if named:
        day = int(named.group(1))
        month = MONTHS.get(named.group(2).lower())
        year = int(named.group(3))
        if month:
            if year < 100:
                year += 2000 if year < 40 else 1900
            return to_iso_date(year, month, day)
    return None


def to_iso_date(year: int, month: int, day: int) -> str | None:
    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


def add_days_iso(value: str, days: int) -> str | None:
    try:
        return (datetime.strptime(value, "%Y-%m-%d").date() + timedelta(days=days)).isoformat()
    except ValueError:
        return None


def find_gpa(text: str) -> dict[str, int] | None:
    match = re.search(r"\bG\s*(\d+)\s*P\s*(\d+)\s*A\s*(\d+)\b", text, re.I)
    if match:
        return {"gravida": int(match.group(1)), "para": int(match.group(2)), "abortus": int(match.group(3))}
    return None


def extract_risk_factors(text: str) -> list[str]:
    risk_terms = ["hipertensi", "anemia", "preeklampsia", "diabetes", "perdarahan", "muntah", "asma"]
    lower = text.lower()
    return [term for term in risk_terms if term in lower]
