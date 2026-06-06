import styles from './step-indicator.module.css';

type StepItem = {
  number: number;
  label: string;
};

type StepIndicatorProps = {
  steps: StepItem[];
  currentStep: number;
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className={styles.steps} aria-label="Tahapan pendaftaran pasien">
      {steps.map((step, index) => (
        <li className={[styles.step, currentStep === step.number ? styles.active : ''].filter(Boolean).join(' ')} key={step.number}>
          <span className={styles.badge}>{step.number}</span>
          <span className={styles.label}>{step.label}</span>
          {index < steps.length - 1 ? <span className={styles.line} aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}
