import { SectionHeader } from '@/components/ui/section-header';
import { AppIcon } from '@/components/ui/app-icon';
import type { QuickAction } from '../dashboard-data';
import styles from '../dashboard.module.css';

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className={styles.quickColumn}>
      <SectionHeader title="Aksi Cepat" icon="zap" />
      <div className={styles.quickGrid}>
        {actions.map((item) => (
          <button className={styles.quickAction} type="button" key={item.label}>
            <span className={[styles.quickIcon, item.active ? styles.quickIconActive : ''].filter(Boolean).join(' ')}>
              <AppIcon name={item.icon} width={24} height={24} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
