'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { extractKiaBook, type KiaExtractionResult } from '@/lib/api';
import { routes } from '@/lib/routes';
import { kiaExtractionStorageKey } from './kia-extraction-storage';
import styles from './patient-registration.module.css';

const guidanceCards = [
  {
    icon: 'zap',
    title: 'Fast Process',
    description: 'Average 30-45 seconds per document.',
  },
  {
    icon: 'shield',
    title: 'Secure Data',
    description: 'End-to-end encryption for medical privacy.',
  },
  {
    icon: 'checkCircle',
    title: 'High Accuracy',
    description: 'Automatic verification of mother & baby data.',
  },
] as const;

type UploadState = 'idle' | 'processing' | 'success';

export function UploadKiaBookContent() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<KiaExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useMemo(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (uploadState !== 'processing') {
      return undefined;
    }

    setProgress(12);
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(current + 4, 92));
    }, 220);
    return () => {
      window.clearInterval(interval);
    };
  }, [uploadState]);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setPreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  useEffect(() => stopCamera, [stopCamera]);

  const progressLabel = useMemo(() => Math.min(progress, 100), [progress]);

  async function startProcessing(file: File) {
    stopCamera();
    setCameraOpen(false);
    setProgress(0);
    setExtraction(null);
    setUploadState('processing');

    try {
      const result = await extractKiaBook(file);
      setExtraction(result);
      setProgress(100);
      setUploadState('success');
    } catch (extractError) {
      setUploadState('idle');
      setError(extractError instanceof Error ? extractError.message : 'Gagal membaca foto KIA');
    }
  }

  async function openCamera() {
    setError(null);
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera tidak tersedia di browser ini. Gunakan browser modern dengan izin kamera aktif.');
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 0);
    } catch {
      stopCamera();
      setCameraOpen(false);
      setCameraError('Tidak bisa membuka kamera. Pastikan izin kamera diberikan dan perangkat kamera tersedia.');
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Gagal mengambil foto dari kamera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setCameraError('Gagal menyimpan foto dari kamera.');
      return;
    }

    const photo = new File([blob], `kia-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedFile(photo);
    setError(null);
    setCameraError(null);
    void startProcessing(photo);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      void startProcessing(file);
    }
  }

  function resetUpload() {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtraction(null);
    setError(null);
    setProgress(0);
    setUploadState('idle');
  }

  function continueToRegistrationForm() {
    setError(null);
    if (extraction) {
      window.sessionStorage.setItem(kiaExtractionStorageKey, JSON.stringify(extraction));
    }
    router.push(`${routes.manualPatient}?source=kia`);
  }

  return (
    <PageContainer size="wide" className={styles.uploadPage}>
      <header className={`${styles.uploadHeader} ${uploadState === 'processing' ? styles.centeredUploadHeader : ''}`}>
        <h1>Upload KIA Book Photo</h1>
        <p>
          {uploadState === 'success'
            ? 'Document successfully processed. Please review the extracted data below before continuing.'
            : 'We use AI technology to process data automatically to speed up patient registration.'}
        </p>
      </header>

      {uploadState === 'idle' ? (
        <IdleUploadPanel
          cameraError={cameraError}
          cameraOpen={cameraOpen}
          canvasRef={canvasRef}
          galleryInputRef={galleryInputRef}
          onCapturePhoto={capturePhoto}
          onCloseCamera={() => {
            stopCamera();
            setCameraOpen(false);
          }}
          onFileChange={handleFileChange}
          onOpenCamera={openCamera}
          videoRef={videoRef}
        />
      ) : null}
      {uploadState === 'processing' ? <ProcessingPanel progress={progressLabel} /> : null}
      {error ? <p className={styles.formError}>{error}</p> : null}
      {uploadState === 'success' ? <SuccessPanel extraction={extraction} previewUrl={previewUrl} selectedFileName={selectedFile?.name ?? 'KIA book photo'} onConfirm={continueToRegistrationForm} onRetake={resetUpload} /> : null}

      {uploadState !== 'success' ? <GuidanceCards active={uploadState === 'processing'} /> : null}
    </PageContainer>
  );
}

type IdleUploadPanelProps = {
  cameraError: string | null;
  cameraOpen: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  onCapturePhoto: () => void;
  onCloseCamera: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
};

function IdleUploadPanel({ cameraError, cameraOpen, canvasRef, galleryInputRef, onCapturePhoto, onCloseCamera, onFileChange, onOpenCamera, videoRef }: IdleUploadPanelProps) {
  return (
    <section className={styles.uploadCard} aria-label="KIA book upload">
      <label className={styles.dropZone}>
        <input ref={galleryInputRef} accept="image/png,image/jpeg" type="file" onChange={onFileChange} />
        <span className={styles.dropIcon}><AppIcon name="camera" width={56} height={56} /></span>
        <strong>Drag photo here or Select File</strong>
        <small>Supported formats: JPG, PNG (Max. 5MB)</small>
      </label>

      <div className={styles.uploadActions}>
        <button type="button" className={styles.takePhotoButton} onClick={onOpenCamera}>
          <AppIcon name="camera" width={22} height={22} />
          Take Photo
        </button>
        <button type="button" className={styles.galleryButton} onClick={() => galleryInputRef.current?.click()}>
          <AppIcon name="upload" width={22} height={22} />
          Select from Gallery
        </button>
      </div>

      {cameraError ? <p className={styles.formError}>{cameraError}</p> : null}
      {cameraOpen ? (
        <div className={styles.cameraPanel} role="dialog" aria-label="Take KIA book photo">
          <video ref={videoRef} className={styles.cameraPreview} autoPlay muted playsInline />
          <canvas ref={canvasRef} hidden />
          <div className={styles.cameraActions}>
            <button type="button" className={styles.galleryButton} onClick={onCloseCamera}>Cancel</button>
            <button type="button" className={styles.takePhotoButton} onClick={onCapturePhoto}>
              <AppIcon name="camera" width={20} height={20} />
              Capture
            </button>
          </div>
        </div>
      ) : null}

      <aside className={styles.photoHint}>
        <AppIcon name="info" width={18} height={18} />
        <p>Ensure photo is clear: mother's identity page, LMP, gestational age, and last examination results are clearly readable for data accuracy.</p>
      </aside>
    </section>
  );
}

function ProcessingPanel({ progress }: { progress: number }) {
  return (
    <section className={styles.processingZone} aria-live="polite" aria-label="Processing uploaded KIA book photo">
      <div className={styles.processingPattern} />
      <div className={styles.documentHint} aria-hidden="true">
        <span />
        <i />
        <i />
        <b />
      </div>

      <div className={styles.processingContent}>
        <span className={styles.spinner} aria-hidden="true" />
        <h2>Reading KIA data...</h2>
        <p>Please wait, AI is extracting important information from the photo you uploaded.</p>
        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>{progress}% COMPLETE</strong>
      </div>
    </section>
  );
}

function SuccessPanel({ extraction, onConfirm, onRetake, previewUrl, selectedFileName }: { extraction: KiaExtractionResult | null; onConfirm: () => void; onRetake: () => void; previewUrl: string | null; selectedFileName: string }) {
  const extractedFields = [
    { label: 'PATIENT NAME', value: extraction?.fullName ?? 'Needs review' },
    { label: 'NIK', value: extraction?.nik ?? 'Needs review' },
    { label: 'LMP', value: formatDate(extraction?.lmp) ?? 'Needs review' },
    { label: 'GESTATIONAL AGE', value: extraction?.gestationalAge ? `${extraction.gestationalAge} weeks` : 'Needs review' },
    { label: 'ESTIMATED DUE DATE', value: formatDate(extraction?.edd) ?? 'Needs review' },
  ];

  return (
    <section className={styles.successPanel} aria-label="KIA book extraction result">
      <div className={styles.previewPane}>
        <span className={styles.successBadge}>
          <AppIcon name="checkCircle" width={12} height={12} />
          Analysis Complete
        </span>
        <img src={previewUrl ?? '/figma-upload/kia-preview.png'} alt={selectedFileName} />
      </div>

      <div className={styles.resultPane}>
        <div className={styles.resultStatus}>
          <AppIcon name="checkCircle" width={24} height={24} />
          <strong>Data successfully read</strong>
        </div>

        <dl className={styles.extractedGrid}>
          {extractedFields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
          <div>
            <dt>ANC VISIT</dt>
            <dd><span className={styles.ancBadge}>{extraction?.ancVisit ?? 'Review'}</span></dd>
          </div>
        </dl>

        <div className={styles.reviewNote}>
          <AppIcon name="info" width={20} height={20} />
          <p>Review this summary. You can correct or complete other details in the next registration form.</p>
        </div>

        <div className={styles.resultActions}>
          <button type="button" className={styles.retakeButton} onClick={onRetake}>
            <AppIcon name="rotateCcw" width={18} height={18} />
            Retake Photo
          </button>
          <button type="button" className={styles.continueButton} onClick={onConfirm}>
            Continue to Registration Form
            <AppIcon name="arrowRight" width={18} height={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function GuidanceCards({ active }: { active: boolean }) {
  return (
    <section className={styles.guidanceGrid} aria-label="Upload guidance">
      {guidanceCards.map((card, index) => (
        <article className={`${styles.guidanceCard} ${active && index > 0 ? styles.mutedGuidanceCard : ''}`} key={card.title}>
          <span><AppIcon name={card.icon} width={22} height={22} /></span>
          <div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
