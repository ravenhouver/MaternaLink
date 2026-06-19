import type { CalendarDay, CalendarEventType } from '../calendar-data';
import type { CalendarViewMode } from './calendar-toolbar';
import styles from '../calendar.module.css';

type MonthlyCalendarProps = {
  days: CalendarDay[];
  weekdays: string[];
  eventLabels: Record<CalendarEventType, string>;
  monthLabel: string;
  onSelectDate: (date: string) => void;
  view: CalendarViewMode;
};

export function MonthlyCalendar({ days, weekdays, eventLabels, monthLabel, onSelectDate, view }: MonthlyCalendarProps) {
  return (
    <div className={[styles.monthlyCard, view === 'week' ? styles.weeklyCard : ''].filter(Boolean).join(' ')}>
      <div className={styles.weekdays}>
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid} data-view={view} aria-label={`${view === 'week' ? 'Minggu' : 'Kalender'} ${monthLabel}`}>
        {days.map((item, index) => (
          <button type="button" className={[styles.cell, item.muted ? styles.muted : '', item.shaded ? styles.shaded : '', item.selected ? styles.selected : ''].filter(Boolean).join(' ')} key={`${item.date}-${index}`} onClick={() => onSelectDate(item.date)} aria-pressed={item.selected}>
            <span>{item.day}</span>
            {item.events?.length ? (
              <div className={styles.dots} aria-label={item.events.map((event) => eventLabels[event]).join(', ')}>
                {item.events.map((event) => (
                  <i className={styles[event]} key={event} />
                ))}
              </div>
            ) : null}
          </button>
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
