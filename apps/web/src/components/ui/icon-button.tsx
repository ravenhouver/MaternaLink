import Button from 'antd/es/button';
import { AppIcon, type AppIconName } from './app-icon';
import styles from './icon-button.module.css';

type IconButtonProps = {
  label: string;
  icon: AppIconName;
  className?: string;
  onClick?: () => void;
};

export function IconButton({ label, icon, className = '', onClick }: IconButtonProps) {
  return (
    <Button shape="circle" className={[styles.button, className].filter(Boolean).join(' ')} aria-label={label} onClick={onClick}>
      <AppIcon name={icon} width={20} height={20} />
    </Button>
  );
}
