'use client';

import Drawer from 'antd/es/drawer';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const selectedKey = resolveSelectedKey(pathname);
  const visibleItems = getVisibleNavItems(user.role) as Array<{ key: string; href: string; icon: AppIconName; labelKey: string; roles: UserRole[] }>;
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
        <Link href={brandHref} className={styles.brand} aria-label={tCommon('brandHome')}>
          <span className={styles.brandIcon}>
            <AppIcon name="shield" width={18} height={18} />
          </span>
          <span className={styles.brandCopy}>
            <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
            <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
          </span>
        </Link>
        <button type="button" className={styles.menuButton} aria-label={tCommon('openMenu')} aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
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
        size={304}
        title={null}
      >
        <div className={styles.drawerHeader}>
          <Link href={brandHref} className={styles.drawerBrand} aria-label={tCommon('brandHome')}>
            <span className={styles.brandIcon}>
              <AppIcon name="shield" width={18} height={18} />
            </span>
            <span className={styles.brandCopy}>
              <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
              <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
            </span>
          </Link>
          <button type="button" className={styles.closeButton} aria-label={tCommon('closeMenu')} onClick={() => setIsOpen(false)}>
            <AppIcon name="x" width={20} height={20} />
          </button>
        </div>

        <nav className={styles.nav} aria-label={tCommon('mobileNavigation')}>
          {visibleItems.map((item) => {
            const isActive = item.key === selectedKey;

            return (
              <Link key={item.key} href={item.href} className={[styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                <AppIcon name={item.icon} className={styles.navIcon} width={20} height={20} />
                <span>{tNav(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.drawerFooter}>
          <button type="button" className={[styles.navItem, styles.navButton].join(' ')} onClick={handleLogout} disabled={isLoggingOut}>
            <AppIcon name="logOut" className={styles.navIcon} width={20} height={20} />
            <span>{isLoggingOut ? tCommon('loggingOut') : tCommon('logout')}</span>
          </button>
          <div className={styles.profileCard}>
            <span className={styles.profilePhoto}>
              {profile.initials}
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
