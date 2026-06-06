import type { ReactNode } from 'react';
import styles from './page-container.module.css';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: 'standard' | 'wide' | 'narrow';
};

export function PageContainer({ children, className = '', size = 'standard' }: PageContainerProps) {
  return <main className={[styles.container, styles[size], className].filter(Boolean).join(' ')}>{children}</main>;
}
