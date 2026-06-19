import type { AbstractIntlMessages } from 'next-intl';
import { defaultLocale, type AppLocale } from './config';

const en = {
  common: {
    home: 'Home', settings: 'Settings', help: 'Help', logout: 'Logout', language: 'Language', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', detail: 'Detail', active: 'Active', inactive: 'Inactive', actions: 'Actions', status: 'Status', name: 'Name', role: 'Role', facility: 'Facility', email: 'Email', username: 'Username', password: 'Password', search: 'Search', syncingAi: 'Syncing AI Data', syncAi: 'Sync AI Master'
  },
  nav: {
    dashboard: 'Dashboard', healthCenters: 'Health Centers', users: 'User Accounts', medicines: 'Medicine List', facilityProfiles: 'Facility Profiles', patientQueue: 'Patient Queue', patients: 'Patient List', forecastCalendar: 'Prediction Calendar', medicineNeeds: 'Medicine Needs', ifkDashboard: 'IFK Dashboard', recommendations: 'Recommendations', clinics: 'Clinics', environment: 'Environment', decisionHistory: 'Decision History', deliveries: 'Delivering'
  },
  admin: {
    superAdmin: 'SUPER ADMIN', settingsTitle: 'Admin Settings', helpTitle: 'Admin Help', settingsSession: 'Active login cookie', helpBody: 'All admin data is saved directly to the backend. Use add, edit, delete, sync, filter, and export actions in each module.', dashboardTitle: 'Admin Dashboard', dashboardSubtitle: 'MaternaLink master data summary from the active database', lastUpdated: 'Last updated', totalHealthCenters: 'Total Health Centers', totalUsers: 'Total Users', totalMedicines: 'Total Medicines', inactiveAccounts: 'Inactive Accounts', last30Days: '+{count} / 30 days', needsReview: 'Needs review', safe: 'Safe', recentActivity: 'Recent Activity', allActivity: 'All Activity', loadMoreActivities: 'Load 10 More Activities', noAuditLogs: 'No admin audit logs yet.', accountHealth: 'Account Health', accountHealthBody: '{inactive} inactive accounts from {total} database users.', reviewUsers: 'Review users', healthCentersTitle: 'Health Center Registry', healthCentersSubtitle: 'Manage healthcare facility data within the system', searchHealthCenter: 'Search health center name...', addHealthCenter: 'Add Health Center', usersTitle: 'User Accounts', usersSubtitle: 'Manage healthcare personnel and IFK officer accounts', addUser: 'Add User', editUser: 'Edit User', medicinesTitle: 'Maternal Medicine Registry', medicinesSubtitle: 'Catalog of {count} maternal medicines used in the system', addMedicine: 'Add Medicine', facilityProfilesTitle: 'Facility Profiles', facilityProfilesSubtitle: 'Logistics and accessibility configuration for each health center', profilesIncomplete: '{count} profiles incomplete'
  }
} satisfies AbstractIntlMessages;

const id = {
  common: { ...en.common, home: 'Beranda', settings: 'Pengaturan', help: 'Bantuan', logout: 'Keluar', language: 'Bahasa', save: 'Simpan', cancel: 'Batal', edit: 'Ubah', delete: 'Hapus', detail: 'Detail', active: 'Aktif', inactive: 'Nonaktif', actions: 'Aksi', status: 'Status', name: 'Nama', role: 'Peran', facility: 'Fasilitas', search: 'Cari', syncingAi: 'Sinkron AI', syncAi: 'Sinkron Master AI' },
  nav: { ...en.nav, dashboard: 'Dasbor', healthCenters: 'Puskesmas', users: 'Akun Pengguna', medicines: 'Daftar Obat', facilityProfiles: 'Profil Fasilitas', patientQueue: 'Antrian Pasien', patients: 'Daftar Pasien', forecastCalendar: 'Kalender Prediksi', medicineNeeds: 'Kebutuhan Obat', ifkDashboard: 'Dasbor IFK', recommendations: 'Rekomendasi', clinics: 'Klinik', environment: 'Lingkungan', decisionHistory: 'Riwayat Keputusan', deliveries: 'Pengiriman' },
  admin: { ...en.admin, settingsTitle: 'Pengaturan Admin', helpTitle: 'Bantuan Admin', settingsSession: 'Cookie login aktif', helpBody: 'Semua data admin tersimpan langsung ke backend. Gunakan tambah, ubah, hapus, sinkronisasi, filter, dan ekspor pada tiap modul.', dashboardTitle: 'Dasbor Admin', dashboardSubtitle: 'Ringkasan master data MaternaLink dari database aktif', lastUpdated: 'Terakhir diperbarui', totalHealthCenters: 'Total Puskesmas', totalUsers: 'Total Pengguna', totalMedicines: 'Total Obat', inactiveAccounts: 'Akun Nonaktif', last30Days: '+{count} / 30 hari', needsReview: 'Perlu review', safe: 'Aman', recentActivity: 'Aktivitas Terbaru', allActivity: 'Semua Aktivitas', loadMoreActivities: 'Muat 10 Aktivitas', noAuditLogs: 'Belum ada audit log admin.', accountHealth: 'Kesehatan Akun', accountHealthBody: '{inactive} akun nonaktif dari {total} pengguna database.', reviewUsers: 'Review user', healthCentersTitle: 'Registri Puskesmas', healthCentersSubtitle: 'Kelola data fasilitas kesehatan dalam sistem', searchHealthCenter: 'Cari nama puskesmas...', addHealthCenter: 'Tambah Puskesmas', usersTitle: 'Akun Pengguna', usersSubtitle: 'Kelola akun tenaga kesehatan dan petugas IFK', addUser: 'Tambah User', editUser: 'Ubah User', medicinesTitle: 'Registri Obat Maternal', medicinesSubtitle: 'Katalog {count} obat maternal yang digunakan sistem', addMedicine: 'Tambah Obat', facilityProfilesTitle: 'Profil Fasilitas', facilityProfilesSubtitle: 'Konfigurasi logistik dan aksesibilitas tiap puskesmas', profilesIncomplete: '{count} profil belum lengkap' }
} satisfies AbstractIntlMessages;

const ms = {
  common: { ...id.common, logout: 'Log keluar', save: 'Simpan', cancel: 'Batal', delete: 'Padam', active: 'Aktif', inactive: 'Tidak aktif' },
  nav: { ...id.nav, dashboard: 'Papan Pemuka', users: 'Akaun Pengguna', medicines: 'Senarai Ubat', facilityProfiles: 'Profil Fasiliti' },
  admin: { ...id.admin, dashboardTitle: 'Papan Pemuka Admin', dashboardSubtitle: 'Ringkasan data induk MaternaLink daripada pangkalan data aktif', addUser: 'Tambah Pengguna', addMedicine: 'Tambah Ubat' }
} satisfies AbstractIntlMessages;

const dictionaries: Partial<Record<AppLocale, AbstractIntlMessages>> = {
  en,
  id,
  ms,
  fil: en,
  th: en,
  vi: en,
  km: en,
  lo: en,
  my: en,
  zh: en,
  ta: en,
};

export function getMessages(locale: AppLocale): AbstractIntlMessages {
  return dictionaries[locale] ?? dictionaries[defaultLocale] ?? en;
}
