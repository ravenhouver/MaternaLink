import type { ReactNode } from 'react';
import styles from './action-card.module.css';

type ActionCardProps = {
  title: string;
  description?: string;
  iconSrc?: string;
  active?: boolean;
  featured?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function ActionCard({ title, description, iconSrc, active = false, featured = false, className = '', children, onClick }: ActionCardProps) {
  return (
    <button type="button" className={[styles.card, active ? styles.active : '', featured ? styles.featured : '', className].filter(Boolean).join(' ')} onClick={onClick}>
      {iconSrc ? (
        <span className={styles.icon}>
          <img src={iconSrc} alt="" />
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
