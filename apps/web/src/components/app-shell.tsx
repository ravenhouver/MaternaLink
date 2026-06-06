'use client';

import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import theme from 'antd/es/theme';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

const { Content, Sider } = Layout;

const asset = (name: string) => `/figma-dashboard/${name}`;

const navItems = [
  { key: '/', href: '/', icon: 'nav-home.svg', label: 'Beranda' },
  { key: '/master', href: '/master', icon: 'nav-patients.svg', label: 'Daftar Pasien' },
  { key: '/forecast', href: '/forecast', icon: 'nav-calendar.svg', label: 'Kalender Prediksi' },
  { key: '/lplpo', href: '/lplpo', icon: 'nav-medicine.svg', label: 'Kebutuhan Obat' },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAddPatient = pathname === '/master/add-patient';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const selectedKey = pathname.startsWith('/master') ? '/master' : navItems.some((item) => item.key === pathname) ? pathname : '/';
  const hasTopbar = pathname !== '/';
  const isForecast = pathname === '/forecast';
  const isMedicine = pathname === '/lplpo';
  const profile = hasTopbar
    ? isMedicine
      ? { name: 'Bidan Sarah', role: 'Puskesmas Melati', photo: '/figma-medicine/bidan-sarah.png' }
      : isForecast
      ? { name: 'Siti Aminah', role: 'Bidan Senior', photo: '/figma-calendar/bidan-profil.png' }
      : { name: 'Dr. Siti Aminah', role: 'Bidan Utama', photo: '/figma-patients/doctor-siti.png' }
    : { name: 'Bidan Sari', role: 'ADMIN UTAMA', photo: asset('profil-bidan.png') };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1a73e8',
          borderRadius: 24,
          colorBgLayout: '#f8fafd',
          fontFamily: 'Inter, Arial, sans-serif',
        },
        components: {
          Typography: {
            titleMarginBottom: 0,
            titleMarginTop: 0,
          },
        },
      }}
    >
      <Layout
        className={`maternalink-shell${isForecast ? ' calendar-shell' : ''}${isMedicine ? ' medicine-shell' : ''}${
          isAddPatient ? ' add-patient-shell' : ''
        }${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      >
        <Sider breakpoint="lg" collapsedWidth="0" width={isSidebarCollapsed ? 88 : 256} className="maternalink-sider">
          <div className="sider-main">
            <div className="sider-header">
              <Link href="/" className="brand-block" aria-label="MaternaLink beranda">
                <span className="brand-icon">
                  <img src={asset('logo.svg')} alt="" />
                </span>
                <span className="brand-copy">
                  <Typography.Text className="brand-title">MaternaLink</Typography.Text>
                  <Typography.Text className="brand-subtitle">Digital Sanctuary</Typography.Text>
                </span>
              </Link>
              <button
                type="button"
                className="sidebar-toggle"
                aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                aria-expanded={!isSidebarCollapsed}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                <img src={asset('chevron.svg')} alt="" />
              </button>
            </div>

            <nav className="side-nav" aria-label="Navigasi utama">
              {navItems.map((item) => {
                const isActive = item.key === selectedKey;

                return (
                  <Link key={item.key} href={item.href} className={`side-nav-item${isActive ? ' active' : ''}`}>
                    <img src={asset(item.icon)} alt="" className="side-nav-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="sider-profile">
            {hasTopbar ? (
              <Link href="/settings" className="side-nav-item settings-link" prefetch={false}>
                <img src="/figma-patients/settings.svg" alt="" className="side-nav-icon" />
                <span>Pengaturan</span>
              </Link>
            ) : null}
            <div className="profile-card">
              <span className="profile-photo">
                <img src={profile.photo} alt={profile.name} />
              </span>
              <span className="profile-copy">
                <Typography.Text className="profile-name">{profile.name}</Typography.Text>
                <Typography.Text className="profile-role">{profile.role}</Typography.Text>
              </span>
            </div>
          </div>
        </Sider>

        <Layout className="maternalink-main-layout">
          {hasTopbar ? (
            <header className="maternalink-topbar">
              <Typography.Text className="topbar-brand">MaternaLink</Typography.Text>
              <div className="topbar-actions">
                <button type="button" className="topbar-icon" aria-label="Notifikasi">
                  <img src="/figma-patients/top-bell.svg" alt="" />
                </button>
                <button type="button" className="topbar-icon" aria-label="Akun">
                  <img src="/figma-patients/top-user.svg" alt="" />
                </button>
              </div>
            </header>
          ) : null}
          <Content className="maternalink-content">{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
