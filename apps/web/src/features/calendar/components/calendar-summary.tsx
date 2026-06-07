import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import type { summaryItems } from '../calendar-data';
import styles from '../calendar.module.css';

type CalendarSummaryProps = {
  items: typeof summaryItems;
};

export function CalendarSummary({ items }: CalendarSummaryProps) {
  return (
    <section className={styles.summary} aria-label="Ringkasan kalender">
      {items.map((item) => (
        <article className={styles.summaryCard} key={item.label}>
          <span className={[styles.summaryIcon, styles[item.tone]].join(' ')}>
            <AppIcon name={item.icon} width={24} height={24} />
          </span>
          <span>
            <Typography.Text className={styles.summaryValue}>{item.value}</Typography.Text>
            <Typography.Text className={styles.summaryLabel}>{item.label}</Typography.Text>
          </span>
        </article>
      ))}
    </section>
  );
}
