'use client';

import Typography from 'antd/es/typography';
import { usePathname } from 'next/navigation';
import type { CurrentUser } from '@/lib/api';
import { NotificationCenter } from './notification-center';
import { getProfile, navItems, resolveSelectedKey } from './layout-menu';
import styles from './topbar.module.css';

type TopbarProps = {
  user: CurrentUser;
};

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname() ?? '';
  const selectedKey = resolveSelectedKey(pathname);
  const activeItem = navItems.find((item) => item.key === selectedKey);
  const profile = getProfile(user);

  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <Typography.Text className={styles.brand}>{activeItem?.label ?? 'Dashboard'}</Typography.Text>
        <Typography.Text className={styles.context}>{profile.role}</Typography.Text>
      </div>
      <div className={styles.actions}>
        <NotificationCenter user={user} buttonClassName={styles.iconButton} />
        <span className={styles.profile} aria-label={profile.name}>{profile.name.slice(0, 2).toUpperCase()}</span>
      </div>
    </header>
  );
}
