import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../calendar.module.css';

export function CalendarToolbar({ isRunning, monthLabel, onNextMonth, onPrevMonth, onRunWorkflow }: { isRunning: boolean; monthLabel: string; onNextMonth: () => void; onPrevMonth: () => void; onRunWorkflow: () => void }) {
  const [view, setView] = useState<'month' | 'week'>('month');
  return (
    <section className={styles.toolbar} aria-label="Kontrol kalender">
      <div className={styles.monthControl}>
        <Typography.Title level={2}>{monthLabel}</Typography.Title>
        <div className={styles.arrows}>
          <Button shape="circle" aria-label="Bulan sebelumnya" onClick={onPrevMonth}>
            <AppIcon name="chevronLeft" width={18} height={18} />
          </Button>
          <Button shape="circle" aria-label="Bulan berikutnya" onClick={onNextMonth}>
            <AppIcon name="chevronRight" width={18} height={18} />
          </Button>
        </div>
      </div>

      <div className={styles.viewToggle} role="tablist" aria-label="Mode kalender">
        <button type="button" className={view === 'month' ? styles.activeView : undefined} role="tab" aria-selected={view === 'month'} onClick={() => setView('month')}>
          Bulanan
        </button>
        <button type="button" className={view === 'week' ? styles.activeView : undefined} role="tab" aria-selected={view === 'week'} onClick={() => setView('week')}>
          Mingguan
        </button>
        <button type="button" disabled={isRunning} onClick={onRunWorkflow}>
          {isRunning ? 'Running...' : 'Run Workflow'}
        </button>
      </div>
    </section>
  );
}
