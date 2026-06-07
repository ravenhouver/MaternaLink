import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../calendar.module.css';

export function CalendarToolbar() {
  return (
    <section className={styles.toolbar} aria-label="Kontrol kalender">
      <div className={styles.monthControl}>
        <Typography.Title level={2}>Oktober 2024</Typography.Title>
        <div className={styles.arrows}>
          <Button shape="circle" aria-label="Bulan sebelumnya">
            <AppIcon name="chevronLeft" width={18} height={18} />
          </Button>
          <Button shape="circle" aria-label="Bulan berikutnya">
            <AppIcon name="chevronRight" width={18} height={18} />
          </Button>
        </div>
      </div>

      <div className={styles.viewToggle} role="tablist" aria-label="Mode kalender">
        <button type="button" className={styles.activeView} role="tab" aria-selected="true">
          Bulanan
        </button>
        <button type="button" role="tab" aria-selected="false">
          Mingguan
        </button>
      </div>
    </section>
  );
}
