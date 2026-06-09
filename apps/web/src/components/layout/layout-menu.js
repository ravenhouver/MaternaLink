export const appRoutes = {
  login: '/login',
  dashboard: '/dashboard',
  patients: '/patients',
  forecastCalendar: '/forecast-calendar',
  medicineNeeds: '/medicine-needs',
  deliveries: '/deliveries',
  queue: '/queue',
  ifk: '/ifk',
  ifkRecommendations: '/ifk/recommendations',
  ifkClinics: '/ifk/clinics',
  ifkEnvironment: '/ifk/environment',
  ifkDecisionHistory: '/ifk/decision-history',
};

export const navItems = [
  { key: appRoutes.dashboard, href: appRoutes.dashboard, icon: 'home', label: 'Dashboard', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: appRoutes.queue, href: appRoutes.queue, icon: 'userPlus', label: 'Patient Queue', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: appRoutes.patients, href: appRoutes.patients, icon: 'users', label: 'Patient List', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: appRoutes.forecastCalendar, href: appRoutes.forecastCalendar, icon: 'calendar', label: 'Prediction Calendar', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: appRoutes.medicineNeeds, href: appRoutes.medicineNeeds, icon: 'plus', label: 'Medicine Needs', roles: ['BIDAN_PUSKESMAS', 'SUPER_ADMIN'] },
  { key: appRoutes.ifk, href: appRoutes.ifk, icon: 'home', label: 'IFK Dashboard', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: appRoutes.ifkRecommendations, href: appRoutes.ifkRecommendations, icon: 'package', label: 'Recommendations', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: appRoutes.ifkClinics, href: appRoutes.ifkClinics, icon: 'users', label: 'Clinics', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: appRoutes.ifkEnvironment, href: appRoutes.ifkEnvironment, icon: 'calendar', label: 'Environment', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: appRoutes.ifkDecisionHistory, href: appRoutes.ifkDecisionHistory, icon: 'settings', label: 'Decision History', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
  { key: appRoutes.deliveries, href: appRoutes.deliveries, icon: 'package', label: 'Delivering', roles: ['IFK_ADMIN', 'SUPER_ADMIN'] },
];

export function hasRole(roles, role) {
  return roles.some((allowedRole) => allowedRole === role);
}

export function getVisibleNavItems(role) {
  return navItems.filter((item) => hasRole(item.roles, role));
}

export function resolveSelectedKey(pathname) {
  if (pathname.startsWith(appRoutes.patients)) return appRoutes.patients;
  if (pathname.startsWith(appRoutes.forecastCalendar)) return appRoutes.forecastCalendar;
  if (pathname.startsWith(appRoutes.medicineNeeds)) return appRoutes.medicineNeeds;
  if (pathname.startsWith(appRoutes.deliveries)) return appRoutes.deliveries;
  if (pathname.startsWith(appRoutes.queue)) return appRoutes.queue;
  if (pathname.startsWith(appRoutes.ifkDecisionHistory)) return appRoutes.ifkDecisionHistory;
  if (pathname.startsWith(appRoutes.ifkEnvironment)) return appRoutes.ifkEnvironment;
  if (pathname.startsWith(appRoutes.ifkClinics)) return appRoutes.ifkClinics;
  if (pathname.startsWith(appRoutes.ifkRecommendations)) return appRoutes.ifkRecommendations;
  if (pathname.startsWith(appRoutes.ifk)) return appRoutes.ifk;
  return appRoutes.dashboard;
}

export function getProfile(user) {
  return {
    name: user.username,
    role: user.role === 'IFK_ADMIN' ? 'Admin IFK' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.puskesmasId ?? 'Bidan Puskesmas',
    photo: user.role === 'IFK_ADMIN' ? '/figma-medicine/bidan-sarah.png' : '/figma-patients/doctor-siti.png',
  };
}

export function getBrandHref(role) {
  return role === 'IFK_ADMIN' ? appRoutes.ifkRecommendations : appRoutes.dashboard;
}
