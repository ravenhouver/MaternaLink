import type { AppIconName } from '@/components/ui/app-icon';
import type { CurrentUser, UserRole } from '@/lib/api';
import { routes } from '@/lib/routes';

type NavItem = {
  key: string;
  href: string;
  icon: AppIconName;
  label: string;
  labelKey: string;
  roles: UserRole[];
};

export const navItems = [
  { key: routes.admin, href: routes.admin, icon: 'grid', label: 'Dashboard', labelKey: 'dashboard', roles: ['SUPER_ADMIN'] },
  { key: routes.adminHealthCenters, href: routes.adminHealthCenters, icon: 'briefcase', label: 'Health Centers', labelKey: 'healthCenters', roles: ['SUPER_ADMIN'] },
  { key: routes.adminUsers, href: routes.adminUsers, icon: 'users', label: 'User Accounts', labelKey: 'users', roles: ['SUPER_ADMIN'] },
  { key: routes.adminMedicines, href: routes.adminMedicines, icon: 'clipboard', label: 'Medicine List', labelKey: 'medicines', roles: ['SUPER_ADMIN'] },
  { key: routes.adminFacilityProfiles, href: routes.adminFacilityProfiles, icon: 'archive', label: 'Facility Profiles', labelKey: 'facilityProfiles', roles: ['SUPER_ADMIN'] },
  { key: routes.dashboard, href: routes.dashboard, icon: 'home', label: 'Dashboard', labelKey: 'dashboard', roles: ['BIDAN_PUSKESMAS'] },
  { key: routes.queue, href: routes.queue, icon: 'userPlus', label: 'Patient Queue', labelKey: 'patientQueue', roles: ['BIDAN_PUSKESMAS'] },
  { key: routes.patients, href: routes.patients, icon: 'users', label: 'Patient List', labelKey: 'patients', roles: ['BIDAN_PUSKESMAS'] },
  { key: routes.forecastCalendar, href: routes.forecastCalendar, icon: 'calendar', label: 'Prediction Calendar', labelKey: 'forecastCalendar', roles: ['BIDAN_PUSKESMAS'] },
  { key: routes.medicineNeeds, href: routes.medicineNeeds, icon: 'plus', label: 'Medicine Needs', labelKey: 'medicineNeeds', roles: ['BIDAN_PUSKESMAS'] },
  { key: routes.ifk, href: routes.ifk, icon: 'home', label: 'IFK Dashboard', labelKey: 'ifkDashboard', roles: ['IFK_ADMIN'] },
  { key: routes.ifkRecommendations, href: routes.ifkRecommendations, icon: 'package', label: 'Recommendations', labelKey: 'recommendations', roles: ['IFK_ADMIN'] },
  { key: routes.ifkClinics, href: routes.ifkClinics, icon: 'users', label: 'Clinics', labelKey: 'clinics', roles: ['IFK_ADMIN'] },
  { key: routes.ifkEnvironment, href: routes.ifkEnvironment, icon: 'calendar', label: 'Environment', labelKey: 'environment', roles: ['IFK_ADMIN'] },
  { key: routes.deliveries, href: routes.deliveries, icon: 'package', label: 'Delivering', labelKey: 'deliveries', roles: ['BIDAN_PUSKESMAS'] },
] satisfies NavItem[];

export function getVisibleNavItems(role: UserRole) {
  return navItems.filter((item) => item.roles.some((allowedRole) => allowedRole === role));
}

export function isRouteAllowedForRole(pathname: string, role: UserRole) {
  if (pathname === routes.login) return true;
  if (pathname === '/') return role === 'BIDAN_PUSKESMAS';

  const matchedItem = [...navItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return matchedItem ? (matchedItem.roles as UserRole[]).includes(role) : true;
}

export function resolveSelectedKey(pathname: string) {
  if (pathname.startsWith(routes.patients)) return routes.patients;
  if (pathname.startsWith(routes.forecastCalendar)) return routes.forecastCalendar;
  if (pathname.startsWith(routes.medicineNeeds)) return routes.medicineNeeds;
  if (pathname.startsWith(routes.deliveries)) return routes.deliveries;
  if (pathname.startsWith(routes.queue)) return routes.queue;
  if (pathname.startsWith(routes.ifkEnvironment)) return routes.ifkEnvironment;
  if (pathname.startsWith(routes.ifkClinics)) return routes.ifkClinics;
  if (pathname.startsWith(routes.ifkRecommendations)) return routes.ifkRecommendations;
  if (pathname.startsWith(routes.ifk)) return routes.ifk;
  if (pathname.startsWith(routes.adminHealthCenters)) return routes.adminHealthCenters;
  if (pathname.startsWith(routes.adminUsers)) return routes.adminUsers;
  if (pathname.startsWith(routes.adminMedicines)) return routes.adminMedicines;
  if (pathname.startsWith(routes.adminFacilityProfiles)) return routes.adminFacilityProfiles;
  if (pathname.startsWith(routes.admin)) return routes.admin;
  return routes.dashboard;
}

export function getProfile(user: CurrentUser) {
  const name = user.displayName?.trim() || user.username;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || user.username.slice(0, 2).toUpperCase();
  return {
    name,
    role: user.role === 'SUPER_ADMIN' ? 'Superadmin' : user.role === 'IFK_ADMIN' ? 'Admin IFK' : user.puskesmasId ?? 'Bidan Puskesmas',
    initials,
  };
}

export function getBrandHref(role: UserRole) {
  if (role === 'SUPER_ADMIN') return routes.admin;
  return role === 'IFK_ADMIN' ? routes.ifk : routes.dashboard;
}
