import type { ReactNode } from 'react';
import styles from './form-field.module.css';

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, hint, children, className = '' }: FormFieldProps) {
  return (
    <label className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint ? <small className={styles.hint}>{hint}</small> : null}
    </label>
  );
}
