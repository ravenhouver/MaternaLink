'use client';

import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './patient-registration.module.css';

const steps = ['Upload Photo', 'Personal Data', 'Pregnancy Data', 'Screening & Risk'];

export function UploadKiaBookContent() {
  return (
    <PageContainer size="wide" className={styles.uploadPage}>
      <header className={styles.uploadHeader}>
        <h1>Upload KIA Book Photo</h1>
        <p>Photo of identity page and last examination in KIA Book. Data will be extracted automatically then fill the registration form.</p>
      </header>

      <section className={styles.uploadStepper} aria-label="Registration progress">
        {steps.map((step, index) => (
          <div className={`${styles.uploadStep} ${index === 0 ? styles.activeUploadStep : ''}`} key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </section>

      <p className={styles.stepperHint}>Form will be filled after photo is processed</p>

      <section className={styles.uploadCard} aria-label="KIA book upload">
        <label className={styles.dropZone}>
          <input accept="image/png,image/jpeg" type="file" />
          <span className={styles.dropIcon}><AppIcon name="camera" width={56} height={56} /></span>
          <strong>Drag photo here or Select File</strong>
          <small>Supported formats: JPG, PNG (Max. 5MB)</small>
        </label>

        <div className={styles.uploadActions}>
          <button type="button" className={styles.takePhotoButton}>
            <AppIcon name="camera" width={22} height={22} />
            Take Photo
          </button>
          <label className={styles.galleryButton}>
            <input accept="image/png,image/jpeg" type="file" />
            <AppIcon name="upload" width={22} height={22} />
            Select from Gallery
          </label>
        </div>
      </section>

      <aside className={styles.photoHint}>
        <AppIcon name="info" width={18} height={18} />
        <p>Ensure photo is clear: mother's identity page, LMP, gestational age, and last examination results are clearly readable for data accuracy.</p>
      </aside>
    </PageContainer>
  );
}
