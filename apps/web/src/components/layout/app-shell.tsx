'use client';

import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import theme from 'antd/es/theme';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import styles from './app-shell.module.css';

const { Content } = Layout;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isLogin = pathname === '/login';
  const isMedicineSender = pathname.startsWith('/medicine-sender');
  const hasTopbar = pathname !== '/';

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

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className={[styles.shell, isSidebarCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <Sidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((current) => !current)} />
        <Layout className={styles.mainLayout}>
          {hasTopbar ? <Topbar /> : null}
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

