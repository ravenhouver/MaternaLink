import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import styles from './breadcrumbs.module.css';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span className={styles.itemWrap} key={`${item.label}-${index}`}>
            {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
            {!isLast ? <AppIcon name="chevronRight" className={styles.separator} width={14} height={14} /> : null}
          </span>
        );
      })}
    </nav>
  );
}
