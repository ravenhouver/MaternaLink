import type { AppIconName } from '@/components/ui/app-icon';
import type { CurrentUser, UserRole } from '@/lib/api';
import { routes } from '@/lib/routes';

type NavItem = {
  key: string;
  href: string;
  icon: AppIconName;
  label: string;
  roles: UserRole[];
};

export const navItems = [
  { key: routes.dashboard, href: routes.dashboard, icon: 'home', label: 'Dashboard', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: routes.queue, href: routes.queue, icon: 'userPlus', label: 'Patient Queue', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: routes.patients, href: routes.patients, icon: 'users', label: 'Patient List', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: routes.forecastCalendar, href: routes.forecastCalendar, icon: 'calendar', label: 'Prediction Calendar', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: routes.medicineNeeds, href: routes.medicineNeeds, icon: 'plus', label: 'Medicine Needs', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: routes.ifk, href: routes.ifk, icon: 'home', label: 'IFK Dashboard', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: routes.ifkRecommendations, href: routes.ifkRecommendations, icon: 'package', label: 'Recommendations', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: routes.ifkClinics, href: routes.ifkClinics, icon: 'users', label: 'Clinics', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: routes.ifkEnvironment, href: routes.ifkEnvironment, icon: 'calendar', label: 'Environment', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: routes.ifkDecisionHistory, href: routes.ifkDecisionHistory, icon: 'settings', label: 'Decision History', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: routes.deliveries, href: routes.deliveries, icon: 'package', label: 'Delivering', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
] satisfies NavItem[];

export function getVisibleNavItems(role: UserRole) {
  return navItems.filter((item) => item.roles.some((allowedRole) => allowedRole === role));
}

export function resolveSelectedKey(pathname: string) {
  if (pathname.startsWith(routes.patients)) return routes.patients;
  if (pathname.startsWith(routes.forecastCalendar)) return routes.forecastCalendar;
  if (pathname.startsWith(routes.medicineNeeds)) return routes.medicineNeeds;
  if (pathname.startsWith(routes.deliveries)) return routes.deliveries;
  if (pathname.startsWith(routes.queue)) return routes.queue;
  if (pathname.startsWith(routes.ifkDecisionHistory)) return routes.ifkDecisionHistory;
  if (pathname.startsWith(routes.ifkEnvironment)) return routes.ifkEnvironment;
  if (pathname.startsWith(routes.ifkClinics)) return routes.ifkClinics;
  if (pathname.startsWith(routes.ifkRecommendations)) return routes.ifkRecommendations;
  if (pathname.startsWith(routes.ifk)) return routes.ifk;
  return routes.dashboard;
}

export function getProfile(user: CurrentUser) {
  return {
    name: user.username,
    role: user.role === 'IFK_ADMIN' ? 'Admin IFK' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.puskesmasId ?? 'Bidan Puskesmas',
    photo: user.role === 'IFK_ADMIN' ? '/figma-medicine/bidan-sarah.png' : '/figma-patients/doctor-siti.png',
  };
}

export function getBrandHref(role: UserRole) {
  return role === 'IFK_ADMIN' ? routes.ifkRecommendations : routes.dashboard;
}
