import Typography from 'antd/es/typography';
import type { summaryItems } from '../calendar-data';
import styles from '../calendar.module.css';

type CalendarSummaryProps = {
  items: typeof summaryItems;
};

const asset = (name: string) => `/figma-calendar/${name}`;

export function CalendarSummary({ items }: CalendarSummaryProps) {
  return (
    <section className={styles.summary} aria-label="Ringkasan kalender">
      {items.map((item) => (
        <article className={styles.summaryCard} key={item.label}>
          <span className={[styles.summaryIcon, styles[item.tone]].join(' ')}>
            <img src={asset(item.icon)} alt="" />
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
