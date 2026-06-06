import Typography from 'antd/es/typography';
import type { MedicineSection } from '../medicine-data';
import { MedicineItemRow } from './medicine-item-row';
import styles from '../medicine.module.css';

type MedicineSectionCardProps = {
  section: MedicineSection;
};

const asset = (name: string) => `/figma-medicine/${name}`;

export function MedicineSectionCard({ section }: MedicineSectionCardProps) {
  return (
    <article className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <img src={asset(section.icon)} alt="" />
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
