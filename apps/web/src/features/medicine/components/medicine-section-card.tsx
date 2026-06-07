import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import type { MedicineSection } from '../medicine-data';
import { MedicineItemRow } from './medicine-item-row';
import styles from '../medicine.module.css';

type MedicineSectionCardProps = {
  section: MedicineSection;
};

export function MedicineSectionCard({ section }: MedicineSectionCardProps) {
  return (
    <article className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <AppIcon name={section.icon} width={24} height={24} />
          </span>
          <Typography.Title level={2}>
            <span aria-hidden="true">{section.emoji}</span> {section.title}
          </Typography.Title>
        </div>

        <div className={styles.items}>
          {section.items.map((item) => (
            <MedicineItemRow item={item} key={item.name} />
          ))}
        </div>
      </div>
    </article>
  );
}
