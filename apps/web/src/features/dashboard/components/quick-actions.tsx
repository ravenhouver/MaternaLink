import { SectionHeader } from '@/components/ui/section-header';
import type { QuickAction } from '../dashboard-data';
import styles from '../dashboard.module.css';

type QuickActionsProps = {
  actions: QuickAction[];
};

const asset = (name: string) => `/figma-dashboard/${name}`;

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className={styles.quickColumn}>
      <SectionHeader title="Aksi Cepat" iconSrc={asset('bolt.svg')} />
      <div className={styles.quickGrid}>
        {actions.map((item) => (
          <button className={styles.quickAction} type="button" key={item.label}>
            <span className={[styles.quickIcon, item.active ? styles.quickIconActive : ''].filter(Boolean).join(' ')}>
              <img src={asset(item.icon)} alt="" />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
