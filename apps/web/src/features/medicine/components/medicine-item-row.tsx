import Typography from 'antd/es/typography';
import { StatusPill } from '@/components/ui/status-pill';
import type { MedicineItem } from '../medicine-data';
import styles from '../medicine.module.css';

type MedicineItemRowProps = {
  item: MedicineItem;
};

const toneByStatus = {
  safe: 'green',
  warning: 'amber',
  danger: 'red',
} as const;

export function MedicineItemRow({ item }: MedicineItemRowProps) {
  return (
    <div className={[styles.item, styles[item.status]].join(' ')}>
      <span className={styles.copy}>
        <Typography.Title level={3}>{item.name}</Typography.Title>
        <Typography.Text>{item.need}</Typography.Text>
      </span>
      <StatusPill tone={toneByStatus[item.status]}>{item.label}</StatusPill>
    </div>
  );
}
