import Button from 'antd/es/button';
import styles from './icon-button.module.css';

type IconButtonProps = {
  label: string;
  src: string;
  className?: string;
  onClick?: () => void;
};

export function IconButton({ label, src, className = '', onClick }: IconButtonProps) {
  return (
    <Button shape="circle" className={[styles.button, className].filter(Boolean).join(' ')} aria-label={label} onClick={onClick}>
      <img src={src} alt="" />
    </Button>
  );
}
