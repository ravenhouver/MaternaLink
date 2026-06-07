import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './app-icon';
import styles from './action-card.module.css';

type ActionCardProps = {
  title: string;
  description?: string;
  icon?: AppIconName;
  active?: boolean;
  featured?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function ActionCard({ title, description, icon, active = false, featured = false, className = '', children, onClick }: ActionCardProps) {
  return (
    <button type="button" className={[styles.card, active ? styles.active : '', featured ? styles.featured : '', className].filter(Boolean).join(' ')} onClick={onClick}>
      {icon ? (
        <span className={styles.icon}>
          <AppIcon name={icon} width={22} height={22} />
        </span>
      ) : null}
      <span className={styles.copy}>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      {children}
    </button>
  );
}
