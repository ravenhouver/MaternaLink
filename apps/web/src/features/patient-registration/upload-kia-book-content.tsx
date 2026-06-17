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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  const progressLabel = useMemo(() => Math.min(progress, 100), [progress]);

  async function startProcessing(file: File) {
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      void startProcessing(file);
    }
  }

  function resetUpload() {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
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

      {uploadState === 'idle' ? <IdleUploadPanel onFileChange={handleFileChange} cameraInputRef={cameraInputRef} galleryInputRef={galleryInputRef} /> : null}
      {uploadState === 'processing' ? <ProcessingPanel progress={progressLabel} /> : null}
      {error ? <p className={styles.formError}>{error}</p> : null}
      {uploadState === 'success' ? <SuccessPanel extraction={extraction} previewUrl={previewUrl} selectedFileName={selectedFile?.name ?? 'KIA book photo'} onConfirm={continueToRegistrationForm} onRetake={resetUpload} /> : null}

      {uploadState !== 'success' ? <GuidanceCards active={uploadState === 'processing'} /> : null}
    </PageContainer>
  );
}

type IdleUploadPanelProps = {
  cameraInputRef: React.RefObject<HTMLInputElement>;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function IdleUploadPanel({ cameraInputRef, galleryInputRef, onFileChange }: IdleUploadPanelProps) {
  return (
    <section className={styles.uploadCard} aria-label="KIA book upload">
      <label className={styles.dropZone}>
        <input ref={galleryInputRef} accept="image/png,image/jpeg" type="file" onChange={onFileChange} />
        <span className={styles.dropIcon}><AppIcon name="camera" width={56} height={56} /></span>
        <strong>Drag photo here or Select File</strong>
        <small>Supported formats: JPG, PNG (Max. 5MB)</small>
      </label>
      <input ref={cameraInputRef} accept="image/png,image/jpeg" capture="environment" type="file" onChange={onFileChange} hidden />

      <div className={styles.uploadActions}>
        <button type="button" className={styles.takePhotoButton} onClick={() => cameraInputRef.current?.click()}>
          <AppIcon name="camera" width={22} height={22} />
          Take Photo
        </button>
        <button type="button" className={styles.galleryButton} onClick={() => galleryInputRef.current?.click()}>
          <AppIcon name="upload" width={22} height={22} />
          Select from Gallery
        </button>
      </div>

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
