'use client';

import { useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';

const idText: Record<string, string> = {
  Home: 'Beranda', Dashboard: 'Dasbor', Distribution: 'Distribusi', 'Clinic List': 'Daftar Klinik', 'Environment Monitoring': 'Pemantauan Lingkungan', 'District Monitoring': 'Pemantauan Distrik', 'Medicine Sender': 'Pengiriman Obat', 'Review queue': 'Review antrean', Map: 'Peta', Satellite: 'Satelit', 'WEATHER OVERLAY': 'WEATHER OVERLAY', 'Weather hidden': 'Cuaca disembunyikan', 'Live unavailable': 'Live tidak tersedia', 'Facility route map': 'Peta rute fasilitas', 'Urgent actions required': 'Aksi mendesak diperlukan', 'No urgent actions': 'Tidak ada aksi mendesak', Supply: 'Pasokan', 'All clear': 'Semua aman', 'Weather risk': 'Risiko cuaca', 'Supply shortage': 'Kekurangan pasokan', 'Recent Approval Activity': 'Aktivitas Approval Terbaru', Timestamp: 'Waktu', Entity: 'Entitas', 'Action type': 'Tipe aksi', Operator: 'Operator', Status: 'Status', 'All Clinics': 'Semua Klinik', 'Export CSV': 'Ekspor CSV', 'Add Clinic': 'Tambah Klinik', 'Clinic Name': 'Nama Klinik', Location: 'Lokasi', 'Logistics Update': 'Update Logistik', 'Critical Stock': 'Stok Kritis', 'Maternal Health (Active)': 'Kesehatan Ibu (Aktif)', 'Risk Level': 'Tingkat Risiko', 'Weather Conditions': 'Kondisi Cuaca', Action: 'Aksi', Filter: 'Filter', Registry: 'Registri', Infrastructure: 'Infrastruktur', 'Clinic Profile': 'Profil Klinik', 'Medication & Supplies': 'Obat & Persediaan', 'Medication Name': 'Nama Obat', Stock: 'Stok', Needs: 'Kebutuhan', 'Days Remaining': 'Sisa Hari', 'AI Recommendation Analysis': 'Analisis Rekomendasi AI', 'Optimized Logistics Route': 'Rute Logistik Optimal', 'Storage capacity:': 'Kapasitas penyimpanan:', 'Shipping History': 'Riwayat Pengiriman', 'Nearby Clinics (Alt. Sourcing)': 'Klinik Terdekat (Sumber Alternatif)', 'Operational Ledger': 'Ledger Operasional', 'Chronological Intelligence Log': 'Log Intelijen Kronologis', Sort: 'Urutkan', Tanggal: 'Tanggal', Petugas: 'Petugas', Klinik: 'Klinik', Tindakan: 'Tindakan', 'AI Prediction Stocks': 'Prediksi Stok AI', 'Actual Decision': 'Keputusan Aktual', 'Audit Trail Analysis': 'Analisis Jejak Audit', Matched: 'Sesuai', Deviated: 'Menyimpang', 'Compliance Rating': 'Rating Kepatuhan', 'Primary Deviation Factor': 'Faktor Penyimpangan Utama', 'Medicine Delivery Report': 'Laporan Pengiriman Obat', 'Delivery Report': 'Laporan Pengiriman', 'Loading shipping map...': 'Memuat peta pengiriman...', 'Patient detail tabs': 'Tab detail pasien', 'Medical Record': 'Rekam Medis', 'Personal Info': 'Info Pribadi', 'Active Pregnancy': 'Kehamilan Aktif', 'Gestational Age': 'Usia Kehamilan', 'Due Date': 'HPL', 'Last ANC Visit': 'Kunjungan ANC Terakhir', Queue: 'Antrekan', 'Queueing...': 'Memasukkan antrean...', 'Edit Patient': 'Ubah Pasien', 'Pregnancy Status': 'Status Kehamilan', 'Gest. Age': 'Usia Kehamilan', 'Preg. Type': 'Tipe Kehamilan', 'Active Risk Factors': 'Faktor Risiko Aktif', 'No active risk factor': 'Tidak ada faktor risiko aktif', 'Routine Medication': 'Obat Rutin', 'Medical Background': 'Riwayat Medis', 'Blood Type': 'Golongan Darah', Allergy: 'Alergi', 'Chronic Conditions': 'Kondisi Kronis', 'Examination History': 'Riwayat Pemeriksaan', 'New Examination': 'Pemeriksaan Baru', 'No examination record yet.': 'Belum ada catatan pemeriksaan.', 'Chief Complaint': 'Keluhan Utama', 'No complaint recorded.': 'Tidak ada keluhan tercatat.', 'Vital Signs': 'Tanda Vital', 'Blood Pressure': 'Tekanan Darah', Temperature: 'Suhu', 'Heart Rate': 'Denyut Jantung', Respiratory: 'Respirasi', Recorded: 'Tercatat', Normal: 'Normal', Visit: 'Kunjungan', 'Additional Symptoms': 'Gejala Tambahan', 'Diagnosis & Findings': 'Diagnosis & Temuan', 'Medication Issued': 'Obat Diberikan', 'No medication recorded.': 'Tidak ada obat tercatat.', 'Print Prescription': 'Cetak Resep', 'Routine ANC Checkup': 'Pemeriksaan ANC Rutin', 'Main Identity': 'Identitas Utama', 'Full Name': 'Nama Lengkap', 'Date of Birth': 'Tanggal Lahir', 'Phone Number': 'Nomor Telepon', Address: 'Alamat', 'Insurance & Administration': 'Asuransi & Administrasi', 'BPJS Number': 'Nomor BPJS', 'Patient ID': 'ID Pasien', 'Registration Date': 'Tanggal Registrasi', Puskesmas: 'Puskesmas', 'Responsible Doctor': 'Dokter Penanggung Jawab', 'Next of Kin': 'Kontak Darurat', Relationship: 'Hubungan', Phone: 'Telepon', 'Pregnancy History': 'Riwayat Kehamilan', 'High Risk Classification': 'Klasifikasi Risiko Tinggi', 'No high risk factor': 'Tidak ada faktor risiko tinggi', 'Acara Hari Ini': 'Acara Hari Ini', 'Belum ada acara': 'Belum ada acara', 'Data kalender akan muncul dari jadwal pasien aktif.': 'Data kalender akan muncul dari jadwal pasien aktif.', UTAMA: 'UTAMA', 'BUTUH PERSIAPAN:': 'BUTUH PERSIAPAN:', 'Siapkan Tindakan': 'Siapkan Tindakan', 'Jadwal aktif': 'Jadwal aktif', 'CATATAN BIDAN': 'CATATAN BIDAN', 'Interior klinik': 'Interior klinik',
  'Medicine Shipping': 'Pengiriman Obat',
  'Monitor the status of medicine requests and shipments to your health center': 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda',
  'Shipment filters': 'Filter pengiriman',
  'Medicine shipments': 'Pengiriman obat',
  'Belum ada data pengiriman.': 'Belum ada data pengiriman.',
  'Shipping analytics': 'Analitik pengiriman',
  'Active Shipping Locations': 'Lokasi Pengiriman Aktif',
  'Shipment Completion Rate': 'Tingkat Penyelesaian Pengiriman',
  'Average Duration': 'Durasi Rata-rata',
  'Total Items': 'Total Item',
  Units: 'Unit',
  Reason: 'Alasan',
  'Re-request': 'Ajukan ulang',
  'Shipping progress': 'Progres pengiriman',
  'Shipping Information': 'Informasi Pengiriman',
  Courier: 'Kurir',
  Origin: 'Asal',
  Destination: 'Tujuan',
  Distance: 'Jarak',
  ETA: 'ETA',
  'Shipping Contents': 'Isi Pengiriman',
  'Tracking History': 'Riwayat Pelacakan',
  'Active shipping locations map': 'Peta lokasi pengiriman aktif',
  'Loading patient detail...': 'Memuat detail pasien...',
  'Patient not found': 'Pasien tidak ditemukan',
  'Previous Pregnancy: data follows active pregnancy record and historical entries.': 'Kehamilan sebelumnya: data mengikuti catatan kehamilan aktif dan riwayat.',
  'ANC Progress': 'Progres ANC',
  'None recorded': 'Belum ada catatan',
};

const attrs = ['aria-label', 'alt', 'placeholder', 'title'];

const enText: Record<string, string> = Object.fromEntries(Object.entries(idText).map(([key, value]) => [value, key]));

Object.assign(idText, {
  Breadcrumb: 'Breadcrumb',
  '- ID:': '- ID:',
  'Reason:': 'Alasan:',
  'Open-Meteo live': 'Open-Meteo live',
  Low: 'Rendah',
  Med: 'Sedang',
  High: 'Tinggi',
  'Data Open-Meteo belum tersedia untuk koordinat fasilitas; heatmap tidak memakai fallback database.': 'Data Open-Meteo belum tersedia untuk koordinat fasilitas; heatmap tidak memakai fallback database.',
  'Isi otomatis login berdasarkan role': 'Isi otomatis login berdasarkan role',
  bidan: 'bidan',
  'Tactical view jalur pasokan': 'Tampilan taktis jalur pasokan',
  'IFK Operations': 'Operasi IFK',
  'Audit Ledger': 'Ledger Audit',
  'Print PDF': 'Cetak PDF',
  'Belum ada riwayat keputusan.': 'Belum ada riwayat keputusan.',
  'Deviation distribution from stored IFK decisions': 'Distribusi deviasi dari keputusan IFK tersimpan',
  'Belum ada keputusan final untuk dianalisis.': 'Belum ada keputusan final untuk dianalisis.',
  'Notifikasi IFK': 'Notifikasi IFK',
  'Audit trail analysis chart': 'Bagan analisis jejak audit',
  'Petugas IFK': 'Petugas IFK',
  'All risk': 'Semua risiko',
  Warning: 'Peringatan',
  Routine: 'Rutin',
  Logistics: 'Logistik',
  Update: 'Update',
  Maternal: 'Maternal',
  'Health (Active)': 'Kesehatan (Aktif)',
  Weather: 'Cuaca',
  Conditions: 'Kondisi',
  'Belum ada fasilitas untuk filter ini.': 'Belum ada fasilitas untuk filter ini.',
  'Belum ada tracking distribusi untuk fasilitas ini.': 'Belum ada tracking distribusi untuk fasilitas ini.',
  'Belum ada fasilitas alternatif.': 'Belum ada fasilitas alternatif.',
  Notifikasi: 'Notifikasi',
  Bantuan: 'Bantuan',
  'Halaman sebelumnya': 'Halaman sebelumnya',
  'Halaman berikutnya': 'Halaman berikutnya',
  'Dashboard stats summary': 'Ringkasan statistik dashboard',
  'Registry filters and table': 'Filter dan tabel registri',
  'Kembali ke clinic list': 'Kembali ke daftar klinik',
  'Memuat peta distribusi...': 'Memuat peta distribusi...',
  'Belum ada aktivitas approval.': 'Belum ada aktivitas approval.',
  'Ringkasan status klinik': 'Ringkasan status klinik',
  'Mode peta': 'Mode peta',
  'Cuaca dan rute': 'Cuaca dan rute',
  'Toggle weather overlay': 'Toggle overlay cuaca',
  Dispatch: 'Pengiriman',
  Urgency: 'Urgensi',
  'Changing priorities will automatically update the route and courier schedule for this distribution cluster.': 'Perubahan prioritas otomatis memperbarui rute dan jadwal kurir untuk klaster distribusi ini.',
  'Tambahkan status pengiriman pertama.': 'Tambahkan status pengiriman pertama.',
  'Apply Filter (8 results)': 'Terapkan Filter (8 hasil)',
  'This will permanently delete recommendation': 'Ini akan menghapus rekomendasi secara permanen',
  'Navigasi IFK': 'Navigasi IFK',
  'e.g., reserve stock already sent directly to the clinic': 'cth., stok cadangan sudah dikirim langsung ke klinik',
  'Catatan tracking': 'Catatan tracking',
  'Patient List': 'Daftar Pasien',
  'Completed examination detail': 'Detail pemeriksaan selesai',
  'Mrs. Anisa Rahmawati': 'Ny. Anisa Rahmawati',
  'Patient registration methods': 'Metode pendaftaran pasien',
  '3x Lipat': '3x Lipat',
  'Menampilkan 1-3 dari 124 pasien': 'Menampilkan 1-3 dari 124 pasien',
  Sebelumnya: 'Sebelumnya',
  Berikutnya: 'Berikutnya',
  'Cari dan filter pasien': 'Cari dan filter pasien',
  'Cari nama pasien...': 'Cari nama pasien...',
  'Filter pasien': 'Filter pasien',
  minggu: 'minggu',
  'Lihat Detail': 'Lihat Detail',
  'ANC K1 (Trimester 1)': 'ANC K1 (Trimester 1)',
  'ANC K2 (Trimester 2)': 'ANC K2 (Trimester 2)',
  'ANC K3 (Trimester 3)': 'ANC K3 (Trimester 3)',
  'ANC K4 (Trimester 3)': 'ANC K4 (Trimester 3)',
  'Master data summary': 'Ringkasan master data',
  Users: 'Pengguna',
  Coordinates: 'Koordinat',
  'Ringkasan halaman': 'Ringkasan halaman',
  'Tahapan pendaftaran pasien': 'Tahapan pendaftaran pasien',
  'Ringkasan kalender': 'Ringkasan kalender',
  'Kontrol kalender': 'Kontrol kalender',
  'Mode kalender': 'Mode kalender',
  'Prediksi Hari Ini': 'Prediksi Hari Ini',
  'Belum ada prediksi': 'Belum ada prediksi',
  'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'Data muncul dari HPL, ANC, dan risiko pasien aktif.',
  'Prediksi kalender hari ini': 'Prediksi kalender hari ini',
  'Peta Leaflet intensitas hujan dan risiko geospasial': 'Peta Leaflet intensitas hujan dan risiko geospasial',
  'Memuat peta lingkungan...': 'Memuat peta lingkungan...',
  'Day 1': 'Hari 1',
  'Day 7': 'Hari 7',
  'Live alert feed': 'Feed alert live',
  'No active alerts': 'Tidak ada alert aktif',
  'Sector Route ID': 'ID Rute Sektor',
  'Clinics Served': 'Klinik Dilayani',
  'Risk Factor': 'Faktor Risiko',
  'Current Status': 'Status Saat Ini',
  'Predicted Blockage Date': 'Tanggal Prediksi Hambatan',
  Confidence: 'Keyakinan',
  'Intelligence Hub / Regional Sector 04': 'Pusat Intelijen / Sektor Regional 04',
  'Rainfall Intensity & Geospatial Risk': 'Intensitas Hujan & Risiko Geospasial',
  '14-Day Strategic Forecast': 'Prakiraan Strategis 14 Hari',
  'Intelligence nodes tracking': 'Node intelijen dipantau',
  'No monitored facility': 'Tidak ada fasilitas dipantau',
  'Supply Chain Route Vulnerability': 'Kerentanan Rute Rantai Pasok',
  'Medicine sender navigation': 'Navigasi pengiriman obat',
  'Navigasi medicine sender': 'Navigasi pengiriman obat',
  'Pharmacy administrator': 'Administrator farmasi',
  'Live environmental alert feed': 'Feed alert lingkungan live',
  'Route vulnerability table': 'Tabel kerentanan rute',
  'Risk legend': 'Legenda risiko',
  'Logistics Intelligence': 'Intelijen Logistik',
  'Distribution Recommendations': 'Rekomendasi Distribusi',
  'Decision History': 'Riwayat Keputusan',
  Refresh: 'Segarkan',
  'Shipping Route Summary': 'Ringkasan Rute Pengiriman',
  'No active routes': 'Tidak ada rute aktif',
  'Approve pending recommendations to generate shipment routes.': 'Setujui rekomendasi tertunda untuk membuat rute pengiriman.',
  'Route updated automatically based on clinic priority order.': 'Rute otomatis diperbarui berdasarkan urutan prioritas klinik.',
  'Approval Metrics': 'Metrik Persetujuan',
  'Loading recommendations...': 'Memuat rekomendasi...',
  'No recommendations found.': 'Tidak ada rekomendasi.',
  'Pending Approval': 'Menunggu Persetujuan',
  Approve: 'Setujui',
  Track: 'Lacak',
  Reject: 'Tolak',
  'Edit Distribution': 'Ubah Distribusi',
  'Schedule & Priority': 'Jadwal & Prioritas',
  'Dispatch Date': 'Tanggal Pengiriman',
  'Delivery Priority': 'Prioritas Pengiriman',
  'Dispatch Time': 'Waktu Pengiriman',
  'Time is very tight': 'Waktu sangat ketat',
  'Amount of Medicine Sent': 'Jumlah Obat Dikirim',
  'Add Medication': 'Tambah Obat',
  'AI Qty': 'Jumlah AI',
  'Override Qty': 'Jumlah Override',
  Difference: 'Selisih',
  'AI Analysis': 'Analisis AI',
  Coverage: 'Cakupan',
  'Reason for Change': 'Alasan Perubahan',
  Required: 'Wajib',
  'Back to AI Recommendations': 'Kembali ke Rekomendasi AI',
  Cancel: 'Batal',
  'Track Shipment': 'Lacak Pengiriman',
  'Shipping Info': 'Info Pengiriman',
  'Origin & Destination': 'Asal & Tujuan',
  'Est. Arrival': 'Estimasi Tiba',
  'Shipment Contents': 'Isi Pengiriman',
  'Travel History': 'Riwayat Perjalanan',
  'No tracking events': 'Belum ada event pelacakan',
  'Travel Route Map': 'Peta Rute Perjalanan',
  'View Full History': 'Lihat Riwayat Lengkap',
  Close: 'Tutup',
  'Filter Distribution Recommendations': 'Filter Rekomendasi Distribusi',
  'Urgency Status': 'Status Urgensi',
  'Approval Status': 'Status Persetujuan',
  'Medicine Dispatched': 'Obat Dikirim',
  District: 'Kecamatan',
  'Qty Total': 'Total Qty',
  'Reset All': 'Reset Semua',
  'Main Content': 'Konten Utama',
  'Delete Recommendation': 'Hapus Rekomendasi',
  Delete: 'Hapus',
  'Search Petugas or Klinik': 'Cari Petugas atau Klinik',
  'Search Petugas or Klinik...': 'Cari Petugas atau Klinik...',
  'Next shipment status': 'Status pengiriman berikutnya',
  'Dispatch start date': 'Tanggal mulai pengiriman',
  'Dispatch end date': 'Tanggal akhir pengiriman',
  'Shipment in transit.': 'Pengiriman sedang berjalan.',
  'Confirm only after the medicines are physically received.': 'Konfirmasi hanya setelah obat diterima secara fisik.',
  Collapse: 'Ciutkan',
  Expand: 'Buka',
  'Confirm Received': 'Konfirmasi Diterima',
  'Saving...': 'Menyimpan...',
  Requested: 'Diminta',
  'Approved by IFK': 'Disetujui IFK',
  'In Transit': 'Dalam Pengiriman',
  Received: 'Diterima',
  Rejected: 'Ditolak',
  'Awaiting IFK Approval': 'Menunggu Persetujuan IFK',
  'Rejected by IFK': 'Ditolak IFK',
  Cancelled: 'Dibatalkan',
  'Issue Reported': 'Masalah Dilaporkan',
  'No reason provided.': 'Tidak ada alasan.',
  'active shipments': 'pengiriman aktif',
  'Print Report': 'Cetak Laporan',
  'Active Shipments': 'Pengiriman Aktif',
  'Completion Rate': 'Tingkat Selesai',
  Medicine: 'Obat',
  Quantity: 'Jumlah',
  'Latest Tracking': 'Pelacakan Terakhir',
  'No delivery data.': 'Tidak ada data pengiriman.',
  Generated: 'Dibuat',
  'Shipment received by puskesmas.': 'Pengiriman diterima oleh puskesmas.',
  'Gagal memuat pengiriman': 'Gagal memuat pengiriman',
  'Gagal mengirim ulang permintaan': 'Gagal mengirim ulang permintaan',
  'Gagal mengonfirmasi penerimaan': 'Gagal mengonfirmasi penerimaan',
  min: 'menit',
  hours: 'jam',
  'Total Facilities': 'Total Fasilitas',
  'Critical (Stockout)': 'Kritis (Stok Habis)',
  'Centralized registry of health facilities within the Sanctuary network. Real-time monitoring of stock, atmospheric risks, and delivery schedules.': 'Registri terpusat fasilitas kesehatan dalam jaringan Sanctuary. Pemantauan real-time stok, risiko atmosfer, dan jadwal pengiriman.',
  'Detail Fasilitas': 'Detail Fasilitas',
  'Notifikasi fasilitas muncul dari alert distribusi aktif.': 'Notifikasi fasilitas muncul dari alert distribusi aktif.',
  'Gunakan filter risiko, buka detail fasilitas, atau export CSV untuk audit.': 'Gunakan filter risiko, buka detail fasilitas, atau export CSV untuk audit.',
  'high-risk': 'risiko tinggi',
  'Head of Clinic': 'Kepala Puskesmas',
  'Confirmation Status': 'Status Konfirmasi',
  'Cold Chain Facilities': 'Fasilitas Cold Chain',
  Ready: 'Siap',
  Gap: 'Gap',
  'Endemic Status': 'Status Endemis',
  'Endemis malaria': 'Endemis malaria',
  'Non-endemis': 'Non-endemis',
  'Last Update:': 'Update Terakhir:',
  'Distribution items:': 'Item distribusi:',
  'Active pregnancy count:': 'Jumlah kehamilan aktif:',
  'Recommendation source:': 'Sumber rekomendasi:',
  'Lead time:': 'Lead time:',
  'distance to IFK:': 'jarak ke IFK:',
  'Urgency Score': 'Skor Urgensi',
  'Equity Priority': 'Prioritas Pemerataan',
  'AI Source': 'Sumber AI',
  Unavailable: 'Tidak tersedia',
  'Hosted AI': 'AI Hosted',
  'Demo seed': 'Data demo',
  'Rule fallback': 'Fallback aturan',
  'Cold chain ready': 'Cold chain siap',
  'Cold chain gap': 'Gap cold chain',
  Safe: 'Aman',
  critical: 'kritis',
  Days: 'Hari',
  'Lokasi belum tersedia': 'Lokasi belum tersedia',
  'Belum tersedia': 'Belum tersedia',
  'Belum tersedia di database': 'Belum tersedia di database',
  'Belum ada rekomendasi distribusi aktif.': 'Belum ada rekomendasi distribusi aktif.',
  'Stockouts Prevented': 'Stok Habis Dicegah',
  'Loaded from decisions': 'Dimuat dari keputusan',
  'Approved Decisions': 'Keputusan Disetujui',
  'IFK recommendations': 'Rekomendasi IFK',
  'Total Dispatches': 'Total Pengiriman',
  'Distribution records': 'Catatan distribusi',
  'Riwayat keputusan diperbarui dari event rekomendasi IFK.': 'Riwayat keputusan diperbarui dari event rekomendasi IFK.',
  'Belum ada data keputusan final.': 'Belum ada data keputusan final.',
  matched: 'sesuai',
  deviated: 'menyimpang',
  'Showing entries': 'Menampilkan entri',
  'Showing {from}-{to} of {total} health facilities': 'Menampilkan {from}-{to} dari {total} fasilitas kesehatan',
  'Requested {value}': 'Diminta {value}',
  'Expand {value} details': 'Buka detail {value}',
  'Collapse {value} details': 'Ciutkan detail {value}',
  'Health Centers': 'Puskesmas',
  'User Accounts': 'Akun Pengguna',
  'Medicine List': 'Daftar Obat',
  'Facility Profiles': 'Profil Fasilitas',
  'Patient Queue': 'Antrean Pasien',
  'Prediction Calendar': 'Kalender Prediksi',
  'Medicine Needs': 'Kebutuhan Obat',
  'IFK Dashboard': 'Dasbor IFK',
  Recommendations: 'Rekomendasi',
  Clinics: 'Klinik',
  Environment: 'Lingkungan',
  Delivering: 'Pengiriman',
  Superadmin: 'Superadmin',
  'Admin IFK': 'Admin IFK',
  'Bidan Puskesmas': 'Bidan Puskesmas',
  'Digital Sanctuary': 'Sanctuary Digital',
  'Microphone requires HTTPS or localhost.': 'Mikrofon memerlukan HTTPS atau localhost.',
  'Microphone unavailable': 'Mikrofon tidak tersedia',
  Tablet: 'Tablet',
  Ampul: 'Ampul',
  Botol: 'Botol',
  Strip: 'Strip',
  Vial: 'Vial',
  LOW: 'RENDAH',
  MEDIUM: 'SEDANG',
  HIGH: 'TINGGI',
  EXAMINING: 'DIPERIKSA',
  'Save Changes': 'Simpan Perubahan',
  'Approve & Dispatch': 'Setujui & Kirim',
  'Rejected by IFK review.': 'Ditolak oleh review IFK.',
  'active filter': 'filter aktif',
  'Rank #{value} = first delivery': 'Peringkat #{value} = pengiriman pertama',
  Reducing: 'Mengurangi',
  Increasing: 'Menambah',
  Maintaining: 'Mempertahankan',
  'Stockout risk increased sharply': 'Risiko stok habis meningkat tajam',
  'Coverage buffer increased': 'Buffer cakupan meningkat',
  'AI recommendation is unchanged': 'Rekomendasi AI tidak berubah',
  'days to': 'hari ke',
  records: 'catatan',
  'Examination History {value}': 'Riwayat Pemeriksaan {value}',
  '{value} active filter': '{value} filter aktif',
  '{action} {name}: {from} to {to} {unit}': '{action} {name}: {from} ke {to} {unit}',
  'Persalinan Bulan Ini': 'Persalinan Bulan Ini',
  'Kunjungan ANC': 'Kunjungan ANC',
  'Pasien Risiko Tinggi': 'Pasien Risiko Tinggi',
  'ANC Kit': 'Kit ANC',
  'Persalinan Kit': 'Kit Persalinan',
  'Buffer Darurat': 'Buffer Darurat',
  Cukup: 'Cukup',
  'Perlu Restok': 'Perlu Restok',
  'Hampir Habis': 'Hampir Habis',
  'Kebutuhan: {value} {unit}': 'Kebutuhan: {value} {unit}',
  'Personal Data': 'Data Diri',
  'Pregnancy Data': 'Data Kehamilan',
  'Screening & Risk': 'Screening & Risiko',
  'No symptoms above': 'Tidak ada gejala di atas',
  'Severe headache': 'Sakit kepala berat',
  Bleeding: 'Perdarahan',
  'Severe vomiting': 'Muntah berat',
  'Severe abdominal pain': 'Nyeri perut berat',
  'Decreased fetal movement': 'Gerak janin berkurang',
  Hypertension: 'Hipertensi',
  Anemia: 'Anemia',
  'Gestational DM': 'DM Gestasional',
  Preeclampsia: 'Preeklamsia',
  Complications: 'Komplikasi',
  'History of C-section': 'Riwayat operasi sesar',
  'Gap < 2 Yrs': 'Jarak < 2 Tahun',
  Infection: 'Infeksi',
  'Pilih minimal satu tanda bahaya atau No symptoms above.': 'Pilih minimal satu tanda bahaya atau Tidak ada gejala di atas.',
  'Ketik Manual': 'Ketik Manual',
  'Isi form langkah demi langkah': 'Isi form langkah demi langkah',
  'Pilihan terbaik untuk input data mendetail dengan kontrol penuh pada setiap kolom isian.': 'Pilihan terbaik untuk input data mendetail dengan kontrol penuh pada setiap kolom isian.',
  'Mulai Mengetik': 'Mulai Mengetik',
  'Input Suara': 'Input Suara',
  'Cukup bicara, AI yang catat': 'Cukup bicara, AI yang catat',
  'Metode tercepat saat sedang menangani pasien. Bicara secara natural untuk mencatat anamnesa.': 'Metode tercepat saat sedang menangani pasien. Bicara secara natural untuk mencatat anamnesa.',
  'Mulai Bicara': 'Mulai Bicara',
  'Data Diri': 'Data Diri',
  'Data Kehamilan': 'Data Kehamilan',
  'Faktor Risiko': 'Faktor Risiko',
  Hipertensi: 'Hipertensi',
  'Tekanan darah tinggi': 'Tekanan darah tinggi',
  'Kurang darah': 'Kurang darah',
  'Diabetes Gestasional': 'Diabetes Gestasional',
  'Kadar gula darah tinggi saat hamil': 'Kadar gula darah tinggi saat hamil',
  'Kehamilan Bermasalah': 'Kehamilan Bermasalah',
  'Riwayat komplikasi sebelumnya': 'Riwayat komplikasi sebelumnya',
  'Usia di bawah 18 tahun': 'Usia di bawah 18 tahun',
  'Risiko kehamilan usia dini': 'Risiko kehamilan usia dini',
  'Usia di atas 35 tahun': 'Usia di atas 35 tahun',
  'Risiko tinggi usia matang': 'Risiko tinggi usia matang',
  'Kehamilan kembar': 'Kehamilan kembar',
  'Multiplet (Gemelli)': 'Multiplet (Gemelli)',
  'Vector map of rainfall intensity and geospatial risk': 'Peta vektor intensitas hujan dan risiko geospasial',
  Critical: 'Kritis',
  SYSTEM: 'SISTEM',
  'MaternaLink Dashboard': 'Dasbor MaternaLink',
  'Dashboard shell for MaternaLink supply-chain planning.': 'Shell dasbor untuk perencanaan rantai pasok MaternaLink.',
  'Login | MaternaLink': 'Masuk | MaternaLink',
  'Masuk ke sistem MaternaLink.': 'Masuk ke sistem MaternaLink.',
});

Object.assign(enText, Object.fromEntries(Object.entries(idText).map(([key, value]) => [value, key])), {
  Beranda: 'Home', Dasbor: 'Dashboard', Distribusi: 'Distribution', 'Daftar Klinik': 'Clinic List',
  'Pemantauan Lingkungan': 'Environment Monitoring', Antrekan: 'Queue', 'Memuat detail pasien...': 'Loading patient detail...',
  'Pasien tidak ditemukan': 'Patient not found', 'Riwayat Keputusan': 'Decision History', 'Rekomendasi Distribusi': 'Distribution Recommendations',
  'Pengiriman Obat': 'Medicine Shipping', 'Belum ada catatan': 'None recorded', 'Belum ada data pengiriman.': 'No delivery data.',
  'Tidak ada pengiriman aktif saat ini.': 'No active deliveries right now.',
  'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'Shipment locations will appear once IFK has dispatched medicine packages to health centers.',
  'Memuat peta lingkungan...': 'Loading environment map...', 'Belum ada alert distribusi dari database.': 'No distribution alerts from the database yet.',
  'Belum ada data rute.': 'No route data yet.', 'Prediksi Hari Ini': 'Today Prediction', 'Belum ada prediksi': 'No prediction yet',
  'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'Data appears from EDD, ANC, and active patient risk.',
  'Siapkan Tindakan': 'Prepare Action', 'CATATAN BIDAN': 'MIDWIFE NOTES', 'Kembali ke Rekomendasi AI': 'Back to AI Recommendations',
  'Tambah Obat': 'Add Medication', 'Alasan Perubahan': 'Reason for Change', 'Lihat Riwayat Lengkap': 'View Full History',
  Tutup: 'Close', Hapus: 'Delete', Batal: 'Cancel', 'Menyimpan...': 'Saving...', 'Konfirmasi Diterima': 'Confirm Received',
  'pengiriman aktif': 'active shipments',
});

function localeMap(overrides: Record<string, string>) {
  const entries = Object.entries(idText).flatMap(([english, indonesian]) => {
    const translated = overrides[english] ?? overrides[indonesian] ?? indonesian;
    return [[english, translated], [indonesian, translated]] as Array<[string, string]>;
  });
  return Object.fromEntries(entries);
}

const msText = localeMap({
  Home: 'Laman utama', Dashboard: 'Papan pemuka', Distribution: 'Pengedaran', 'Clinic List': 'Senarai Klinik', 'Environment Monitoring': 'Pemantauan Persekitaran', 'District Monitoring': 'Pemantauan Daerah', 'Medicine Sender': 'Penghantaran Ubat', 'Review queue': 'Baris semakan', Map: 'Peta', Satellite: 'Satelit', 'Weather hidden': 'Cuaca disembunyikan', 'Live unavailable': 'Live tidak tersedia', 'Facility route map': 'Peta laluan fasiliti', 'Urgent actions required': 'Tindakan segera diperlukan', 'No urgent actions': 'Tiada tindakan segera', Supply: 'Bekalan', 'All clear': 'Semua selamat', 'Weather risk': 'Risiko cuaca', 'Supply shortage': 'Kekurangan bekalan', 'Recent Approval Activity': 'Aktiviti Kelulusan Terkini', Timestamp: 'Masa', Entity: 'Entiti', 'Action type': 'Jenis tindakan', Operator: 'Operator', Status: 'Status', 'All Clinics': 'Semua Klinik', 'Export CSV': 'Eksport CSV', 'Add Clinic': 'Tambah Klinik', 'Clinic Name': 'Nama Klinik', Location: 'Lokasi', 'Logistics Update': 'Kemas Kini Logistik', 'Critical Stock': 'Stok Kritikal', 'Maternal Health (Active)': 'Kesihatan Ibu (Aktif)', 'Risk Level': 'Tahap Risiko', 'Weather Conditions': 'Keadaan Cuaca', Action: 'Tindakan', Filter: 'Tapis', Registry: 'Daftar', Infrastructure: 'Infrastruktur', 'Clinic Profile': 'Profil Klinik', 'Medication & Supplies': 'Ubat & Bekalan', 'Medication Name': 'Nama Ubat', Stock: 'Stok', Needs: 'Keperluan', 'Days Remaining': 'Baki Hari', 'AI Recommendation Analysis': 'Analisis Cadangan AI', 'Optimized Logistics Route': 'Laluan Logistik Optimum', 'Storage capacity:': 'Kapasiti simpanan:', 'Shipping History': 'Sejarah Penghantaran', 'Operational Ledger': 'Lejar Operasi', Sort: 'Susun', 'Medicine Delivery Report': 'Laporan Penghantaran Ubat', 'Patient detail tabs': 'Tab butiran pesakit', 'Medical Record': 'Rekod Perubatan', 'Personal Info': 'Maklumat Peribadi', 'Active Pregnancy': 'Kehamilan Aktif', 'Gestational Age': 'Usia Kandungan', 'Due Date': 'Tarikh Jangka Bersalin', Queue: 'Baris Gilir', 'Edit Patient': 'Edit Pesakit', 'Pregnancy Status': 'Status Kehamilan', 'Routine Medication': 'Ubat Rutin', 'Medical Background': 'Latar Perubatan', 'Blood Type': 'Jenis Darah', Allergy: 'Alergi', 'Examination History': 'Sejarah Pemeriksaan', 'Chief Complaint': 'Aduan Utama', 'Vital Signs': 'Tanda Vital', 'Blood Pressure': 'Tekanan Darah', Temperature: 'Suhu', 'Heart Rate': 'Denyut Jantung', 'Medication Issued': 'Ubat Diberikan', 'Print Prescription': 'Cetak Preskripsi', 'Main Identity': 'Identiti Utama', 'Full Name': 'Nama Penuh', Address: 'Alamat', Phone: 'Telefon', Relationship: 'Hubungan', 'Pregnancy History': 'Sejarah Kehamilan', 'High Risk Classification': 'Klasifikasi Risiko Tinggi', 'Medicine Shipping': 'Penghantaran Ubat', 'Shipment filters': 'Tapis penghantaran', 'Medicine shipments': 'Penghantaran ubat', 'Shipping analytics': 'Analitik penghantaran', 'Active Shipping Locations': 'Lokasi Penghantaran Aktif', 'Shipment Completion Rate': 'Kadar Selesai Penghantaran', 'Average Duration': 'Tempoh Purata', 'Total Items': 'Jumlah Item', Reason: 'Sebab', 'Re-request': 'Mohon semula', 'Shipping progress': 'Kemajuan penghantaran', 'Shipping Information': 'Maklumat Penghantaran', Courier: 'Kurier', Origin: 'Asal', Destination: 'Destinasi', Distance: 'Jarak', 'Shipping Contents': 'Kandungan Penghantaran', 'Tracking History': 'Sejarah Penjejakan', 'No active alerts': 'Tiada amaran aktif', 'Current Status': 'Status Semasa', Confidence: 'Keyakinan', Critical: 'Kritikal', Refresh: 'Segar semula', Approve: 'Luluskan', Track: 'Jejak', Reject: 'Tolak', Cancel: 'Batal', Close: 'Tutup', Delete: 'Padam', 'Saving...': 'Menyimpan...', Requested: 'Diminta', Received: 'Diterima', Rejected: 'Ditolak', 'Print Report': 'Cetak Laporan', Medicine: 'Ubat', Quantity: 'Kuantiti',
});
Object.assign(msText, { 'Prediksi Hari Ini': 'Ramalan Hari Ini', 'Belum ada prediksi': 'Tiada ramalan', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'Data muncul daripada EDD, ANC dan risiko pesakit aktif.', '21 JUN': '21 JUN' });
Object.assign(msText, { 'CATATAN BIDAN': 'NOTA BIDAN', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'Pastikan stok Metildopa tersedia untuk minggu depan.', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'Pantau status permintaan dan penghantaran ubat ke pusat kesihatan anda', All: 'Semua', Issue: 'Isu', 'Awaiting Approval': 'Menunggu Kelulusan', Approved: 'Diluluskan', 'Dalam Pengiriman': 'Dalam Penghantaran', 'pengiriman aktif': 'penghantaran aktif', 'Menunggu Persetujuan IFK': 'Menunggu Kelulusan IFK', 'Approved by IFK': 'Diluluskan oleh IFK', 'In Transit': 'Dalam Penghantaran', 'Pengiriman sedang berjalan.': 'Penghantaran sedang berjalan.', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'Sahkan hanya selepas ubat diterima secara fizikal.', 'Konfirmasi Diterima': 'Sahkan Diterima', 'Lokasi Pengiriman Aktif': 'Lokasi Penghantaran Aktif', 'Tidak ada pengiriman aktif saat ini.': 'Tiada penghantaran aktif sekarang.', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'Lokasi penghantaran akan muncul selepas IFK menghantar pakej ubat ke pusat kesihatan.', 'Tingkat Penyelesaian Pengiriman': 'Kadar Selesai Penghantaran', 'Durasi Rata-rata': 'Tempoh Purata', 'Total Item': 'Jumlah Item', Unit: 'Unit', 'In báo cáo': 'Cetak Laporan' });

const filText = localeMap({ Home: 'Home', Dashboard: 'Dashboard', Distribution: 'Distribusyon', 'Clinic List': 'Listahan ng Klinika', 'Environment Monitoring': 'Pagsubaybay sa Kapaligiran', 'Medicine Sender': 'Pagpapadala ng Gamot', Map: 'Mapa', Satellite: 'Satellite', Supply: 'Suplay', Timestamp: 'Oras', Entity: 'Entity', Operator: 'Operator', Status: 'Katayuan', 'All Clinics': 'Lahat ng Klinika', 'Export CSV': 'I-export CSV', 'Add Clinic': 'Magdagdag ng Klinika', 'Clinic Name': 'Pangalan ng Klinika', Location: 'Lokasyon', 'Critical Stock': 'Kritikal na Stock', 'Risk Level': 'Antas ng Panganib', Action: 'Aksyon', Filter: 'Filter', Registry: 'Registry', 'Medication Name': 'Pangalan ng Gamot', Stock: 'Stock', Needs: 'Pangangailangan', 'Days Remaining': 'Natitirang Araw', Sort: 'Ayusin', 'Medicine Delivery Report': 'Ulat sa Paghahatid ng Gamot', 'Medical Record': 'Rekord Medikal', 'Personal Info': 'Personal na Impormasyon', 'Active Pregnancy': 'Aktibong Pagbubuntis', 'Gestational Age': 'Edad ng Pagbubuntis', 'Due Date': 'Takdang Petsa', Queue: 'Pila', 'Edit Patient': 'I-edit ang Pasyente', 'Routine Medication': 'Regular na Gamot', 'Blood Type': 'Uri ng Dugo', Allergy: 'Alerhiya', 'Chief Complaint': 'Pangunahing Reklamo', 'Vital Signs': 'Vital Signs', 'Blood Pressure': 'Presyon ng Dugo', Temperature: 'Temperatura', 'Heart Rate': 'Tibok ng Puso', 'Full Name': 'Buong Pangalan', Address: 'Address', Phone: 'Telepono', Relationship: 'Relasyon', 'Medicine Shipping': 'Pagpapadala ng Gamot', 'Shipment filters': 'Mga filter ng padala', 'Medicine shipments': 'Mga padala ng gamot', 'Average Duration': 'Karaniwang Tagal', 'Total Items': 'Kabuuang Item', Reason: 'Dahilan', 'Re-request': 'Humiling muli', Courier: 'Courier', Origin: 'Pinagmulan', Destination: 'Destinasyon', Distance: 'Distansya', Critical: 'Kritikal', Refresh: 'I-refresh', Approve: 'Aprubahan', Track: 'Subaybayan', Reject: 'Tanggihan', Cancel: 'Kanselahin', Close: 'Isara', Delete: 'Tanggalin', 'Saving...': 'Sine-save...', Requested: 'Hiniling', Received: 'Natanggap', Rejected: 'Tinanggihan', 'Print Report': 'I-print ang Ulat', Medicine: 'Gamot', Quantity: 'Dami' });
Object.assign(filText, { 'Prediksi Hari Ini': 'Hula Ngayon', 'Belum ada prediksi': 'Wala pang hula', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'Lalabas ang data mula sa EDD, ANC, at panganib ng aktibong pasyente.' });
Object.assign(filText, { 'CATATAN BIDAN': 'TALA NG MIDWIFE', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'Tiyaking may stock ng Metildopa para sa susunod na linggo.', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'Subaybayan ang status ng kahilingan at pagpapadala ng gamot sa iyong health center', All: 'Lahat', Issue: 'Isyu', 'Awaiting Approval': 'Naghihintay ng Pag-apruba', Approved: 'Naaprubahan', 'Dalam Pengiriman': 'Ipinapadala', 'pengiriman aktif': 'aktibong padala', 'Menunggu Persetujuan IFK': 'Naghihintay ng Pag-apruba ng IFK', 'Approved by IFK': 'Inaprubahan ng IFK', 'In Transit': 'Ipinapadala', 'Pengiriman sedang berjalan.': 'Kasalukuyang ipinapadala.', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'Kumpirmahin lamang kapag pisikal nang natanggap ang gamot.', 'Konfirmasi Diterima': 'Kumpirmahin ang Pagtanggap', 'Lokasi Pengiriman Aktif': 'Aktibong Lokasyon ng Padala', 'Tidak ada pengiriman aktif saat ini.': 'Walang aktibong padala ngayon.', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'Lalabas ang lokasyon kapag naipadala na ng IFK ang pakete ng gamot sa health center.', 'Tingkat Penyelesaian Pengiriman': 'Rate ng Pagkumpleto ng Padala', 'Durasi Rata-rata': 'Karaniwang Tagal', 'Total Item': 'Kabuuang Item', Unit: 'Yunit', 'In báo cáo': 'I-print ang Ulat' });

const thText = localeMap({ Home: 'หน้าหลัก', Dashboard: 'แดชบอร์ด', Distribution: 'การกระจาย', 'Clinic List': 'รายชื่อคลินิก', 'Environment Monitoring': 'ติดตามสิ่งแวดล้อม', 'Medicine Sender': 'จัดส่งยา', Map: 'แผนที่', Satellite: 'ดาวเทียม', Supply: 'เวชภัณฑ์', Timestamp: 'เวลา', Entity: 'หน่วยงาน', Operator: 'ผู้ดำเนินการ', Status: 'สถานะ', 'All Clinics': 'ทุกคลินิก', 'Export CSV': 'ส่งออก CSV', 'Add Clinic': 'เพิ่มคลินิก', 'Clinic Name': 'ชื่อคลินิก', Location: 'ที่ตั้ง', 'Critical Stock': 'สต็อกวิกฤต', 'Risk Level': 'ระดับความเสี่ยง', Action: 'การดำเนินการ', Filter: 'ตัวกรอง', Registry: 'ทะเบียน', 'Medication Name': 'ชื่อยา', Stock: 'สต็อก', Needs: 'ความต้องการ', 'Days Remaining': 'วันที่เหลือ', Sort: 'เรียงลำดับ', 'Medicine Delivery Report': 'รายงานจัดส่งยา', 'Medical Record': 'เวชระเบียน', 'Personal Info': 'ข้อมูลส่วนตัว', 'Active Pregnancy': 'การตั้งครรภ์ปัจจุบัน', 'Gestational Age': 'อายุครรภ์', 'Due Date': 'กำหนดคลอด', Queue: 'คิว', 'Edit Patient': 'แก้ไขผู้ป่วย', 'Routine Medication': 'ยาประจำ', 'Blood Type': 'กรุ๊ปเลือด', Allergy: 'ภูมิแพ้', 'Chief Complaint': 'อาการสำคัญ', 'Vital Signs': 'สัญญาณชีพ', 'Blood Pressure': 'ความดันโลหิต', Temperature: 'อุณหภูมิ', 'Heart Rate': 'ชีพจร', 'Full Name': 'ชื่อเต็ม', Address: 'ที่อยู่', Phone: 'โทรศัพท์', Relationship: 'ความสัมพันธ์', 'Medicine Shipping': 'การจัดส่งยา', 'Shipment filters': 'ตัวกรองการจัดส่ง', 'Medicine shipments': 'รายการจัดส่งยา', 'Average Duration': 'ระยะเวลาเฉลี่ย', 'Total Items': 'จำนวนทั้งหมด', Reason: 'เหตุผล', 'Re-request': 'ขออีกครั้ง', Courier: 'ผู้จัดส่ง', Origin: 'ต้นทาง', Destination: 'ปลายทาง', Distance: 'ระยะทาง', Critical: 'วิกฤต', Refresh: 'รีเฟรช', Approve: 'อนุมัติ', Track: 'ติดตาม', Reject: 'ปฏิเสธ', Cancel: 'ยกเลิก', Close: 'ปิด', Delete: 'ลบ', 'Saving...': 'กำลังบันทึก...', Requested: 'ร้องขอแล้ว', Received: 'ได้รับแล้ว', Rejected: 'ถูกปฏิเสธ', 'Print Report': 'พิมพ์รายงาน', Medicine: 'ยา', Quantity: 'จำนวน' });
Object.assign(thText, { 'Prediksi Hari Ini': 'การคาดการณ์วันนี้', 'Belum ada prediksi': 'ยังไม่มีการคาดการณ์', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'ข้อมูลจะแสดงจากวันครบกำหนด ANC และความเสี่ยงของผู้ป่วยที่ใช้งานอยู่.' });
Object.assign(thText, { 'CATATAN BIDAN': 'บันทึกผดุงครรภ์', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'ตรวจสอบให้มีสต็อก Metildopa สำหรับสัปดาห์หน้า', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'ติดตามสถานะคำขอและการจัดส่งยาไปยังศูนย์สุขภาพของคุณ', All: 'ทั้งหมด', Issue: 'ปัญหา', 'Awaiting Approval': 'รออนุมัติ', Approved: 'อนุมัติแล้ว', 'Dalam Pengiriman': 'กำลังจัดส่ง', 'pengiriman aktif': 'การจัดส่งที่ใช้งานอยู่', 'Menunggu Persetujuan IFK': 'รออนุมัติจาก IFK', 'Approved by IFK': 'อนุมัติโดย IFK', 'In Transit': 'กำลังขนส่ง', 'Pengiriman sedang berjalan.': 'การจัดส่งกำลังดำเนินการ', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'ยืนยันเมื่อได้รับยาจริงเท่านั้น', 'Konfirmasi Diterima': 'ยืนยันได้รับแล้ว', 'Lokasi Pengiriman Aktif': 'ตำแหน่งจัดส่งที่ใช้งานอยู่', 'Tidak ada pengiriman aktif saat ini.': 'ขณะนี้ไม่มีการจัดส่งที่ใช้งานอยู่', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'ตำแหน่งจัดส่งจะแสดงเมื่อ IFK ส่งแพ็กเกจยาไปยังศูนย์สุขภาพแล้ว', 'Tingkat Penyelesaian Pengiriman': 'อัตราสำเร็จการจัดส่ง', 'Durasi Rata-rata': 'ระยะเวลาเฉลี่ย', 'Total Item': 'จำนวนทั้งหมด', Unit: 'หน่วย', 'In báo cáo': 'พิมพ์รายงาน' });

const viText = localeMap({ Home: 'Trang chủ', Dashboard: 'Bảng điều khiển', Distribution: 'Phân phối', 'Clinic List': 'Danh sách phòng khám', 'Environment Monitoring': 'Giám sát môi trường', 'Medicine Sender': 'Gửi thuốc', Map: 'Bản đồ', Satellite: 'Vệ tinh', Supply: 'Nguồn cung', Timestamp: 'Thời gian', Entity: 'Đối tượng', Operator: 'Người vận hành', Status: 'Trạng thái', 'All Clinics': 'Tất cả phòng khám', 'Export CSV': 'Xuất CSV', 'Add Clinic': 'Thêm phòng khám', 'Clinic Name': 'Tên phòng khám', Location: 'Vị trí', 'Critical Stock': 'Tồn kho nguy cấp', 'Risk Level': 'Mức rủi ro', Action: 'Thao tác', Filter: 'Lọc', Registry: 'Sổ đăng ký', 'Medication Name': 'Tên thuốc', Stock: 'Tồn kho', Needs: 'Nhu cầu', 'Days Remaining': 'Số ngày còn lại', Sort: 'Sắp xếp', 'Medicine Delivery Report': 'Báo cáo giao thuốc', 'Medical Record': 'Hồ sơ y tế', 'Personal Info': 'Thông tin cá nhân', 'Active Pregnancy': 'Thai kỳ hiện tại', 'Gestational Age': 'Tuổi thai', 'Due Date': 'Ngày dự sinh', Queue: 'Hàng đợi', 'Edit Patient': 'Sửa bệnh nhân', 'Routine Medication': 'Thuốc định kỳ', 'Blood Type': 'Nhóm máu', Allergy: 'Dị ứng', 'Chief Complaint': 'Lý do khám chính', 'Vital Signs': 'Dấu hiệu sinh tồn', 'Blood Pressure': 'Huyết áp', Temperature: 'Nhiệt độ', 'Heart Rate': 'Nhịp tim', 'Full Name': 'Họ tên', Address: 'Địa chỉ', Phone: 'Điện thoại', Relationship: 'Quan hệ', 'Medicine Shipping': 'Giao thuốc', 'Shipment filters': 'Bộ lọc giao hàng', 'Medicine shipments': 'Các lô giao thuốc', 'Average Duration': 'Thời lượng trung bình', 'Total Items': 'Tổng mặt hàng', Reason: 'Lý do', 'Re-request': 'Yêu cầu lại', Courier: 'Đơn vị giao', Origin: 'Điểm đi', Destination: 'Điểm đến', Distance: 'Khoảng cách', Critical: 'Nguy cấp', Refresh: 'Làm mới', Approve: 'Phê duyệt', Track: 'Theo dõi', Reject: 'Từ chối', Cancel: 'Hủy', Close: 'Đóng', Delete: 'Xóa', 'Saving...': 'Đang lưu...', Requested: 'Đã yêu cầu', Received: 'Đã nhận', Rejected: 'Đã từ chối', 'Print Report': 'In báo cáo', Medicine: 'Thuốc', Quantity: 'Số lượng' });
Object.assign(viText, { 'Prediksi Hari Ini': 'Dự báo hôm nay', 'Belum ada prediksi': 'Chưa có dự báo', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'Dữ liệu hiển thị từ ngày dự sinh, ANC và nguy cơ của bệnh nhân đang hoạt động.' });
Object.assign(viText, { 'CATATAN BIDAN': 'GHI CHÚ HỘ SINH', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'Đảm bảo có sẵn tồn kho Metildopa cho tuần tới.', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'Theo dõi trạng thái yêu cầu và giao thuốc đến trung tâm y tế của bạn', All: 'Tất cả', Issue: 'Sự cố', 'Awaiting Approval': 'Chờ phê duyệt', Approved: 'Đã phê duyệt', 'Dalam Pengiriman': 'Đang giao', 'pengiriman aktif': 'lô giao đang hoạt động', 'Menunggu Persetujuan IFK': 'Chờ IFK phê duyệt', 'Approved by IFK': 'Được IFK phê duyệt', 'In Transit': 'Đang vận chuyển', 'Pengiriman sedang berjalan.': 'Lô hàng đang vận chuyển.', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'Chỉ xác nhận sau khi đã nhận thuốc thực tế.', 'Konfirmasi Diterima': 'Xác nhận đã nhận', 'Lokasi Pengiriman Aktif': 'Vị trí giao hàng đang hoạt động', 'Tidak ada pengiriman aktif saat ini.': 'Hiện chưa có lô giao đang hoạt động.', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'Vị trí giao hàng sẽ hiển thị khi IFK đã gửi gói thuốc đến trung tâm y tế.', 'Tingkat Penyelesaian Pengiriman': 'Tỷ lệ hoàn tất giao hàng', 'Durasi Rata-rata': 'Thời lượng trung bình', 'Total Item': 'Tổng mặt hàng', Unit: 'Đơn vị', 'In báo cáo': 'In báo cáo' });

const kmText = localeMap({ Home: 'ទំព័រដើម', Dashboard: 'ផ្ទាំងគ្រប់គ្រង', Distribution: 'ការចែកចាយ', 'Clinic List': 'បញ្ជីគ្លីនិក', 'Environment Monitoring': 'តាមដានបរិស្ថាន', 'Medicine Sender': 'ដឹកជញ្ជូនថ្នាំ', Map: 'ផែនទី', Satellite: 'ផ្កាយរណប', Supply: 'ការផ្គត់ផ្គង់', Timestamp: 'ពេលវេលា', Entity: 'អង្គភាព', Operator: 'ប្រតិបត្តិករ', Status: 'ស្ថានភាព', 'All Clinics': 'គ្លីនិកទាំងអស់', 'Export CSV': 'នាំចេញ CSV', 'Add Clinic': 'បន្ថែមគ្លីនិក', 'Clinic Name': 'ឈ្មោះគ្លីនិក', Location: 'ទីតាំង', 'Critical Stock': 'ស្តុកវិបត្តិ', 'Risk Level': 'កម្រិតហានិភ័យ', Action: 'សកម្មភាព', Filter: 'តម្រង', Registry: 'បញ្ជី', 'Medication Name': 'ឈ្មោះថ្នាំ', Stock: 'ស្តុក', Needs: 'តម្រូវការ', Sort: 'តម្រៀប', 'Medical Record': 'កំណត់ត្រាវេជ្ជសាស្រ្ត', 'Personal Info': 'ព័ត៌មានផ្ទាល់ខ្លួន', 'Active Pregnancy': 'ការមានផ្ទៃពោះសកម្ម', 'Gestational Age': 'អាយុគភ៌', 'Due Date': 'ថ្ងៃកំណត់សម្រាល', Queue: 'ជួរ', 'Edit Patient': 'កែអ្នកជំងឺ', 'Blood Type': 'ប្រភេទឈាម', Allergy: 'អាឡែស៊ី', 'Blood Pressure': 'សម្ពាធឈាម', Temperature: 'សីតុណ្ហភាព', 'Full Name': 'ឈ្មោះពេញ', Address: 'អាសយដ្ឋាន', Phone: 'ទូរស័ព្ទ', Relationship: 'ទំនាក់ទំនង', 'Medicine Shipping': 'ដឹកជញ្ជូនថ្នាំ', Reason: 'ហេតុផល', Courier: 'អ្នកដឹកជញ្ជូន', Origin: 'ប្រភព', Destination: 'គោលដៅ', Distance: 'ចម្ងាយ', Critical: 'វិបត្តិ', Refresh: 'ផ្ទុកឡើងវិញ', Approve: 'អនុម័ត', Track: 'តាមដាន', Reject: 'បដិសេធ', Cancel: 'បោះបង់', Close: 'បិទ', Delete: 'លុប', Medicine: 'ថ្នាំ', Quantity: 'បរិមាណ' });
Object.assign(kmText, { 'Prediksi Hari Ini': 'ការព្យាករណ៍ថ្ងៃនេះ', 'Belum ada prediksi': 'មិនទាន់មានការព្យាករណ៍', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'ទិន្នន័យបង្ហាញពីថ្ងៃសម្រាល ការពិនិត្យ ANC និងហានិភ័យអ្នកជំងឺសកម្ម.' });
Object.assign(kmText, { 'CATATAN BIDAN': 'កំណត់ចំណាំឆ្មប', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'ធានាថាមានស្តុក Metildopa សម្រាប់សប្តាហ៍ក្រោយ។', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'តាមដានស្ថានភាពសំណើ និងការដឹកជញ្ជូនថ្នាំទៅមណ្ឌលសុខភាពរបស់អ្នក', All: 'ទាំងអស់', Issue: 'បញ្ហា', 'Awaiting Approval': 'រង់ចាំអនុម័ត', Approved: 'បានអនុម័ត', 'Dalam Pengiriman': 'កំពុងដឹកជញ្ជូន', 'pengiriman aktif': 'ការដឹកជញ្ជូនសកម្ម', 'Menunggu Persetujuan IFK': 'រង់ចាំការអនុម័ត IFK', 'Approved by IFK': 'បានអនុម័តដោយ IFK', 'In Transit': 'កំពុងដឹកជញ្ជូន', 'Pengiriman sedang berjalan.': 'ការដឹកជញ្ជូនកំពុងដំណើរការ។', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'បញ្ជាក់តែបន្ទាប់ពីបានទទួលថ្នាំជាក់ស្តែង។', 'Konfirmasi Diterima': 'បញ្ជាក់ទទួលបាន', 'Lokasi Pengiriman Aktif': 'ទីតាំងដឹកជញ្ជូនសកម្ម', 'Tidak ada pengiriman aktif saat ini.': 'មិនមានការដឹកជញ្ជូនសកម្មឥឡូវនេះ។', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'ទីតាំងនឹងបង្ហាញនៅពេល IFK បានផ្ញើកញ្ចប់ថ្នាំទៅមណ្ឌលសុខភាព។', 'Tingkat Penyelesaian Pengiriman': 'អត្រាបញ្ចប់ការដឹកជញ្ជូន', 'Durasi Rata-rata': 'រយៈពេលមធ្យម', 'Total Item': 'ធាតុសរុប', Unit: 'ឯកតា', 'In báo cáo': 'បោះពុម្ពរបាយការណ៍' });

const loText = localeMap({ Home: 'ໜ້າຫຼັກ', Dashboard: 'ແດຊບອດ', Distribution: 'ການຈັດສົ່ງ', 'Clinic List': 'ລາຍຊື່ຄລິນິກ', 'Environment Monitoring': 'ຕິດຕາມສິ່ງແວດລ້ອມ', 'Medicine Sender': 'ສົ່ງຢາ', Map: 'ແຜນທີ່', Satellite: 'ດາວທຽມ', Supply: 'ການສະໜອງ', Timestamp: 'ເວລາ', Entity: 'ຫົວໜ່ວຍ', Operator: 'ຜູ້ດຳເນີນການ', Status: 'ສະຖານະ', 'All Clinics': 'ຄລິນິກທັງໝົດ', 'Export CSV': 'ສົ່ງອອກ CSV', 'Add Clinic': 'ເພີ່ມຄລິນິກ', 'Clinic Name': 'ຊື່ຄລິນິກ', Location: 'ທີ່ຕັ້ງ', 'Risk Level': 'ລະດັບຄວາມສ່ຽງ', Action: 'ການດຳເນີນການ', Filter: 'ກັ່ນຕອງ', Stock: 'ສະຕັອກ', Needs: 'ຄວາມຕ້ອງການ', Sort: 'ຈັດຮຽງ', 'Medical Record': 'ບັນທຶກການແພດ', 'Personal Info': 'ຂໍ້ມູນສ່ວນຕົວ', 'Active Pregnancy': 'ການຖືພາປັດຈຸບັນ', 'Gestational Age': 'ອາຍຸຄັນ', 'Due Date': 'ກຳນົດຄອດ', Queue: 'ຄິວ', 'Edit Patient': 'ແກ້ໄຂຄົນເຈັບ', Allergy: 'ພູມແພ້', 'Blood Pressure': 'ຄວາມດັນເລືອດ', Temperature: 'ອຸນຫະພູມ', 'Full Name': 'ຊື່ເຕັມ', Address: 'ທີ່ຢູ່', Phone: 'ໂທລະສັບ', 'Medicine Shipping': 'ການສົ່ງຢາ', Reason: 'ເຫດຜົນ', Courier: 'ຜູ້ສົ່ງ', Origin: 'ຕົ້ນທາງ', Destination: 'ປາຍທາງ', Distance: 'ໄລຍະທາງ', Critical: 'ວິກິດ', Refresh: 'ໂຫຼດໃໝ່', Approve: 'ອະນຸມັດ', Track: 'ຕິດຕາມ', Reject: 'ປະຕິເສດ', Cancel: 'ຍົກເລີກ', Close: 'ປິດ', Delete: 'ລຶບ', Medicine: 'ຢາ', Quantity: 'ຈຳນວນ' });
Object.assign(loText, { 'Prediksi Hari Ini': 'ຄາດຄະເນມື້ນີ້', 'Belum ada prediksi': 'ຍັງບໍ່ມີຄາດຄະເນ', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'ຂໍ້ມູນຈະສະແດງຈາກກຳນົດຄອດ, ANC ແລະຄວາມສ່ຽງຄົນເຈັບທີ່ໃຊ້ງານ.' });
Object.assign(loText, { 'CATATAN BIDAN': 'ບັນທຶກຜະດຸງຄັນ', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'ໃຫ້ແນ່ໃຈວ່າມີສະຕັອກ Metildopa ສຳລັບອາທິດໜ້າ.', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'ຕິດຕາມສະຖານະຄຳຂໍ ແລະ ການສົ່ງຢາໄປສູນສຸຂະພາບຂອງທ່ານ', All: 'ທັງໝົດ', Issue: 'ບັນຫາ', 'Awaiting Approval': 'ລໍຖ້າອະນຸມັດ', Approved: 'ອະນຸມັດແລ້ວ', 'Dalam Pengiriman': 'ກຳລັງສົ່ງ', 'pengiriman aktif': 'ການສົ່ງທີ່ໃຊ້ງານ', 'Menunggu Persetujuan IFK': 'ລໍຖ້າ IFK ອະນຸມັດ', 'Approved by IFK': 'ອະນຸມັດໂດຍ IFK', 'In Transit': 'ກຳລັງຂົນສົ່ງ', 'Pengiriman sedang berjalan.': 'ການສົ່ງກຳລັງດຳເນີນ.', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'ຢືນຢັນຫຼັງຈາກໄດ້ຮັບຢາແລ້ວເທົ່ານັ້ນ.', 'Konfirmasi Diterima': 'ຢືນຢັນຮັບແລ້ວ', 'Lokasi Pengiriman Aktif': 'ຕຳແໜ່ງການສົ່ງທີ່ໃຊ້ງານ', 'Tidak ada pengiriman aktif saat ini.': 'ຕອນນີ້ບໍ່ມີການສົ່ງທີ່ໃຊ້ງານ.', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'ຕຳແໜ່ງຈະສະແດງເມື່ອ IFK ສົ່ງຊຸດຢາໄປສູນສຸຂະພາບ.', 'Tingkat Penyelesaian Pengiriman': 'ອັດຕາສຳເລັດການສົ່ງ', 'Durasi Rata-rata': 'ໄລຍະເວລາສະເລ່ຍ', 'Total Item': 'ລາຍການທັງໝົດ', Unit: 'ໜ່ວຍ', 'In báo cáo': 'ພິມລາຍງານ' });

const myText = localeMap({ Home: 'ပင်မ', Dashboard: 'ဒက်ရှ်ဘုတ်', Distribution: 'ဖြန့်ဖြူးမှု', 'Clinic List': 'ဆေးခန်းစာရင်း', 'Environment Monitoring': 'ပတ်ဝန်းကျင်စောင့်ကြည့်မှု', 'Medicine Sender': 'ဆေးပို့ခြင်း', Map: 'မြေပုံ', Satellite: 'ဂြိုဟ်တု', Supply: 'ထောက်ပံ့မှု', Timestamp: 'အချိန်', Entity: 'အဖွဲ့အစည်း', Operator: 'လုပ်ဆောင်သူ', Status: 'အခြေအနေ', 'All Clinics': 'ဆေးခန်းအားလုံး', 'Export CSV': 'CSV ထုတ်ရန်', 'Add Clinic': 'ဆေးခန်းထည့်ရန်', 'Clinic Name': 'ဆေးခန်းအမည်', Location: 'တည်နေရာ', 'Risk Level': 'အန္တရာယ်အဆင့်', Action: 'လုပ်ဆောင်ချက်', Filter: 'စစ်ထုတ်ရန်', Stock: 'လက်ကျန်', Needs: 'လိုအပ်ချက်', Sort: 'စီရန်', 'Medical Record': 'ဆေးမှတ်တမ်း', 'Personal Info': 'ကိုယ်ရေးအချက်အလက်', 'Active Pregnancy': 'လက်ရှိကိုယ်ဝန်', 'Gestational Age': 'ကိုယ်ဝန်အသက်', 'Due Date': 'မွေးဖွားခန့်မှန်းနေ့', Queue: 'တန်းစီ', 'Edit Patient': 'လူနာပြင်ရန်', Allergy: 'အာလက်ဂျီ', 'Blood Pressure': 'သွေးပေါင်ချိန်', Temperature: 'အပူချိန်', 'Full Name': 'အမည်အပြည့်အစုံ', Address: 'လိပ်စာ', Phone: 'ဖုန်း', 'Medicine Shipping': 'ဆေးပို့ခြင်း', Reason: 'အကြောင်းပြချက်', Courier: 'ပို့ဆောင်သူ', Origin: 'မူလနေရာ', Destination: 'သွားမည့်နေရာ', Distance: 'အကွာအဝေး', Critical: 'အရေးကြီး', Refresh: 'ပြန်ဖွင့်ရန်', Approve: 'အတည်ပြုရန်', Track: 'ခြေရာခံရန်', Reject: 'ငြင်းပယ်ရန်', Cancel: 'မလုပ်တော့ပါ', Close: 'ပိတ်ရန်', Delete: 'ဖျက်ရန်', Medicine: 'ဆေး', Quantity: 'အရေအတွက်' });
Object.assign(myText, { 'Prediksi Hari Ini': 'ယနေ့ ခန့်မှန်းချက်', 'Belum ada prediksi': 'ခန့်မှန်းချက် မရှိသေးပါ', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'ဒေတာသည် မွေးဖွားခန့်မှန်းနေ့၊ ANC နှင့် အသုံးပြုနေသော လူနာအန္တရာယ်မှ ပြသမည်.' });
Object.assign(myText, { 'CATATAN BIDAN': 'သားဖွားမှတ်ချက်', 'Pastikan stok Metildopa tersedia untuk pekan depan.': 'နောက်အပတ်အတွက် Metildopa လက်ကျန်ရှိကြောင်း သေချာပါစေ။', 'Pantau status permintaan dan pengiriman obat ke puskesmas Anda': 'သင့်ကျန်းမာရေးဌာနသို့ ဆေးတောင်းဆိုမှုနှင့် ပို့ဆောင်မှုအခြေအနေကို စောင့်ကြည့်ပါ', All: 'အားလုံး', Issue: 'ပြဿနာ', 'Awaiting Approval': 'အတည်ပြုရန်စောင့်နေ', Approved: 'အတည်ပြုပြီး', 'Dalam Pengiriman': 'ပို့ဆောင်နေ', 'pengiriman aktif': 'အသုံးပြုနေသော ပို့ဆောင်မှု', 'Menunggu Persetujuan IFK': 'IFK အတည်ပြုရန် စောင့်နေ', 'Approved by IFK': 'IFK မှ အတည်ပြုပြီး', 'In Transit': 'သယ်ယူပို့ဆောင်နေ', 'Pengiriman sedang berjalan.': 'ပို့ဆောင်မှု ဆောင်ရွက်နေသည်။', 'Konfirmasi hanya setelah obat diterima secara fisik.': 'ဆေးကို လက်တွေ့လက်ခံပြီးမှသာ အတည်ပြုပါ။', 'Konfirmasi Diterima': 'လက်ခံပြီး အတည်ပြုရန်', 'Lokasi Pengiriman Aktif': 'အသုံးပြုနေသော ပို့ဆောင်မှုတည်နေရာ', 'Tidak ada pengiriman aktif saat ini.': 'ယခု အသုံးပြုနေသော ပို့ဆောင်မှု မရှိပါ။', 'Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.': 'IFK မှ ဆေးပက်ကေ့ချ်ပို့ပြီးပါက တည်နေရာပြပါမည်။', 'Tingkat Penyelesaian Pengiriman': 'ပို့ဆောင်မှုပြီးစီးနှုန်း', 'Durasi Rata-rata': 'ပျမ်းမျှကြာချိန်', 'Total Item': 'စုစုပေါင်းပစ္စည်း', Unit: 'ယူနစ်', 'In báo cáo': 'အစီရင်ခံစာ ပုံနှိပ်ရန်' });

const zhText = localeMap({ Home: '首页', Dashboard: '仪表盘', Distribution: '配送', 'Clinic List': '诊所列表', 'Environment Monitoring': '环境监测', 'Medicine Sender': '药品配送', Map: '地图', Satellite: '卫星', Supply: '供应', Timestamp: '时间', Entity: '实体', Operator: '操作员', Status: '状态', 'All Clinics': '全部诊所', 'Export CSV': '导出 CSV', 'Add Clinic': '添加诊所', 'Clinic Name': '诊所名称', Location: '位置', 'Risk Level': '风险等级', Action: '操作', Filter: '筛选', Stock: '库存', Needs: '需求', Sort: '排序', 'Medical Record': '病历', 'Personal Info': '个人信息', 'Active Pregnancy': '当前妊娠', 'Gestational Age': '孕周', 'Due Date': '预产期', Queue: '队列', 'Edit Patient': '编辑患者', Allergy: '过敏', 'Blood Pressure': '血压', Temperature: '体温', 'Full Name': '全名', Address: '地址', Phone: '电话', 'Medicine Shipping': '药品配送', Reason: '原因', Courier: '快递员', Origin: '起点', Destination: '目的地', Distance: '距离', Critical: '严重', Refresh: '刷新', Approve: '批准', Track: '跟踪', Reject: '拒绝', Cancel: '取消', Close: '关闭', Delete: '删除', Medicine: '药品', Quantity: '数量' });
Object.assign(zhText, { 'Prediksi Hari Ini': '今日预测', 'Belum ada prediksi': '暂无预测', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': '数据将来自预产期、ANC 和活跃患者风险。' });

const taText = localeMap({ Home: 'முகப்பு', Dashboard: 'டாஷ்போர்டு', Distribution: 'விநியோகம்', 'Clinic List': 'மருத்துவமனை பட்டியல்', 'Environment Monitoring': 'சூழல் கண்காணிப்பு', 'Medicine Sender': 'மருந்து அனுப்புதல்', Map: 'வரைபடம்', Satellite: 'செயற்கைக்கோள்', Supply: 'வழங்கல்', Timestamp: 'நேரம்', Entity: 'அலகு', Operator: 'இயக்குநர்', Status: 'நிலை', 'All Clinics': 'அனைத்து மருத்துவமனைகள்', 'Export CSV': 'CSV ஏற்றுமதி', 'Add Clinic': 'மருத்துவமனை சேர்', 'Clinic Name': 'மருத்துவமனை பெயர்', Location: 'இடம்', 'Risk Level': 'அபாய நிலை', Action: 'செயல்', Filter: 'வடிகட்டி', Stock: 'கையிருப்பு', Needs: 'தேவை', Sort: 'வரிசைப்படுத்து', 'Medical Record': 'மருத்துவ பதிவு', 'Personal Info': 'தனிப்பட்ட தகவல்', 'Active Pregnancy': 'செயலில் உள்ள கர்ப்பம்', 'Gestational Age': 'கர்ப்ப வயது', 'Due Date': 'பிரசவ தேதி', Queue: 'வரிசை', 'Edit Patient': 'நோயாளியை திருத்து', Allergy: 'ஒவ்வாமை', 'Blood Pressure': 'இரத்த அழுத்தம்', Temperature: 'வெப்பநிலை', 'Full Name': 'முழு பெயர்', Address: 'முகவரி', Phone: 'தொலைபேசி', 'Medicine Shipping': 'மருந்து அனுப்புதல்', Reason: 'காரணம்', Courier: 'கூரியர்', Origin: 'தொடக்கம்', Destination: 'இலக்கு', Distance: 'தூரம்', Critical: 'அவசரம்', Refresh: 'புதுப்பி', Approve: 'ஒப்புதல்', Track: 'கண்காணி', Reject: 'நிராகரி', Cancel: 'ரத்து', Close: 'மூடு', Delete: 'நீக்கு', Medicine: 'மருந்து', Quantity: 'அளவு' });
Object.assign(taText, { 'Prediksi Hari Ini': 'இன்றைய கணிப்பு', 'Belum ada prediksi': 'இன்னும் கணிப்பு இல்லை', 'Data muncul dari HPL, ANC, dan risiko pasien aktif.': 'தரவு பிரசவ தேதி, ANC மற்றும் செயலில் உள்ள நோயாளர் அபாயத்திலிருந்து தோன்றும்.' });

Object.assign(msText, {
  'Total Facilities': 'Jumlah Fasiliti', 'Critical (Stockout)': 'Kritikal (Stok Habis)', Generated: 'Dijana', 'Head of Clinic': 'Ketua Klinik', 'Confirmation Status': 'Status Pengesahan', 'Cold Chain Facilities': 'Fasiliti Rantaian Sejuk', Ready: 'Sedia', Gap: 'Jurang', 'Endemic Status': 'Status Endemik', 'Last Update:': 'Kemas Kini Terakhir:', 'Distribution items:': 'Item pengedaran:', 'Active pregnancy count:': 'Jumlah kehamilan aktif:', 'Recommendation source:': 'Sumber cadangan:', 'Lead time:': 'Masa utama:', 'distance to IFK:': 'jarak ke IFK:', 'Urgency Score': 'Skor Kecemasan', 'Equity Priority': 'Keutamaan Kesaksamaan', 'AI Source': 'Sumber AI', Unavailable: 'Tidak tersedia', 'Hosted AI': 'AI Dihoskan', 'Demo seed': 'Data demo', 'Rule fallback': 'Sandaran aturan', Safe: 'Selamat', critical: 'kritikal', Days: 'Hari', 'Stockouts Prevented': 'Stok Habis Dicegah', 'Loaded from decisions': 'Dimuat daripada keputusan', 'Approved Decisions': 'Keputusan Diluluskan', 'IFK recommendations': 'Cadangan IFK', 'Total Dispatches': 'Jumlah Penghantaran', 'Distribution records': 'Rekod pengedaran', 'Showing entries': 'Memaparkan entri', 'Showing {from}-{to} of {total} health facilities': 'Memaparkan {from}-{to} daripada {total} fasiliti kesihatan', 'Requested {value}': 'Diminta {value}', 'Expand {value} details': 'Buka butiran {value}', 'Collapse {value} details': 'Tutup butiran {value}', min: 'minit', hours: 'jam'
});
Object.assign(filText, {
  'Total Facilities': 'Kabuuang Pasilidad', 'Critical (Stockout)': 'Kritikal (Walang Stock)', Generated: 'Nabuo', 'Head of Clinic': 'Pinuno ng Klinika', 'Confirmation Status': 'Katayuan ng Kumpirmasyon', 'Cold Chain Facilities': 'Cold Chain na Pasilidad', Ready: 'Handa', Gap: 'Kulang', 'Endemic Status': 'Endemic na Katayuan', 'Last Update:': 'Huling Update:', 'Distribution items:': 'Mga item sa distribusyon:', 'Active pregnancy count:': 'Bilang ng aktibong pagbubuntis:', 'Recommendation source:': 'Pinagmulan ng rekomendasyon:', 'Lead time:': 'Lead time:', 'distance to IFK:': 'distansya sa IFK:', 'Urgency Score': 'Iskor ng Urhensiya', 'Equity Priority': 'Prayoridad sa Pantay na Akses', 'AI Source': 'Pinagmulan ng AI', Unavailable: 'Hindi available', 'Hosted AI': 'Hosted AI', 'Demo seed': 'Demo data', 'Rule fallback': 'Rule fallback', Safe: 'Ligtas', critical: 'kritikal', Days: 'Araw', 'Stockouts Prevented': 'Naagapang Stockout', 'Loaded from decisions': 'Na-load mula sa mga desisyon', 'Approved Decisions': 'Naaprubahang Desisyon', 'IFK recommendations': 'Mga rekomendasyon ng IFK', 'Total Dispatches': 'Kabuuang Padala', 'Distribution records': 'Mga rekord ng distribusyon', 'Showing entries': 'Ipinapakita ang entries', 'Showing {from}-{to} of {total} health facilities': 'Ipinapakita ang {from}-{to} sa {total} health facilities', 'Requested {value}': 'Hiniling {value}', 'Expand {value} details': 'Buksan ang detalye ng {value}', 'Collapse {value} details': 'Isara ang detalye ng {value}', min: 'min', hours: 'oras'
});
Object.assign(thText, {
  'Total Facilities': 'จำนวนสถานพยาบาลทั้งหมด', 'Critical (Stockout)': 'วิกฤต (สินค้าหมด)', Generated: 'สร้างเมื่อ', 'Head of Clinic': 'หัวหน้าคลินิก', 'Confirmation Status': 'สถานะการยืนยัน', 'Cold Chain Facilities': 'สถานที่ Cold Chain', Ready: 'พร้อม', Gap: 'ยังขาด', 'Endemic Status': 'สถานะโรคประจำถิ่น', 'Last Update:': 'อัปเดตล่าสุด:', 'Distribution items:': 'รายการกระจาย:', 'Active pregnancy count:': 'จำนวนครรภ์ที่ใช้งาน:', 'Recommendation source:': 'แหล่งคำแนะนำ:', 'Lead time:': 'เวลานำ:', 'distance to IFK:': 'ระยะทางถึง IFK:', 'Urgency Score': 'คะแนนเร่งด่วน', 'Equity Priority': 'ลำดับความเท่าเทียม', 'AI Source': 'แหล่ง AI', Unavailable: 'ไม่พร้อมใช้งาน', 'Hosted AI': 'AI ที่โฮสต์', 'Demo seed': 'ข้อมูลสาธิต', 'Rule fallback': 'กฎสำรอง', Safe: 'ปลอดภัย', critical: 'วิกฤต', Days: 'วัน', 'Stockouts Prevented': 'ป้องกันสินค้าหมด', 'Loaded from decisions': 'โหลดจากการตัดสินใจ', 'Approved Decisions': 'การตัดสินใจที่อนุมัติ', 'IFK recommendations': 'คำแนะนำ IFK', 'Total Dispatches': 'การจัดส่งทั้งหมด', 'Distribution records': 'บันทึกการกระจาย', 'Showing entries': 'แสดงรายการ', 'Showing {from}-{to} of {total} health facilities': 'แสดง {from}-{to} จาก {total} สถานพยาบาล', 'Requested {value}': 'ร้องขอ {value}', 'Expand {value} details': 'ขยายรายละเอียด {value}', 'Collapse {value} details': 'ยุบรายละเอียด {value}', min: 'นาที', hours: 'ชั่วโมง'
});
Object.assign(viText, {
  'Total Facilities': 'Tổng cơ sở', 'Critical (Stockout)': 'Nguy cấp (hết hàng)', Generated: 'Đã tạo', 'Head of Clinic': 'Trưởng phòng khám', 'Confirmation Status': 'Trạng thái xác nhận', 'Cold Chain Facilities': 'Cơ sở dây chuyền lạnh', Ready: 'Sẵn sàng', Gap: 'Thiếu', 'Endemic Status': 'Trạng thái lưu hành', 'Last Update:': 'Cập nhật cuối:', 'Distribution items:': 'Mặt hàng phân phối:', 'Active pregnancy count:': 'Số thai kỳ đang theo dõi:', 'Recommendation source:': 'Nguồn khuyến nghị:', 'Lead time:': 'Thời gian xử lý:', 'distance to IFK:': 'khoảng cách tới IFK:', 'Urgency Score': 'Điểm khẩn cấp', 'Equity Priority': 'Ưu tiên công bằng', 'AI Source': 'Nguồn AI', Unavailable: 'Không khả dụng', 'Hosted AI': 'AI lưu trữ', 'Demo seed': 'Dữ liệu demo', 'Rule fallback': 'Quy tắc dự phòng', Safe: 'An toàn', critical: 'nguy cấp', Days: 'Ngày', 'Stockouts Prevented': 'Đã ngăn hết hàng', 'Loaded from decisions': 'Tải từ quyết định', 'Approved Decisions': 'Quyết định đã duyệt', 'IFK recommendations': 'Khuyến nghị IFK', 'Total Dispatches': 'Tổng lượt gửi', 'Distribution records': 'Hồ sơ phân phối', 'Showing entries': 'Đang hiển thị mục', 'Showing {from}-{to} of {total} health facilities': 'Hiển thị {from}-{to} trong {total} cơ sở y tế', 'Requested {value}': 'Đã yêu cầu {value}', 'Expand {value} details': 'Mở chi tiết {value}', 'Collapse {value} details': 'Thu gọn chi tiết {value}', min: 'phút', hours: 'giờ'
});

Object.assign(msText, { 'Health Centers': 'Pusat Kesihatan', 'User Accounts': 'Akaun Pengguna', 'Medicine List': 'Senarai Ubat', 'Facility Profiles': 'Profil Fasiliti', 'Patient Queue': 'Baris Gilir Pesakit', 'Prediction Calendar': 'Kalendar Ramalan', 'Medicine Needs': 'Keperluan Ubat', 'IFK Dashboard': 'Papan Pemuka IFK', Recommendations: 'Cadangan', Clinics: 'Klinik', Environment: 'Persekitaran', Delivering: 'Penghantaran', 'Digital Sanctuary': 'Sanctuary Digital', Users: 'Pengguna', 'Save Changes': 'Simpan Perubahan', 'Approve & Dispatch': 'Luluskan & Hantar', '{value} active filter': '{value} penapis aktif', records: 'rekod', EXAMINING: 'SEDANG DIPERIKSA' });
Object.assign(filText, { 'Health Centers': 'Mga Health Center', 'User Accounts': 'Mga Account ng User', 'Medicine List': 'Listahan ng Gamot', 'Facility Profiles': 'Mga Profile ng Pasilidad', 'Patient Queue': 'Pila ng Pasyente', 'Prediction Calendar': 'Kalendaryo ng Prediksyon', 'Medicine Needs': 'Pangangailangan sa Gamot', 'IFK Dashboard': 'Dashboard ng IFK', Recommendations: 'Mga Rekomendasyon', Clinics: 'Mga Klinika', Environment: 'Kapaligiran', Delivering: 'Paghahatid', 'Digital Sanctuary': 'Digital Sanctuary', Users: 'Mga User', 'Save Changes': 'I-save ang Mga Pagbabago', 'Approve & Dispatch': 'Aprubahan at Ipadala', '{value} active filter': '{value} aktibong filter', records: 'rekord', EXAMINING: 'SINUSURI' });
Object.assign(thText, { 'Health Centers': 'ศูนย์สุขภาพ', 'User Accounts': 'บัญชีผู้ใช้', 'Medicine List': 'รายการยา', 'Facility Profiles': 'โปรไฟล์สถานพยาบาล', 'Patient Queue': 'คิวผู้ป่วย', 'Prediction Calendar': 'ปฏิทินพยากรณ์', 'Medicine Needs': 'ความต้องการยา', 'IFK Dashboard': 'แดชบอร์ด IFK', Recommendations: 'คำแนะนำ', Clinics: 'คลินิก', Environment: 'สิ่งแวดล้อม', Delivering: 'กำลังจัดส่ง', 'Digital Sanctuary': 'Digital Sanctuary', Users: 'ผู้ใช้', 'Save Changes': 'บันทึกการเปลี่ยนแปลง', 'Approve & Dispatch': 'อนุมัติและจัดส่ง', '{value} active filter': 'ตัวกรองที่ใช้งาน {value} รายการ', records: 'รายการ', EXAMINING: 'กำลังตรวจ' });
Object.assign(viText, { 'Health Centers': 'Trung tâm y tế', 'User Accounts': 'Tài khoản người dùng', 'Medicine List': 'Danh sách thuốc', 'Facility Profiles': 'Hồ sơ cơ sở', 'Patient Queue': 'Hàng đợi bệnh nhân', 'Prediction Calendar': 'Lịch dự báo', 'Medicine Needs': 'Nhu cầu thuốc', 'IFK Dashboard': 'Bảng điều khiển IFK', Recommendations: 'Khuyến nghị', Clinics: 'Phòng khám', Environment: 'Môi trường', Delivering: 'Đang giao', 'Digital Sanctuary': 'Trung tâm số', Users: 'Người dùng', 'Save Changes': 'Lưu thay đổi', 'Approve & Dispatch': 'Duyệt và gửi', '{value} active filter': '{value} bộ lọc đang bật', records: 'bản ghi', EXAMINING: 'ĐANG KHÁM' });
Object.assign(msText, { 'Persalinan Bulan Ini': 'Kelahiran Bulan Ini', 'Kunjungan ANC': 'Lawatan ANC', 'Pasien Risiko Tinggi': 'Pesakit Berisiko Tinggi', 'ANC Kit': 'Kit ANC', 'Persalinan Kit': 'Kit Kelahiran', 'Buffer Darurat': 'Penimbal Kecemasan', Cukup: 'Mencukupi', 'Perlu Restok': 'Perlu Stok Semula', 'Hampir Habis': 'Hampir Habis', 'Kebutuhan: {value} {unit}': 'Keperluan: {value} {unit}', 'Personal Data': 'Data Peribadi', 'Pregnancy Data': 'Data Kehamilan', 'Screening & Risk': 'Saringan & Risiko', 'No symptoms above': 'Tiada gejala di atas', 'Severe headache': 'Sakit kepala teruk', Bleeding: 'Pendarahan', 'Severe vomiting': 'Muntah teruk', 'Severe abdominal pain': 'Sakit perut teruk', 'Decreased fetal movement': 'Pergerakan janin berkurang', Hypertension: 'Hipertensi', Anemia: 'Anemia', 'Gestational DM': 'DM Gestasi', Preeclampsia: 'Praeklampsia', Complications: 'Komplikasi', 'History of C-section': 'Sejarah pembedahan C-section', 'Gap < 2 Yrs': 'Jarak < 2 Tahun', Infection: 'Jangkitan' });
Object.assign(filText, { 'Persalinan Bulan Ini': 'Panganganak Ngayong Buwan', 'Kunjungan ANC': 'Mga ANC Visit', 'Pasien Risiko Tinggi': 'High-risk na Pasyente', 'ANC Kit': 'ANC Kit', 'Persalinan Kit': 'Delivery Kit', 'Buffer Darurat': 'Emergency Buffer', Cukup: 'Sapat', 'Perlu Restok': 'Kailangang Mag-restock', 'Hampir Habis': 'Malapit Maubos', 'Kebutuhan: {value} {unit}': 'Kailangan: {value} {unit}', 'Personal Data': 'Personal na Data', 'Pregnancy Data': 'Data ng Pagbubuntis', 'Screening & Risk': 'Screening at Panganib', 'No symptoms above': 'Wala sa mga sintomas sa itaas', 'Severe headache': 'Matinding sakit ng ulo', Bleeding: 'Pagdurugo', 'Severe vomiting': 'Matinding pagsusuka', 'Severe abdominal pain': 'Matinding pananakit ng tiyan', 'Decreased fetal movement': 'Nabawasan ang galaw ng sanggol', Hypertension: 'Altapresyon', Anemia: 'Anemia', 'Gestational DM': 'Gestational DM', Preeclampsia: 'Preeclampsia', Complications: 'Komplikasyon', 'History of C-section': 'Kasaysayan ng C-section', 'Gap < 2 Yrs': 'Agwat < 2 Taon', Infection: 'Impeksiyon' });
Object.assign(thText, { 'Persalinan Bulan Ini': 'การคลอดเดือนนี้', 'Kunjungan ANC': 'การตรวจ ANC', 'Pasien Risiko Tinggi': 'ผู้ป่วยความเสี่ยงสูง', 'ANC Kit': 'ชุด ANC', 'Persalinan Kit': 'ชุดคลอด', 'Buffer Darurat': 'สำรองฉุกเฉิน', Cukup: 'เพียงพอ', 'Perlu Restok': 'ต้องเติมสต็อก', 'Hampir Habis': 'ใกล้หมด', 'Kebutuhan: {value} {unit}': 'ต้องการ: {value} {unit}', 'Personal Data': 'ข้อมูลส่วนตัว', 'Pregnancy Data': 'ข้อมูลการตั้งครรภ์', 'Screening & Risk': 'คัดกรองและความเสี่ยง', 'No symptoms above': 'ไม่มีอาการข้างต้น', 'Severe headache': 'ปวดศีรษะรุนแรง', Bleeding: 'เลือดออก', 'Severe vomiting': 'อาเจียนรุนแรง', 'Severe abdominal pain': 'ปวดท้องรุนแรง', 'Decreased fetal movement': 'ทารกเคลื่อนไหวน้อยลง', Hypertension: 'ความดันโลหิตสูง', Anemia: 'โลหิตจาง', 'Gestational DM': 'เบาหวานขณะตั้งครรภ์', Preeclampsia: 'ครรภ์เป็นพิษ', Complications: 'ภาวะแทรกซ้อน', 'History of C-section': 'ประวัติผ่าคลอด', 'Gap < 2 Yrs': 'ช่วงห่าง < 2 ปี', Infection: 'การติดเชื้อ' });
Object.assign(viText, { 'Persalinan Bulan Ini': 'Sinh trong tháng này', 'Kunjungan ANC': 'Lượt khám ANC', 'Pasien Risiko Tinggi': 'Bệnh nhân nguy cơ cao', 'ANC Kit': 'Bộ ANC', 'Persalinan Kit': 'Bộ sinh', 'Buffer Darurat': 'Dự phòng khẩn cấp', Cukup: 'Đủ', 'Perlu Restok': 'Cần bổ sung', 'Hampir Habis': 'Sắp hết', 'Kebutuhan: {value} {unit}': 'Nhu cầu: {value} {unit}', 'Personal Data': 'Dữ liệu cá nhân', 'Pregnancy Data': 'Dữ liệu thai kỳ', 'Screening & Risk': 'Sàng lọc & nguy cơ', 'No symptoms above': 'Không có triệu chứng trên', 'Severe headache': 'Đau đầu dữ dội', Bleeding: 'Chảy máu', 'Severe vomiting': 'Nôn dữ dội', 'Severe abdominal pain': 'Đau bụng dữ dội', 'Decreased fetal movement': 'Thai máy giảm', Hypertension: 'Tăng huyết áp', Anemia: 'Thiếu máu', 'Gestational DM': 'Đái tháo đường thai kỳ', Preeclampsia: 'Tiền sản giật', Complications: 'Biến chứng', 'History of C-section': 'Tiền sử mổ lấy thai', 'Gap < 2 Yrs': 'Khoảng cách < 2 năm', Infection: 'Nhiễm trùng' });

for (const map of [kmText, loText, myText, zhText, taText]) {
  Object.assign(map, Object.fromEntries(Object.entries(idText).filter(([key]) => !(key in map))));
}

const localeTexts: Record<string, Record<string, string>> = { en: enText, id: idText, ms: msText, fil: filText, th: thText, vi: viText, km: kmText, lo: loText, my: myText, zh: zhText, ta: taText };

function normalize(value: string) {
  return value.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function translateText(value: string, translations: Record<string, string>) {
  const normalized = normalize(value);
  const translated = translations[normalized] ?? translatePattern(normalized, translations);
  if (!translated) return null;
  const prefix = value.match(/^\s*/)?.[0] ?? '';
  const suffix = value.match(/\s*$/)?.[0] ?? '';
  return `${prefix}${translated}${suffix}`;
}

function formatTemplate(translations: Record<string, string>, key: string, values: Record<string, string>) {
  return (translations[key] ?? idText[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? '');
}

function translatePattern(value: string, translations: Record<string, string>) {
  let match = value.match(/^Showing (\d+)-(\d+) of (\d+) health facilities$/);
  if (match) return formatTemplate(translations, 'Showing {from}-{to} of {total} health facilities', { from: match[1], to: match[2], total: match[3] });
  match = value.match(/^Requested (.+)$/);
  if (match) return formatTemplate(translations, 'Requested {value}', { value: match[1] });
  match = value.match(/^Expand (.+) details$/);
  if (match) return formatTemplate(translations, 'Expand {value} details', { value: match[1] });
  match = value.match(/^Collapse (.+) details$/);
  if (match) return formatTemplate(translations, 'Collapse {value} details', { value: match[1] });
  match = value.match(/^(\d+) active filter$/);
  if (match) return formatTemplate(translations, '{value} active filter', { value: match[1] });
  match = value.match(/^Rank #(\d+) = first delivery$/);
  if (match) return formatTemplate(translations, 'Rank #{value} = first delivery', { value: match[1] });
  match = value.match(/^Examination History (\(.+\))$/);
  if (match) return formatTemplate(translations, 'Examination History {value}', { value: match[1] });
  match = value.match(/^(Reducing|Increasing|Maintaining) (.+): (\d+) to (\d+) (.+)$/);
  if (match) return formatTemplate(translations, '{action} {name}: {from} to {to} {unit}', { action: translations[match[1]] ?? match[1], name: match[2], from: match[3], to: match[4], unit: match[5] });
  match = value.match(/^Kebutuhan: (\d+) (.+)$/);
  if (match) return formatTemplate(translations, 'Kebutuhan: {value} {unit}', { value: match[1], unit: translations[match[2]] ?? match[2] });
  return null;
}

function localizeNode(root: ParentNode, translations: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    const translated = translateText(node.nodeValue ?? '', translations);
    if (translated) node.nodeValue = translated;
  }
  for (const element of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    for (const attr of attrs) {
      const value = element.getAttribute(attr);
      const translated = value ? translateText(value, translations) : null;
      if (translated) element.setAttribute(attr, translated);
    }
  }
}

export function DomLocalizer() {
  const locale = useLocale();
  const translations = useMemo(() => localeTexts[locale] ?? enText, [locale]);
  useEffect(() => {
    localizeNode(document.body, translations);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) localizeNode(node as Element, translations);
          if (node.nodeType === Node.TEXT_NODE) {
            const translated = translateText(node.nodeValue ?? '', translations);
            if (translated) node.nodeValue = translated;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [translations]);
  return null;
}
