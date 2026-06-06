import type { CSSProperties, ReactNode } from 'react';
import styles from './responsive-card-grid.module.css';

type ResponsiveCardGridProps = {
  children: ReactNode;
  minCardWidth?: string;
  className?: string;
};

export function ResponsiveCardGrid({ children, minCardWidth = '220px', className = '' }: ResponsiveCardGridProps) {
  return (
    <div className={[styles.grid, className].filter(Boolean).join(' ')} style={{ '--min-card-width': minCardWidth } as CSSProperties}>
      {children}
    </div>
  );
}
