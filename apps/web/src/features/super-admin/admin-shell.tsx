'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { NotificationCenter } from '@/components/layout/notification-center';
import { LanguageSwitcher } from '@/components/language-switcher';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import type { CurrentUser } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type AdminPageKey = 'dashboard' | 'health-centers' | 'users' | 'medicines' | 'facility-profiles';

const navItems: Array<{ key: AdminPageKey; labelKey: string; icon: AppIconName; href: string }> = [
  { key: 'dashboard', labelKey: 'dashboard', icon: 'grid', href: routes.admin },
  { key: 'health-centers', labelKey: 'healthCenters', icon: 'briefcase', href: routes.adminHealthCenters },
  { key: 'users', labelKey: 'users', icon: 'users', href: routes.adminUsers },
  { key: 'medicines', labelKey: 'medicines', icon: 'clipboard', href: routes.adminMedicines },
  { key: 'facility-profiles', labelKey: 'facilityProfiles', icon: 'archive', href: routes.adminFacilityProfiles },
];

export function AdminShell({ active, breadcrumb, user, children }: { active: AdminPageKey; breadcrumb: string; user: CurrentUser | null; children: ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const displayName = user?.displayName ?? user?.username ?? 'Super Admin';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SA';

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label={tCommon('mainNavigation')}>
        <Link href={routes.admin} className={styles.brand} aria-label={tCommon('brandHome')}>
          <span className={styles.brandIcon}><AppIcon name="briefcase" width={20} height={20} /></span>
          <span className={styles.brandText}><strong>MaternaLink</strong><small>{t('superAdmin')}</small></span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link href={item.href} className={[styles.navItem, item.key === active ? styles.activeNav : ''].filter(Boolean).join(' ')} key={item.key}>
              <AppIcon name={item.icon} width={20} height={20} />
              <span>{tNav(item.labelKey)}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <LanguageSwitcher className={styles.adminLanguageSwitcher} />
          <RoleLogoutButton className={styles.navItem} />
        </div>
      </aside>

      <section className={styles.mainArea}>
        <header className={styles.topbar}>
          <nav className={styles.breadcrumbs} aria-label={tCommon('breadcrumb')}>
            <Link href={routes.admin}>{tCommon('home')}</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <strong>{breadcrumb}</strong>
          </nav>
          <div className={styles.topbarActions}>
            {user ? <NotificationCenter user={user} /> : null}
            <button className={styles.iconButton} type="button" aria-label={tCommon('settings')} onClick={() => setIsSettingsOpen(true)}><AppIcon name="settings" width={20} height={20} /></button>
            <div className={styles.profile}>
              <span><strong>{displayName}</strong><small>{t('superAdmin')}</small></span>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
            </div>
          </div>
        </header>

        {children}
      </section>

      {isSettingsOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setIsSettingsOpen(false)}>
          <section className={styles.sideDrawer} role="dialog" aria-modal="true" aria-label={t('settingsTitle')} onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>{t('settingsTitle')}</h2>
              <button type="button" aria-label={tCommon('closeMenu')} onClick={() => setIsSettingsOpen(false)}><AppIcon name="circleStop" width={18} height={18} /></button>
            </header>
            <AdminSettings user={user} />
          </section>
        </div>
      ) : null}
    </main>
  );
}

function AdminSettings({ user }: { user: CurrentUser | null }) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  return (
    <div className={styles.drawerBody}>
      <dl className={styles.settingsList}>
        <div><dt>{tCommon('username')}</dt><dd>{user?.username ?? '-'}</dd></div>
        <div><dt>{tCommon('role')}</dt><dd>{user?.role ?? '-'}</dd></div>
        <div><dt>{t('session')}</dt><dd>{t('settingsSession')}</dd></div>
      </dl>
      <RoleLogoutButton className={styles.primaryButton} />
    </div>
  );
}
