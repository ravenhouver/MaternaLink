import Typography from 'antd/es/typography';
import styles from './topbar.module.css';

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <Typography.Text className={styles.brand}>MaternaLink</Typography.Text>
      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} aria-label="Notifikasi">
          <img src="/figma-patients/top-bell.svg" alt="" />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Akun">
          <img src="/figma-patients/top-user.svg" alt="" />
        </button>
      </div>
    </header>
  );
}
