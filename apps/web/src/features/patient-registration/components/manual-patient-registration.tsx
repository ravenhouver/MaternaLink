import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { StepIndicator } from '@/components/ui/step-indicator';
import { registrationSteps } from '../registration-data';
import { RegistrationStepOne } from './registration-step-one';
import { RegistrationStepThree } from './registration-step-three';
import { RegistrationStepTwo } from './registration-step-two';
import styles from '../patient-registration.module.css';

type ManualPatientRegistrationProps = {
  onBack: () => void;
};

export function ManualPatientRegistration({ onBack }: ManualPatientRegistrationProps) {
  const [registrationStep, setRegistrationStep] = useState(1);
  const isFinalStep = registrationStep === 3;

  return (
    <PageContainer size="narrow" className={styles.registrationPage}>
      <Breadcrumbs
        items={[{ label: 'Beranda', href: '/' }, { label: 'Daftar Pasien', href: '/master' }, { label: 'Tambah Pasien Baru' }]}
      />

      <section className={styles.registrationPanel}>
        <header className={styles.registrationHeader}>
          <Typography.Title level={1}>Pendaftaran Pasien Baru</Typography.Title>
          <Typography.Paragraph>Lengkapi data pasien untuk memulai pemantauan kehamilan.</Typography.Paragraph>
        </header>

        <StepIndicator steps={registrationSteps} currentStep={registrationStep} />

        {registrationStep === 1 ? <RegistrationStepOne /> : registrationStep === 2 ? <RegistrationStepTwo /> : <RegistrationStepThree />}

        <footer className={styles.registrationFormNav}>
          <Button className={styles.registrationBackButton} onClick={registrationStep === 1 ? onBack : () => setRegistrationStep((current) => current - 1)}>
            <AppIcon name="arrowLeft" width={18} height={18} />
            Kembali
          </Button>
          <Button className={[styles.registrationNextButton, isFinalStep ? styles.savePatientButton : ''].filter(Boolean).join(' ')} onClick={() => setRegistrationStep((current) => Math.min(3, current + 1))}>
            {isFinalStep ? (
              <>
                <span className={styles.savePatientIcon} aria-hidden="true" />
                Simpan Pasien
              </>
            ) : (
              <>
                Lanjut
                <AppIcon name="arrowRight" width={18} height={18} />
              </>
            )}
          </Button>
        </footer>
      </section>
    </PageContainer>
  );
}
