import Input from 'antd/es/input';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../patients.module.css';

type PatientsFiltersProps = {
  filters: string[];
};

export function PatientsFilters({ filters }: PatientsFiltersProps) {
  return (
    <section className={styles.filters} aria-label="Cari dan filter pasien">
      <div className={styles.searchWrap}>
        <Input className={styles.search} prefix={<AppIcon name="search" width={20} height={20} />} placeholder="Cari nama pasien..." />
      </div>
      <div className={styles.filterTabs} role="tablist" aria-label="Filter pasien">
        {filters.map((item) => (
          <button type="button" role="tab" aria-selected={item === 'Semua'} className={item === 'Semua' ? styles.activeFilter : ''} key={item}>
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
