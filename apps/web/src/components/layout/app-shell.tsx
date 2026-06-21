'use client';

import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import theme from 'antd/es/theme';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, type CurrentUser } from '@/lib/api';
import { routes } from '@/lib/routes';
import { ActionNotificationBridge } from './action-notification-bridge';
import { getBrandHref, isRouteAllowedForRole } from './layout-menu';
import { MobileNavbar } from './mobile-navbar';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import styles from './app-shell.module.css';

const { Content } = Layout;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isLogin = pathname === routes.login;
  const isEmbeddedRoleShellPage = pathname.startsWith(routes.admin);
  const hasTopbar = pathname !== routes.dashboard;

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((currentUser) => {
      if (cancelled) return;
      setUser(currentUser);
      setIsAuthLoading(false);

      if (!currentUser && !isLogin) router.replace(routes.login);
      if (currentUser && isLogin) {
        router.replace(getBrandHref(currentUser.role));
      }
      if (currentUser && !isLogin && !isRouteAllowedForRole(pathname, currentUser.role)) {
        router.replace(getBrandHref(currentUser.role));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname, router]);

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

  if (isLogin) {
    return (
      <ConfigProvider theme={themeConfig}>
        <ActionNotificationBridge />
        {children}
      </ConfigProvider>
    );
  }

  if (isEmbeddedRoleShellPage) {
    if (isAuthLoading || !user) {
      return (
        <ConfigProvider theme={themeConfig}>
          <ActionNotificationBridge />
        </ConfigProvider>
      );
    }
    if (!isRouteAllowedForRole(pathname, user.role)) {
      return (
        <ConfigProvider theme={themeConfig}>
          <ActionNotificationBridge />
        </ConfigProvider>
      );
    }
    return (
      <ConfigProvider theme={themeConfig}>
        <ActionNotificationBridge />
        {children}
      </ConfigProvider>
    );
  }

  if (isAuthLoading || !user) {
    return (
      <ConfigProvider theme={themeConfig}>
        <ActionNotificationBridge />
      </ConfigProvider>
    );
  }

  if (!isRouteAllowedForRole(pathname, user.role)) {
    return (
      <ConfigProvider theme={themeConfig}>
        <ActionNotificationBridge />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <ActionNotificationBridge />
      <Layout className={[styles.shell, isSidebarCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <MobileNavbar user={user} />
        <Sidebar collapsed={isSidebarCollapsed} user={user} onToggle={() => setIsSidebarCollapsed((current) => !current)} />
        <Layout className={styles.mainLayout}>
          {hasTopbar ? <Topbar user={user} /> : null}
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

