import { addCollection, Icon, type IconProps } from '@iconify/react';
import { icons as lucideIcons } from '@iconify-json/lucide';

addCollection(lucideIcons);

const iconNames = {
  activity: 'lucide:activity',
  alert: 'lucide:triangle-alert',
  archive: 'lucide:archive',
  arrowLeft: 'lucide:arrow-left',
  arrowRight: 'lucide:arrow-right',
  bell: 'lucide:bell',
  briefcase: 'lucide:briefcase',
  calendar: 'lucide:calendar',
  camera: 'lucide:camera',
  chevronDown: 'lucide:chevron-down',
  chevronLeft: 'lucide:chevron-left',
  chevronRight: 'lucide:chevron-right',
  checkCircle: 'lucide:circle-check',
  clipboard: 'lucide:clipboard-list',
  clock: 'lucide:clock',
  cloudRain: 'lucide:cloud-rain',
  edit: 'lucide:square-pen',
  eye: 'lucide:eye',
  fileText: 'lucide:file-text',
  filter: 'lucide:funnel',
  grid: 'lucide:grid-2x2',
  heart: 'lucide:heart-pulse',
  home: 'lucide:house',
  hourglass: 'lucide:hourglass',
  info: 'lucide:info',
  lock: 'lucide:lock',
  mail: 'lucide:mail',
  logOut: 'lucide:log-out',
  mic: 'lucide:mic',
  package: 'lucide:package',
  plus: 'lucide:plus',
  search: 'lucide:search',
  send: 'lucide:send',
  settings: 'lucide:settings',
  shield: 'lucide:shield',
  stethoscope: 'lucide:stethoscope',
  sun: 'lucide:sun',
  truck: 'lucide:truck',
  upload: 'lucide:upload',
  user: 'lucide:user',
  userPlus: 'lucide:user-plus',
  users: 'lucide:users',
  x: 'lucide:x',
  zap: 'lucide:zap',
} as const;

export type AppIconName = keyof typeof iconNames;

type AppIconProps = Omit<IconProps, 'icon'> & {
  name: AppIconName;
};

export function AppIcon({ name, 'aria-hidden': ariaHidden = true, ...props }: AppIconProps) {
  return <Icon aria-hidden={ariaHidden} icon={iconNames[name]} {...props} />;
}


