import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import styles from '../patients.module.css';

export function PaginationBar() {
  return (
    <div className={styles.pagination}>
      <Typography.Text>Menampilkan 1-3 dari 124 pasien</Typography.Text>
      <div className={styles.paginationControls}>
        <Button className={styles.pageButton} aria-label="Sebelumnya">
          <img src="/figma-patients/page-prev.svg" alt="" />
        </Button>
        <Button className={[styles.pageButton, styles.activePage].join(' ')}>1</Button>
        <Button className={styles.pageButton}>2</Button>
        <Button className={styles.pageButton}>3</Button>
        <Button className={styles.pageButton} aria-label="Berikutnya">
          <img src="/figma-patients/page-next.svg" alt="" />
        </Button>
      </div>
    </div>
  );
}
