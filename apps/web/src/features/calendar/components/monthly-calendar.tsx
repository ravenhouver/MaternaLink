import type { CalendarDay, CalendarEventType } from '../calendar-data';
import styles from '../calendar.module.css';

type MonthlyCalendarProps = {
  days: CalendarDay[];
  weekdays: string[];
  eventLabels: Record<CalendarEventType, string>;
};

export function MonthlyCalendar({ days, weekdays, eventLabels }: MonthlyCalendarProps) {
  return (
    <div className={styles.monthlyCard}>
      <div className={styles.weekdays}>
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid} aria-label="Kalender Oktober 2024">
        {days.map((item, index) => (
          <div className={[styles.cell, item.muted ? styles.muted : '', item.shaded ? styles.shaded : '', item.selected ? styles.selected : ''].filter(Boolean).join(' ')} key={`${item.day}-${index}`}>
            <span>{item.day}</span>
            {item.events ? (
              <div className={styles.dots} aria-label={item.events.map((event) => eventLabels[event]).join(', ')}>
                {item.events.map((event) => (
                  <i className={styles[event]} key={event} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        {Object.entries(eventLabels).map(([key, label]) => (
          <span key={key}>
            <i className={styles[key as CalendarEventType]} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
