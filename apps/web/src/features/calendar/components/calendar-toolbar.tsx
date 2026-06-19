import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../calendar.module.css';

export type CalendarViewMode = 'month' | 'week';

type CalendarToolbarProps = {
  isRunning: boolean;
  monthLabel: string;
  view: CalendarViewMode;
  onNext: () => void;
  onPrev: () => void;
  onRunWorkflow: () => void;
  onViewChange: (view: CalendarViewMode) => void;
};

export function CalendarToolbar({ isRunning, monthLabel, onNext, onPrev, onRunWorkflow, onViewChange, view }: CalendarToolbarProps) {
  return (
    <section className={styles.toolbar} aria-label="Kontrol kalender">
      <div className={styles.monthControl}>
        <Typography.Title level={2}>{monthLabel}</Typography.Title>
        <div className={styles.arrows}>
          <Button shape="circle" aria-label={view === 'week' ? 'Minggu sebelumnya' : 'Bulan sebelumnya'} onClick={onPrev}>
            <AppIcon name="chevronLeft" width={18} height={18} />
          </Button>
          <Button shape="circle" aria-label={view === 'week' ? 'Minggu berikutnya' : 'Bulan berikutnya'} onClick={onNext}>
            <AppIcon name="chevronRight" width={18} height={18} />
          </Button>
        </div>
      </div>

      <div className={styles.viewToggle} role="tablist" aria-label="Mode kalender">
        <button type="button" className={view === 'month' ? styles.activeView : undefined} role="tab" aria-selected={view === 'month'} onClick={() => onViewChange('month')}>
          Bulanan
        </button>
        <button type="button" className={view === 'week' ? styles.activeView : undefined} role="tab" aria-selected={view === 'week'} onClick={() => onViewChange('week')}>
          Mingguan
        </button>
        <button type="button" disabled={isRunning} onClick={onRunWorkflow}>
          {isRunning ? 'Running...' : 'Run Workflow'}
        </button>
      </div>
    </section>
  );
}
