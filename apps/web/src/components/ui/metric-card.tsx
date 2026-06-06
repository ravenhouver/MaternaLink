import Card from 'antd/es/card';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import styles from './metric-card.module.css';

type MetricCardProps = {
  label: string;
  value: string;
  iconSrc: string;
  accent: string;
  tag?: string;
};

export function MetricCard({ label, value, iconSrc, accent, tag }: MetricCardProps) {
  return (
    <Card className={styles.card} style={{ borderTopColor: accent }}>
      <div className={styles.topline}>
        <img src={iconSrc} alt="" className={styles.icon} />
        {tag ? (
          <Tag className={styles.tag} style={{ color: accent, backgroundColor: `${accent}1A` }}>
            {tag}
          </Tag>
        ) : null}
      </div>
      <Typography.Text className={styles.label}>
        {label.split('\n').map((line) => (
          <span key={line}>{line}</span>
        ))}
      </Typography.Text>
      <Typography.Title level={3} className={styles.value}>
        {value}
      </Typography.Title>
    </Card>
  );
}
