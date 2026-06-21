'use client';

import Card from 'antd/es/card';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';

type ModulePageProps = {
  title: string;
  description: string;
  rows: Array<{ key: string; item: string; status: string }>;
};

export function ModulePage({ title, description, rows }: ModulePageProps) {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, maxWidth: 760 }}>
          {description}
        </Typography.Paragraph>
      </div>
      <Card>
        <Table
          pagination={{ pageSize: 8, showSizeChanger: false }}
          dataSource={rows}
          columns={[
            { title: 'Area', dataIndex: 'item', key: 'item' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
