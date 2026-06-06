import Link from 'next/link';
import styles from './breadcrumbs.module.css';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  separatorSrc?: string;
};

export function Breadcrumbs({ items, separatorSrc }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span className={styles.itemWrap} key={`${item.label}-${index}`}>
            {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
            {!isLast && separatorSrc ? <img src={separatorSrc} alt="" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
