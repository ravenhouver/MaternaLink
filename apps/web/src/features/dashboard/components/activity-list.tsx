import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Typography from 'antd/es/typography';
import { SectionHeader } from '@/components/ui/section-header';
import { AppIcon } from '@/components/ui/app-icon';
import type { RecentActivity } from '../dashboard-data';
import styles from '../dashboard.module.css';

type ActivityListProps = {
  activities: RecentActivity[];
};

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className={styles.activityColumn}>
      <SectionHeader title="Aktivitas Terkini" action={<Button type="link" className={styles.viewAllButton}>Lihat Semua</Button>} />
      <Card className={styles.activityCard} styles={{ body: { padding: 0 } }}>
        {activities.map((item) => (
          <button className={styles.activityRow} type="button" key={item.name}>
            <span className={styles.activityIcon} style={{ backgroundColor: item.background }}>
              <AppIcon name={item.icon} width={18} height={18} />
            </span>
            <span className={styles.activityCopy}>
              <Typography.Text className={styles.activityTitle}>
                <strong>{item.name}</strong> - {item.title}
              </Typography.Text>
              <Typography.Text className={styles.activityMeta}>{item.meta}</Typography.Text>
            </span>
            <AppIcon name="chevronRight" className={styles.activityChevron} width={18} height={18} />
          </button>
        ))}
      </Card>
    </div>
  );
}
