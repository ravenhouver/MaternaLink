import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../patients.module.css';

export function PaginationBar() {
  return (
    <div className={styles.pagination}>
      <Typography.Text>Menampilkan 1-3 dari 124 pasien</Typography.Text>
      <div className={styles.paginationControls}>
        <Button className={styles.pageButton} aria-label="Sebelumnya">
          <AppIcon name="chevronLeft" width={18} height={18} />
        </Button>
        <Button className={[styles.pageButton, styles.activePage].join(' ')}>1</Button>
        <Button className={styles.pageButton}>2</Button>
        <Button className={styles.pageButton}>3</Button>
        <Button className={styles.pageButton} aria-label="Berikutnya">
          <AppIcon name="chevronRight" width={18} height={18} />
        </Button>
      </div>
    </div>
  );
}
