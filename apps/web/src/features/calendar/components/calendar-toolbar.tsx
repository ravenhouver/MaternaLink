import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import styles from '../calendar.module.css';

const asset = (name: string) => `/figma-calendar/${name}`;

export function CalendarToolbar() {
  return (
    <section className={styles.toolbar} aria-label="Kontrol kalender">
      <div className={styles.monthControl}>
        <Typography.Title level={2}>Oktober 2024</Typography.Title>
        <div className={styles.arrows}>
          <Button shape="circle" aria-label="Bulan sebelumnya">
            <img src={asset('prev.svg')} alt="" />
          </Button>
          <Button shape="circle" aria-label="Bulan berikutnya">
            <img src={asset('next.svg')} alt="" />
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
