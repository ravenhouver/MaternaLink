'use client';

import Layout from 'antd/es/layout';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { logout, type CurrentUser, type UserRole } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getBrandHref, getProfile, getVisibleNavItems, resolveSelectedKey } from './layout-menu';
import { performLogout } from './logout-action';
import styles from './sidebar.module.css';

const { Sider } = Layout;

type SidebarProps = {
  collapsed: boolean;
  user: CurrentUser;
  onToggle: () => void;
};

export function Sidebar({ collapsed, user, onToggle }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasTopbar = pathname !== routes.dashboard;
  const selectedKey = resolveSelectedKey(pathname);
  const visibleItems = getVisibleNavItems(user.role) as Array<{ key: string; href: string; icon: AppIconName; labelKey: string; roles: UserRole[] }>;
  const profile = getProfile(user);
  const brandHref = getBrandHref(user.role);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await performLogout({
      logout,
      redirectToLogin: () => router.replace(routes.login),
    });
  };

  return (
    <Sider
      breakpoint="lg"
      collapsed={collapsed}
      collapsedWidth={80}
      width={256}
      className={styles.sider}
      zeroWidthTriggerStyle={{
        top: 64,
        background: '#ffffff',
        color: '#1a73e8',
        boxShadow: '0 8px 20px rgb(15 23 42 / 0.12)',
      }}
    >
      <div className={styles.main}>
        <div className={styles.header}>
          {collapsed ? (
            <button type="button" className={[styles.brandBlock, styles.brandButton].join(' ')} aria-label={tCommon('openSidebar')} aria-expanded={false} onClick={onToggle}>
              <span className={styles.brandIcon}>
                <AppIcon name="shield" width={20} height={20} />
              </span>
            </button>
          ) : (
            <>
              <Link href={brandHref} className={styles.brandBlock} aria-label={tCommon('brandHome')}>
                <span className={styles.brandIcon}>
                  <AppIcon name="shield" width={20} height={20} />
                </span>
                <span className={styles.brandCopy}>
                  <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
                  <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
                </span>
              </Link>
              <button type="button" className={styles.toggle} aria-label={tCommon('closeSidebar')} aria-expanded onClick={onToggle}>
                <AppIcon name="chevronLeft" width={18} height={18} />
              </button>
            </>
          )}
        </div>

        <nav className={styles.nav} aria-label={tCommon('mainNavigation')}>
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
      </div>

      <div className={styles.profileArea}>
        {!collapsed ? <LanguageSwitcher className={styles.languageSwitcher} /> : null}
        <button type="button" className={[styles.navItem, styles.navButton].join(' ')} onClick={handleLogout} disabled={isLoggingOut}>
          <AppIcon name="logOut" className={styles.navIcon} width={22} height={22} />
          <span>{isLoggingOut ? tCommon('loggingOut') : tCommon('logout')}</span>
        </button>
        {hasTopbar && !collapsed ? (
          <div className={styles.profileCard}>
            <span className={styles.profilePhoto}>
              {profile.initials}
            </span>
            <span className={styles.profileCopy}>
              <Typography.Text className={styles.profileName}>{profile.name}</Typography.Text>
              <Typography.Text className={styles.profileRole}>{profile.role}</Typography.Text>
            </span>
          </div>
        ) : null}
      </div>
    </Sider>
  );
}
