'use client';

import Layout from 'antd/es/layout';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import styles from './sidebar.module.css';

const { Sider } = Layout;

const navItems = [
  { key: '/', href: '/', icon: 'home', label: 'Beranda' },
  { key: '/master', href: '/master', icon: 'users', label: 'Daftar Pasien' },
  { key: '/forecast', href: '/forecast', icon: 'calendar', label: 'Kalender Prediksi' },
  { key: '/lplpo', href: '/lplpo', icon: 'package', label: 'Kebutuhan Obat' },
] satisfies Array<{ key: string; href: string; icon: AppIconName; label: string }>;

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const hasTopbar = pathname !== '/';
  const isForecast = pathname === '/forecast';
  const isMedicine = pathname === '/lplpo';
  const selectedKey = pathname.startsWith('/master') ? '/master' : navItems.some((item) => item.key === pathname) ? pathname : '/';
  const profile = hasTopbar
    ? isMedicine
      ? { name: 'Bidan Sarah', role: 'Puskesmas Melati', photo: '/figma-medicine/bidan-sarah.png' }
      : isForecast
      ? { name: 'Siti Aminah', role: 'Bidan Senior', photo: '/figma-calendar/bidan-profil.png' }
      : { name: 'Dr. Siti Aminah', role: 'Bidan Utama', photo: '/figma-patients/doctor-siti.png' }
    : { name: 'Bidan Sari', role: 'ADMIN UTAMA', photo: '/figma-dashboard/profil-bidan.png' };

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
            <button type="button" className={[styles.brandBlock, styles.brandButton].join(' ')} aria-label="Buka sidebar" aria-expanded={false} onClick={onToggle}>
              <span className={styles.brandIcon}>
                <AppIcon name="shield" width={20} height={20} />
              </span>
            </button>
          ) : (
            <>
              <Link href="/" className={styles.brandBlock} aria-label="MaternaLink beranda">
                <span className={styles.brandIcon}>
                  <AppIcon name="shield" width={20} height={20} />
                </span>
                <span className={styles.brandCopy}>
                  <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
                  <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
                </span>
              </Link>
              <button type="button" className={styles.toggle} aria-label="Tutup sidebar" aria-expanded onClick={onToggle}>
                <AppIcon name="chevronLeft" width={18} height={18} />
              </button>
            </>
          )}
        </div>

        <nav className={styles.nav} aria-label="Navigasi utama">
          {navItems.map((item) => {
            const isActive = item.key === selectedKey;

            return (
              <Link key={item.key} href={item.href} className={[styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                <AppIcon name={item.icon} className={styles.navIcon} width={22} height={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.profileArea}>
        {hasTopbar || collapsed ? (
          <Link href="/settings" className={[styles.navItem, styles.settingsLink].join(' ')} prefetch={false}>
            <AppIcon name="settings" className={styles.navIcon} width={22} height={22} />
            <span>Pengaturan</span>
          </Link>
        ) : null}
        {collapsed ? null : (
          <div className={styles.profileCard}>
            <span className={styles.profilePhoto}>
              <img src={profile.photo} alt={profile.name} />
            </span>
            <span className={styles.profileCopy}>
              <Typography.Text className={styles.profileName}>{profile.name}</Typography.Text>
              <Typography.Text className={styles.profileRole}>{profile.role}</Typography.Text>
            </span>
          </div>
        )}
      </div>
    </Sider>
  );
}
