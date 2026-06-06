import type { ReactNode } from 'react';
import Typography from 'antd/es/typography';
import styles from './page-header.module.css';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <section className={[styles.header, className].filter(Boolean).join(' ')} aria-label="Ringkasan halaman">
      <div className={styles.copy}>
        <Typography.Title level={1} className={styles.title}>
          {title}
        </Typography.Title>
        {subtitle ? <Typography.Paragraph className={styles.subtitle}>{subtitle}</Typography.Paragraph> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}
