import type { ReactNode } from 'react';
import Typography from 'antd/es/typography';
import { AppIcon, type AppIconName } from './app-icon';
import styles from './section-header.module.css';

type SectionHeaderProps = {
  title: string;
  icon?: AppIconName;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, icon, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')}>
      <span className={styles.titleWrap}>
        {icon ? <AppIcon name={icon} className={styles.icon} width={18} height={18} /> : null}
        <Typography.Title level={3} className={styles.title}>
          {title}
        </Typography.Title>
      </span>
      {action ? <span className={styles.action}>{action}</span> : null}
    </div>
  );
}
