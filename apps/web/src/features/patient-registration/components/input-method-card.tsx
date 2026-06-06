import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import type { InputMethod } from '../registration-data';
import styles from '../patient-registration.module.css';

type InputMethodCardProps = {
  method: InputMethod;
  onSelectManual: () => void;
};

const asset = (name: string) => `/figma-add-patient/${name}`;

export function InputMethodCard({ method, onSelectManual }: InputMethodCardProps) {
  return (
    <article className={[styles.methodCard, method.featured ? styles.featuredMethod : ''].filter(Boolean).join(' ')}>
      {method.featured ? <span className={styles.methodOrb} /> : method.visual ? <img src={asset(method.visual)} alt="" className={styles.methodVisual} /> : null}
      <div className={styles.methodIcon}>
        <img src={asset(method.icon)} alt="" />
      </div>
      <div className={styles.methodCopy}>
        <div className={styles.methodTitleRow}>
          <h3>{method.title}</h3>
          {method.featured ? <span className={styles.popularPill}>POPULER</span> : null}
        </div>
        <Typography.Text className={styles.methodSubtitle}>{method.subtitle}</Typography.Text>
        <Typography.Paragraph>{method.description}</Typography.Paragraph>
      </div>
      <Button className={styles.methodButton} onClick={method.key === 'manual' ? onSelectManual : undefined}>
        {method.button}
        <img src={asset(method.buttonIcon)} alt="" />
      </Button>
    </article>
  );
}
