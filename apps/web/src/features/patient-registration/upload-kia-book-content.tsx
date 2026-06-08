'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
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

const extractedFields = [
  { label: 'PATIENT NAME', value: 'Rina Safitri' },
  { label: 'NIK', value: '3271xxxxxxxxxxxx' },
  { label: 'LMP', value: '20 Apr 2025' },
  { label: 'GESTATIONAL AGE', value: '28 weeks' },
  { label: 'ESTIMATED DUE DATE', value: '25 Jan 2026' },
] as const;

type UploadState = 'idle' | 'processing' | 'success';

export function UploadKiaBookContent() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadState !== 'processing') {
      return undefined;
    }

    setProgress(12);
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(current + 4, 92));
    }, 220);
    const completion = window.setTimeout(() => {
      setProgress(100);
      setUploadState('success');
    }, 3600);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(completion);
    };
  }, [uploadState]);

  const progressLabel = useMemo(() => Math.min(progress, 100), [progress]);

  function startProcessing() {
    setProgress(0);
    setUploadState('processing');
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      startProcessing();
    }
  }

  function resetUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setProgress(0);
    setUploadState('idle');
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

      {uploadState === 'idle' ? <IdleUploadPanel onFileChange={handleFileChange} inputRef={fileInputRef} /> : null}
      {uploadState === 'processing' ? <ProcessingPanel progress={progressLabel} /> : null}
      {uploadState === 'success' ? <SuccessPanel onRetake={resetUpload} /> : null}

      {uploadState !== 'success' ? <GuidanceCards active={uploadState === 'processing'} /> : null}
    </PageContainer>
  );
}

type IdleUploadPanelProps = {
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function IdleUploadPanel({ inputRef, onFileChange }: IdleUploadPanelProps) {
  return (
    <section className={styles.uploadCard} aria-label="KIA book upload">
      <label className={styles.dropZone}>
        <input ref={inputRef} accept="image/png,image/jpeg" type="file" onChange={onFileChange} />
        <span className={styles.dropIcon}><AppIcon name="camera" width={56} height={56} /></span>
        <strong>Drag photo here or Select File</strong>
        <small>Supported formats: JPG, PNG (Max. 5MB)</small>
      </label>

      <div className={styles.uploadActions}>
        <button type="button" className={styles.takePhotoButton} onClick={() => inputRef.current?.click()}>
          <AppIcon name="camera" width={22} height={22} />
          Take Photo
        </button>
        <button type="button" className={styles.galleryButton} onClick={() => inputRef.current?.click()}>
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

function SuccessPanel({ onRetake }: { onRetake: () => void }) {
  return (
    <section className={styles.successPanel} aria-label="KIA book extraction result">
      <div className={styles.previewPane}>
        <span className={styles.successBadge}>
          <AppIcon name="checkCircle" width={12} height={12} />
          Analysis Complete
        </span>
        <img src="/figma-upload/kia-preview.png" alt="KIA book preview" />
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
            <dd><span className={styles.ancBadge}>K3</span></dd>
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
          <Link href="/master/add-patient" className={styles.continueButton}>
            Continue to Registration Form
            <AppIcon name="arrowRight" width={18} height={18} />
          </Link>
        </div>
      </div>
    </section>
  );
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
