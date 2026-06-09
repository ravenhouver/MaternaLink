'use client';

import Drawer from 'antd/es/drawer';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { logout, type CurrentUser, type UserRole } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getBrandHref, getProfile, getVisibleNavItems, resolveSelectedKey } from './layout-menu';
import { performLogout } from './logout-action';
import styles from './mobile-navbar.module.css';

type MobileNavbarProps = {
  user: CurrentUser;
};

export function MobileNavbar({ user }: MobileNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const selectedKey = resolveSelectedKey(pathname);
  const visibleItems = getVisibleNavItems(user.role) as Array<{ key: string; href: string; icon: AppIconName; label: string; roles: UserRole[] }>;
  const profile = getProfile(user);
  const brandHref = getBrandHref(user.role);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await performLogout({
      logout,
      redirectToLogin: () => router.replace(routes.login),
    });
  };

  return (
    <>
      <header className={styles.mobileBar}>
        <Link href={brandHref} className={styles.brand} aria-label="MaternaLink beranda">
          <span className={styles.brandIcon}>
            <AppIcon name="shield" width={18} height={18} />
          </span>
          <span className={styles.brandCopy}>
            <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
            <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
          </span>
        </Link>
        <button type="button" className={styles.menuButton} aria-label="Buka menu" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
          <AppIcon name="menu" width={22} height={22} />
        </button>
      </header>

      <Drawer
        className={styles.drawer}
        closeIcon={null}
        footer={null}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        placement="left"
        rootClassName={styles.drawerRoot}
        title={null}
        width={304}
      >
        <div className={styles.drawerHeader}>
          <Link href={brandHref} className={styles.drawerBrand} aria-label="MaternaLink beranda">
            <span className={styles.brandIcon}>
              <AppIcon name="shield" width={18} height={18} />
            </span>
            <span className={styles.brandCopy}>
              <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
              <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
            </span>
          </Link>
          <button type="button" className={styles.closeButton} aria-label="Tutup menu" onClick={() => setIsOpen(false)}>
            <AppIcon name="x" width={20} height={20} />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Navigasi mobile">
          {visibleItems.map((item) => {
            const isActive = item.key === selectedKey;

            return (
              <Link key={item.key} href={item.href} className={[styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                <AppIcon name={item.icon} className={styles.navIcon} width={20} height={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.drawerFooter}>
          <Link href="/settings" className={styles.navItem} prefetch={false}>
            <AppIcon name="settings" className={styles.navIcon} width={20} height={20} />
            <span>Pengaturan</span>
          </Link>
          <button type="button" className={[styles.navItem, styles.navButton].join(' ')} onClick={handleLogout} disabled={isLoggingOut}>
            <AppIcon name="logOut" className={styles.navIcon} width={20} height={20} />
            <span>{isLoggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
          <div className={styles.profileCard}>
            <span className={styles.profilePhoto}>
              <img src={profile.photo} alt={profile.name} />
            </span>
            <span className={styles.profileCopy}>
              <Typography.Text className={styles.profileName}>{profile.name}</Typography.Text>
              <Typography.Text className={styles.profileRole}>{profile.role}</Typography.Text>
            </span>
          </div>
        </div>
      </Drawer>
    </>
  );
}
