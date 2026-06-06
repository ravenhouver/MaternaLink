import type { ReactNode } from 'react';
import Typography from 'antd/es/typography';
import styles from './section-header.module.css';

type SectionHeaderProps = {
  title: string;
  iconSrc?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, iconSrc, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')}>
      <span className={styles.titleWrap}>
        {iconSrc ? <img src={iconSrc} alt="" /> : null}
        <Typography.Title level={3} className={styles.title}>
          {title}
        </Typography.Title>
      </span>
      {action ? <span className={styles.action}>{action}</span> : null}
    </div>
  );
}
