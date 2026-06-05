'use client';

import AlertOutlined from '@ant-design/icons/AlertOutlined';
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import FormOutlined from '@ant-design/icons/FormOutlined';
import MedicineBoxOutlined from '@ant-design/icons/MedicineBoxOutlined';
import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import type { MenuProps } from 'antd/es/menu';
import theme from 'antd/es/theme';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const { Header, Content, Sider } = Layout;

const navItems = [
  { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: '/master', icon: <DatabaseOutlined />, label: 'Master Data' },
  { key: '/inputs', icon: <FormOutlined />, label: 'Inputs' },
  { key: '/forecast', icon: <BarChartOutlined />, label: 'Forecast' },
  { key: '/lplpo', icon: <MedicineBoxOutlined />, label: 'LPLPO' },
  { key: '/distribution', icon: <AlertOutlined />, label: 'Distribution' },
];

const menuItems: MenuProps['items'] = navItems.map((item) => ({
  key: item.key,
  icon: item.icon,
  label: <Link href={item.key}>{item.label}</Link>,
}));

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const selectedKey = navItems.some((item) => item.key === pathname) ? pathname : '/';

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: 'Inter, Arial, sans-serif',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider breakpoint="lg" collapsedWidth="0" width={248} style={{ background: '#ffffff', borderRight: '1px solid #edf0f5' }}>
          <div style={{ padding: 20 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              MaternaLink
            </Typography.Title>
            <Typography.Text type="secondary">Supply planning</Typography.Text>
          </div>
          <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderInlineEnd: 0 }} />
        </Sider>
        <Layout>
          <Header style={{ background: '#ffffff', borderBottom: '1px solid #edf0f5', padding: '0 24px' }}>
            <Typography.Text strong>Maternal Health Supply Chain Dashboard</Typography.Text>
          </Header>
          <Content style={{ padding: 24 }}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
