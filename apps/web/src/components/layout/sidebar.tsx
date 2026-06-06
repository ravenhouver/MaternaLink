'use client';

import Layout from 'antd/es/layout';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.css';

const { Sider } = Layout;

const asset = (name: string) => `/figma-dashboard/${name}`;

const navItems = [
  { key: '/', href: '/', icon: 'nav-home.svg', label: 'Beranda' },
  { key: '/master', href: '/master', icon: 'nav-patients.svg', label: 'Daftar Pasien' },
  { key: '/forecast', href: '/forecast', icon: 'nav-calendar.svg', label: 'Kalender Prediksi' },
  { key: '/lplpo', href: '/lplpo', icon: 'nav-medicine.svg', label: 'Kebutuhan Obat' },
];

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
    : { name: 'Bidan Sari', role: 'ADMIN UTAMA', photo: asset('profil-bidan.png') };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={collapsed ? 88 : 256}
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
          <Link href="/" className={styles.brandBlock} aria-label="MaternaLink beranda">
            <span className={styles.brandIcon}>
              <img src={asset('logo.svg')} alt="" />
            </span>
            <span className={styles.brandCopy}>
              <Typography.Text className={styles.brandTitle}>MaternaLink</Typography.Text>
              <Typography.Text className={styles.brandSubtitle}>Digital Sanctuary</Typography.Text>
            </span>
          </Link>
          <button type="button" className={styles.toggle} aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'} aria-expanded={!collapsed} onClick={onToggle}>
            <img src={asset('chevron.svg')} alt="" />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Navigasi utama">
          {navItems.map((item) => {
            const isActive = item.key === selectedKey;

            return (
              <Link key={item.key} href={item.href} className={[styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                <img src={asset(item.icon)} alt="" className={styles.navIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.profileArea}>
        {hasTopbar ? (
          <Link href="/settings" className={[styles.navItem, styles.settingsLink].join(' ')} prefetch={false}>
            <img src="/figma-patients/settings.svg" alt="" className={styles.navIcon} />
            <span>Pengaturan</span>
          </Link>
        ) : null}
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
    </Sider>
  );
}
