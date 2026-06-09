'use client';

import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import theme from 'antd/es/theme';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, type CurrentUser } from '@/lib/api';
import { routes } from '@/lib/routes';
import { MobileNavbar } from './mobile-navbar';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import styles from './app-shell.module.css';

const { Content } = Layout;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isLogin = pathname === routes.login;
  const isMedicineSender = pathname.startsWith('/medicine-sender');
  const isEmbeddedIfkPage =
    pathname === routes.ifk ||
    pathname === routes.ifkRecommendations ||
    pathname === routes.ifkClinics ||
    pathname === routes.ifkEnvironment ||
    pathname === routes.ifkDecisionHistory;
  const hasTopbar = pathname !== routes.dashboard;

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((currentUser) => {
      if (cancelled) return;
      setUser(currentUser);
      setIsAuthLoading(false);

      if (!currentUser && !isLogin) router.replace(routes.login);
      if (currentUser && isLogin) {
        router.replace(currentUser.role === 'IFK_ADMIN' ? routes.ifkRecommendations : routes.queue);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLogin, router]);

  const themeConfig = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1a73e8',
      borderRadius: 16,
      colorBgLayout: '#f8fafd',
      fontFamily: 'Inter, Arial, sans-serif',
    },
    components: {
      Typography: {
        titleMarginBottom: 0,
        titleMarginTop: 0,
      },
    },
  };

  if (isLogin || isMedicineSender) {
    return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
  }

  if (isEmbeddedIfkPage) {
    if (isAuthLoading || !user) return <ConfigProvider theme={themeConfig}>{null}</ConfigProvider>;
    return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
  }

  if (isAuthLoading || !user) {
    return <ConfigProvider theme={themeConfig}>{null}</ConfigProvider>;
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className={[styles.shell, isSidebarCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <MobileNavbar user={user} />
        <Sidebar collapsed={isSidebarCollapsed} user={user} onToggle={() => setIsSidebarCollapsed((current) => !current)} />
        <Layout className={styles.mainLayout}>
          {hasTopbar ? <Topbar /> : null}
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

