import type { ReactNode } from 'react';
import styles from './status-pill.module.css';

type StatusTone = 'blue' | 'green' | 'red' | 'amber' | 'muted';

type StatusPillProps = {
  children: ReactNode;
  tone: StatusTone;
  className?: string;
};

export function StatusPill({ children, tone, className = '' }: StatusPillProps) {
  return <span className={[styles.pill, styles[tone], className].filter(Boolean).join(' ')}>{children}</span>;
}
