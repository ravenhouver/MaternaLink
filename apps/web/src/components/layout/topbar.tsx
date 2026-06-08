'use client';

import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from './topbar.module.css';

function showNextPhaseNotice(label: string) {
  window.alert(`${label} akan tersedia pada fase berikutnya.`);
}

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <Typography.Text className={styles.brand}>MaternaLink</Typography.Text>
      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} aria-label="Notifikasi" onClick={() => showNextPhaseNotice('Notifikasi')}>
          <AppIcon name="bell" width={20} height={20} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Akun" onClick={() => showNextPhaseNotice('Menu akun')}>
          <AppIcon name="user" width={20} height={20} />
        </button>
      </div>
    </header>
  );
}
