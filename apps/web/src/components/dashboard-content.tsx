'use client';

import Card from 'antd/es/card';
import Col from 'antd/es/col';
import Row from 'antd/es/row';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import type { ApiReachability } from '@/lib/api';

const modules = [
  { title: 'Master Data', href: '/master', value: 4 },
  { title: 'Inputs', href: '/inputs', value: 5 },
  { title: 'Forecast', href: '/forecast', value: 3 },
  { title: 'Distribution', href: '/distribution', value: 2 },
];

type DashboardContentProps = {
  apiBaseUrl: string;
  reachability: ApiReachability;
};

export function DashboardContent({ apiBaseUrl, reachability }: DashboardContentProps) {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          Dashboard
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Setup dashboard for the existing MaternaLink API workflow.
        </Typography.Paragraph>
      </div>

      <Card style={{ borderColor: reachability.ok ? '#b7eb8f' : '#ffe58f' }}>
        <Typography.Text strong>{reachability.ok ? 'API reachable' : 'API unavailable'}</Typography.Text>
        <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
          {reachability.message}. Base URL: {apiBaseUrl}
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} xl={6} key={module.href}>
            <Link href={module.href}>
              <Card hoverable>
                <Typography.Text type="secondary">{module.title}</Typography.Text>
                <Typography.Title level={3} style={{ margin: '8px 0 0' }}>
                  {module.value} areas
                </Typography.Title>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
