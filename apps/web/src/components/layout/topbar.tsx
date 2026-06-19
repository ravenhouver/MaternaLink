'use client';

import Typography from 'antd/es/typography';
import type { CurrentUser } from '@/lib/api';
import { NotificationCenter } from './notification-center';
import styles from './topbar.module.css';

type TopbarProps = {
  user: CurrentUser;
};

export function Topbar({ user }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <Typography.Text className={styles.brand}>MaternaLink</Typography.Text>
      <div className={styles.actions}>
        <NotificationCenter user={user} buttonClassName={styles.iconButton} />
      </div>
    </header>
  );
}
