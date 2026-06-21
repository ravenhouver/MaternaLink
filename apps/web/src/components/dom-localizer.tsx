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

const filText = localeMap({ Home: 'Home', Dashboard: 'Dashboard', Distribution: 'Distribusyon', 'Clinic List': 'Listahan ng Klinika', 'Environment Monitoring': 'Pagsubaybay sa Kapaligiran', 'Medicine Sender': 'Pagpapadala ng Gamot', Map: 'Mapa', Satellite: 'Satellite', Supply: 'Suplay', Timestamp: 'Oras', Entity: 'Entity', Operator: 'Operator', Status: 'Katayuan', 'All Clinics': 'Lahat ng Klinika', 'Export CSV': 'I-export CSV', 'Add Clinic': 'Magdagdag ng Klinika', 'Clinic Name': 'Pangalan ng Klinika', Location: 'Lokasyon', 'Critical Stock': 'Kritikal na Stock', 'Risk Level': 'Antas ng Panganib', Action: 'Aksyon', Filter: 'Filter', Registry: 'Registry', 'Medication Name': 'Pangalan ng Gamot', Stock: 'Stock', Needs: 'Pangangailangan', 'Days Remaining': 'Natitirang Araw', Sort: 'Ayusin', 'Medicine Delivery Report': 'Ulat sa Paghahatid ng Gamot', 'Medical Record': 'Rekord Medikal', 'Personal Info': 'Personal na Impormasyon', 'Active Pregnancy': 'Aktibong Pagbubuntis', 'Gestational Age': 'Edad ng Pagbubuntis', 'Due Date': 'Takdang Petsa', Queue: 'Pila', 'Edit Patient': 'I-edit ang Pasyente', 'Routine Medication': 'Regular na Gamot', 'Blood Type': 'Uri ng Dugo', Allergy: 'Alerhiya', 'Chief Complaint': 'Pangunahing Reklamo', 'Vital Signs': 'Vital Signs', 'Blood Pressure': 'Presyon ng Dugo', Temperature: 'Temperatura', 'Heart Rate': 'Tibok ng Puso', 'Full Name': 'Buong Pangalan', Address: 'Address', Phone: 'Telepono', Relationship: 'Relasyon', 'Medicine Shipping': 'Pagpapadala ng Gamot', 'Shipment filters': 'Mga filter ng padala', 'Medicine shipments': 'Mga padala ng gamot', 'Average Duration': 'Karaniwang Tagal', 'Total Items': 'Kabuuang Item', Reason: 'Dahilan', 'Re-request': 'Humiling muli', Courier: 'Courier', Origin: 'Pinagmulan', Destination: 'Destinasyon', Distance: 'Distansya', Critical: 'Kritikal', Refresh: 'I-refresh', Approve: 'Aprubahan', Track: 'Subaybayan', Reject: 'Tanggihan', Cancel: 'Kanselahin', Close: 'Isara', Delete: 'Tanggalin', 'Saving...': 'Sine-save...', Requested: 'Hiniling', Received: 'Natanggap', Rejected: 'Tinanggihan', 'Print Report': 'I-print ang Ulat', Medicine: 'Gamot', Quantity: 'Dami' });

const thText = localeMap({ Home: 'หน้าหลัก', Dashboard: 'แดชบอร์ด', Distribution: 'การกระจาย', 'Clinic List': 'รายชื่อคลินิก', 'Environment Monitoring': 'ติดตามสิ่งแวดล้อม', 'Medicine Sender': 'จัดส่งยา', Map: 'แผนที่', Satellite: 'ดาวเทียม', Supply: 'เวชภัณฑ์', Timestamp: 'เวลา', Entity: 'หน่วยงาน', Operator: 'ผู้ดำเนินการ', Status: 'สถานะ', 'All Clinics': 'ทุกคลินิก', 'Export CSV': 'ส่งออก CSV', 'Add Clinic': 'เพิ่มคลินิก', 'Clinic Name': 'ชื่อคลินิก', Location: 'ที่ตั้ง', 'Critical Stock': 'สต็อกวิกฤต', 'Risk Level': 'ระดับความเสี่ยง', Action: 'การดำเนินการ', Filter: 'ตัวกรอง', Registry: 'ทะเบียน', 'Medication Name': 'ชื่อยา', Stock: 'สต็อก', Needs: 'ความต้องการ', 'Days Remaining': 'วันที่เหลือ', Sort: 'เรียงลำดับ', 'Medicine Delivery Report': 'รายงานจัดส่งยา', 'Medical Record': 'เวชระเบียน', 'Personal Info': 'ข้อมูลส่วนตัว', 'Active Pregnancy': 'การตั้งครรภ์ปัจจุบัน', 'Gestational Age': 'อายุครรภ์', 'Due Date': 'กำหนดคลอด', Queue: 'คิว', 'Edit Patient': 'แก้ไขผู้ป่วย', 'Routine Medication': 'ยาประจำ', 'Blood Type': 'กรุ๊ปเลือด', Allergy: 'ภูมิแพ้', 'Chief Complaint': 'อาการสำคัญ', 'Vital Signs': 'สัญญาณชีพ', 'Blood Pressure': 'ความดันโลหิต', Temperature: 'อุณหภูมิ', 'Heart Rate': 'ชีพจร', 'Full Name': 'ชื่อเต็ม', Address: 'ที่อยู่', Phone: 'โทรศัพท์', Relationship: 'ความสัมพันธ์', 'Medicine Shipping': 'การจัดส่งยา', 'Shipment filters': 'ตัวกรองการจัดส่ง', 'Medicine shipments': 'รายการจัดส่งยา', 'Average Duration': 'ระยะเวลาเฉลี่ย', 'Total Items': 'จำนวนทั้งหมด', Reason: 'เหตุผล', 'Re-request': 'ขออีกครั้ง', Courier: 'ผู้จัดส่ง', Origin: 'ต้นทาง', Destination: 'ปลายทาง', Distance: 'ระยะทาง', Critical: 'วิกฤต', Refresh: 'รีเฟรช', Approve: 'อนุมัติ', Track: 'ติดตาม', Reject: 'ปฏิเสธ', Cancel: 'ยกเลิก', Close: 'ปิด', Delete: 'ลบ', 'Saving...': 'กำลังบันทึก...', Requested: 'ร้องขอแล้ว', Received: 'ได้รับแล้ว', Rejected: 'ถูกปฏิเสธ', 'Print Report': 'พิมพ์รายงาน', Medicine: 'ยา', Quantity: 'จำนวน' });

const viText = localeMap({ Home: 'Trang chủ', Dashboard: 'Bảng điều khiển', Distribution: 'Phân phối', 'Clinic List': 'Danh sách phòng khám', 'Environment Monitoring': 'Giám sát môi trường', 'Medicine Sender': 'Gửi thuốc', Map: 'Bản đồ', Satellite: 'Vệ tinh', Supply: 'Nguồn cung', Timestamp: 'Thời gian', Entity: 'Đối tượng', Operator: 'Người vận hành', Status: 'Trạng thái', 'All Clinics': 'Tất cả phòng khám', 'Export CSV': 'Xuất CSV', 'Add Clinic': 'Thêm phòng khám', 'Clinic Name': 'Tên phòng khám', Location: 'Vị trí', 'Critical Stock': 'Tồn kho nguy cấp', 'Risk Level': 'Mức rủi ro', Action: 'Thao tác', Filter: 'Lọc', Registry: 'Sổ đăng ký', 'Medication Name': 'Tên thuốc', Stock: 'Tồn kho', Needs: 'Nhu cầu', 'Days Remaining': 'Số ngày còn lại', Sort: 'Sắp xếp', 'Medicine Delivery Report': 'Báo cáo giao thuốc', 'Medical Record': 'Hồ sơ y tế', 'Personal Info': 'Thông tin cá nhân', 'Active Pregnancy': 'Thai kỳ hiện tại', 'Gestational Age': 'Tuổi thai', 'Due Date': 'Ngày dự sinh', Queue: 'Hàng đợi', 'Edit Patient': 'Sửa bệnh nhân', 'Routine Medication': 'Thuốc định kỳ', 'Blood Type': 'Nhóm máu', Allergy: 'Dị ứng', 'Chief Complaint': 'Lý do khám chính', 'Vital Signs': 'Dấu hiệu sinh tồn', 'Blood Pressure': 'Huyết áp', Temperature: 'Nhiệt độ', 'Heart Rate': 'Nhịp tim', 'Full Name': 'Họ tên', Address: 'Địa chỉ', Phone: 'Điện thoại', Relationship: 'Quan hệ', 'Medicine Shipping': 'Giao thuốc', 'Shipment filters': 'Bộ lọc giao hàng', 'Medicine shipments': 'Các lô giao thuốc', 'Average Duration': 'Thời lượng trung bình', 'Total Items': 'Tổng mặt hàng', Reason: 'Lý do', 'Re-request': 'Yêu cầu lại', Courier: 'Đơn vị giao', Origin: 'Điểm đi', Destination: 'Điểm đến', Distance: 'Khoảng cách', Critical: 'Nguy cấp', Refresh: 'Làm mới', Approve: 'Phê duyệt', Track: 'Theo dõi', Reject: 'Từ chối', Cancel: 'Hủy', Close: 'Đóng', Delete: 'Xóa', 'Saving...': 'Đang lưu...', Requested: 'Đã yêu cầu', Received: 'Đã nhận', Rejected: 'Đã từ chối', 'Print Report': 'In báo cáo', Medicine: 'Thuốc', Quantity: 'Số lượng' });

const kmText = localeMap({ Home: 'ទំព័រដើម', Dashboard: 'ផ្ទាំងគ្រប់គ្រង', Distribution: 'ការចែកចាយ', 'Clinic List': 'បញ្ជីគ្លីនិក', 'Environment Monitoring': 'តាមដានបរិស្ថាន', 'Medicine Sender': 'ដឹកជញ្ជូនថ្នាំ', Map: 'ផែនទី', Satellite: 'ផ្កាយរណប', Supply: 'ការផ្គត់ផ្គង់', Timestamp: 'ពេលវេលា', Entity: 'អង្គភាព', Operator: 'ប្រតិបត្តិករ', Status: 'ស្ថានភាព', 'All Clinics': 'គ្លីនិកទាំងអស់', 'Export CSV': 'នាំចេញ CSV', 'Add Clinic': 'បន្ថែមគ្លីនិក', 'Clinic Name': 'ឈ្មោះគ្លីនិក', Location: 'ទីតាំង', 'Critical Stock': 'ស្តុកវិបត្តិ', 'Risk Level': 'កម្រិតហានិភ័យ', Action: 'សកម្មភាព', Filter: 'តម្រង', Registry: 'បញ្ជី', 'Medication Name': 'ឈ្មោះថ្នាំ', Stock: 'ស្តុក', Needs: 'តម្រូវការ', Sort: 'តម្រៀប', 'Medical Record': 'កំណត់ត្រាវេជ្ជសាស្រ្ត', 'Personal Info': 'ព័ត៌មានផ្ទាល់ខ្លួន', 'Active Pregnancy': 'ការមានផ្ទៃពោះសកម្ម', 'Gestational Age': 'អាយុគភ៌', 'Due Date': 'ថ្ងៃកំណត់សម្រាល', Queue: 'ជួរ', 'Edit Patient': 'កែអ្នកជំងឺ', 'Blood Type': 'ប្រភេទឈាម', Allergy: 'អាឡែស៊ី', 'Blood Pressure': 'សម្ពាធឈាម', Temperature: 'សីតុណ្ហភាព', 'Full Name': 'ឈ្មោះពេញ', Address: 'អាសយដ្ឋាន', Phone: 'ទូរស័ព្ទ', Relationship: 'ទំនាក់ទំនង', 'Medicine Shipping': 'ដឹកជញ្ជូនថ្នាំ', Reason: 'ហេតុផល', Courier: 'អ្នកដឹកជញ្ជូន', Origin: 'ប្រភព', Destination: 'គោលដៅ', Distance: 'ចម្ងាយ', Critical: 'វិបត្តិ', Refresh: 'ផ្ទុកឡើងវិញ', Approve: 'អនុម័ត', Track: 'តាមដាន', Reject: 'បដិសេធ', Cancel: 'បោះបង់', Close: 'បិទ', Delete: 'លុប', Medicine: 'ថ្នាំ', Quantity: 'បរិមាណ' });

const loText = localeMap({ Home: 'ໜ້າຫຼັກ', Dashboard: 'ແດຊບອດ', Distribution: 'ການຈັດສົ່ງ', 'Clinic List': 'ລາຍຊື່ຄລິນິກ', 'Environment Monitoring': 'ຕິດຕາມສິ່ງແວດລ້ອມ', 'Medicine Sender': 'ສົ່ງຢາ', Map: 'ແຜນທີ່', Satellite: 'ດາວທຽມ', Supply: 'ການສະໜອງ', Timestamp: 'ເວລາ', Entity: 'ຫົວໜ່ວຍ', Operator: 'ຜູ້ດຳເນີນການ', Status: 'ສະຖານະ', 'All Clinics': 'ຄລິນິກທັງໝົດ', 'Export CSV': 'ສົ່ງອອກ CSV', 'Add Clinic': 'ເພີ່ມຄລິນິກ', 'Clinic Name': 'ຊື່ຄລິນິກ', Location: 'ທີ່ຕັ້ງ', 'Risk Level': 'ລະດັບຄວາມສ່ຽງ', Action: 'ການດຳເນີນການ', Filter: 'ກັ່ນຕອງ', Stock: 'ສະຕັອກ', Needs: 'ຄວາມຕ້ອງການ', Sort: 'ຈັດຮຽງ', 'Medical Record': 'ບັນທຶກການແພດ', 'Personal Info': 'ຂໍ້ມູນສ່ວນຕົວ', 'Active Pregnancy': 'ການຖືພາປັດຈຸບັນ', 'Gestational Age': 'ອາຍຸຄັນ', 'Due Date': 'ກຳນົດຄອດ', Queue: 'ຄິວ', 'Edit Patient': 'ແກ້ໄຂຄົນເຈັບ', Allergy: 'ພູມແພ້', 'Blood Pressure': 'ຄວາມດັນເລືອດ', Temperature: 'ອຸນຫະພູມ', 'Full Name': 'ຊື່ເຕັມ', Address: 'ທີ່ຢູ່', Phone: 'ໂທລະສັບ', 'Medicine Shipping': 'ການສົ່ງຢາ', Reason: 'ເຫດຜົນ', Courier: 'ຜູ້ສົ່ງ', Origin: 'ຕົ້ນທາງ', Destination: 'ປາຍທາງ', Distance: 'ໄລຍະທາງ', Critical: 'ວິກິດ', Refresh: 'ໂຫຼດໃໝ່', Approve: 'ອະນຸມັດ', Track: 'ຕິດຕາມ', Reject: 'ປະຕິເສດ', Cancel: 'ຍົກເລີກ', Close: 'ປິດ', Delete: 'ລຶບ', Medicine: 'ຢາ', Quantity: 'ຈຳນວນ' });

const myText = localeMap({ Home: 'ပင်မ', Dashboard: 'ဒက်ရှ်ဘုတ်', Distribution: 'ဖြန့်ဖြူးမှု', 'Clinic List': 'ဆေးခန်းစာရင်း', 'Environment Monitoring': 'ပတ်ဝန်းကျင်စောင့်ကြည့်မှု', 'Medicine Sender': 'ဆေးပို့ခြင်း', Map: 'မြေပုံ', Satellite: 'ဂြိုဟ်တု', Supply: 'ထောက်ပံ့မှု', Timestamp: 'အချိန်', Entity: 'အဖွဲ့အစည်း', Operator: 'လုပ်ဆောင်သူ', Status: 'အခြေအနေ', 'All Clinics': 'ဆေးခန်းအားလုံး', 'Export CSV': 'CSV ထုတ်ရန်', 'Add Clinic': 'ဆေးခန်းထည့်ရန်', 'Clinic Name': 'ဆေးခန်းအမည်', Location: 'တည်နေရာ', 'Risk Level': 'အန္တရာယ်အဆင့်', Action: 'လုပ်ဆောင်ချက်', Filter: 'စစ်ထုတ်ရန်', Stock: 'လက်ကျန်', Needs: 'လိုအပ်ချက်', Sort: 'စီရန်', 'Medical Record': 'ဆေးမှတ်တမ်း', 'Personal Info': 'ကိုယ်ရေးအချက်အလက်', 'Active Pregnancy': 'လက်ရှိကိုယ်ဝန်', 'Gestational Age': 'ကိုယ်ဝန်အသက်', 'Due Date': 'မွေးဖွားခန့်မှန်းနေ့', Queue: 'တန်းစီ', 'Edit Patient': 'လူနာပြင်ရန်', Allergy: 'အာလက်ဂျီ', 'Blood Pressure': 'သွေးပေါင်ချိန်', Temperature: 'အပူချိန်', 'Full Name': 'အမည်အပြည့်အစုံ', Address: 'လိပ်စာ', Phone: 'ဖုန်း', 'Medicine Shipping': 'ဆေးပို့ခြင်း', Reason: 'အကြောင်းပြချက်', Courier: 'ပို့ဆောင်သူ', Origin: 'မူလနေရာ', Destination: 'သွားမည့်နေရာ', Distance: 'အကွာအဝေး', Critical: 'အရေးကြီး', Refresh: 'ပြန်ဖွင့်ရန်', Approve: 'အတည်ပြုရန်', Track: 'ခြေရာခံရန်', Reject: 'ငြင်းပယ်ရန်', Cancel: 'မလုပ်တော့ပါ', Close: 'ပိတ်ရန်', Delete: 'ဖျက်ရန်', Medicine: 'ဆေး', Quantity: 'အရေအတွက်' });

const zhText = localeMap({ Home: '首页', Dashboard: '仪表盘', Distribution: '配送', 'Clinic List': '诊所列表', 'Environment Monitoring': '环境监测', 'Medicine Sender': '药品配送', Map: '地图', Satellite: '卫星', Supply: '供应', Timestamp: '时间', Entity: '实体', Operator: '操作员', Status: '状态', 'All Clinics': '全部诊所', 'Export CSV': '导出 CSV', 'Add Clinic': '添加诊所', 'Clinic Name': '诊所名称', Location: '位置', 'Risk Level': '风险等级', Action: '操作', Filter: '筛选', Stock: '库存', Needs: '需求', Sort: '排序', 'Medical Record': '病历', 'Personal Info': '个人信息', 'Active Pregnancy': '当前妊娠', 'Gestational Age': '孕周', 'Due Date': '预产期', Queue: '队列', 'Edit Patient': '编辑患者', Allergy: '过敏', 'Blood Pressure': '血压', Temperature: '体温', 'Full Name': '全名', Address: '地址', Phone: '电话', 'Medicine Shipping': '药品配送', Reason: '原因', Courier: '快递员', Origin: '起点', Destination: '目的地', Distance: '距离', Critical: '严重', Refresh: '刷新', Approve: '批准', Track: '跟踪', Reject: '拒绝', Cancel: '取消', Close: '关闭', Delete: '删除', Medicine: '药品', Quantity: '数量' });

const taText = localeMap({ Home: 'முகப்பு', Dashboard: 'டாஷ்போர்டு', Distribution: 'விநியோகம்', 'Clinic List': 'மருத்துவமனை பட்டியல்', 'Environment Monitoring': 'சூழல் கண்காணிப்பு', 'Medicine Sender': 'மருந்து அனுப்புதல்', Map: 'வரைபடம்', Satellite: 'செயற்கைக்கோள்', Supply: 'வழங்கல்', Timestamp: 'நேரம்', Entity: 'அலகு', Operator: 'இயக்குநர்', Status: 'நிலை', 'All Clinics': 'அனைத்து மருத்துவமனைகள்', 'Export CSV': 'CSV ஏற்றுமதி', 'Add Clinic': 'மருத்துவமனை சேர்', 'Clinic Name': 'மருத்துவமனை பெயர்', Location: 'இடம்', 'Risk Level': 'அபாய நிலை', Action: 'செயல்', Filter: 'வடிகட்டி', Stock: 'கையிருப்பு', Needs: 'தேவை', Sort: 'வரிசைப்படுத்து', 'Medical Record': 'மருத்துவ பதிவு', 'Personal Info': 'தனிப்பட்ட தகவல்', 'Active Pregnancy': 'செயலில் உள்ள கர்ப்பம்', 'Gestational Age': 'கர்ப்ப வயது', 'Due Date': 'பிரசவ தேதி', Queue: 'வரிசை', 'Edit Patient': 'நோயாளியை திருத்து', Allergy: 'ஒவ்வாமை', 'Blood Pressure': 'இரத்த அழுத்தம்', Temperature: 'வெப்பநிலை', 'Full Name': 'முழு பெயர்', Address: 'முகவரி', Phone: 'தொலைபேசி', 'Medicine Shipping': 'மருந்து அனுப்புதல்', Reason: 'காரணம்', Courier: 'கூரியர்', Origin: 'தொடக்கம்', Destination: 'இலக்கு', Distance: 'தூரம்', Critical: 'அவசரம்', Refresh: 'புதுப்பி', Approve: 'ஒப்புதல்', Track: 'கண்காணி', Reject: 'நிராகரி', Cancel: 'ரத்து', Close: 'மூடு', Delete: 'நீக்கு', Medicine: 'மருந்து', Quantity: 'அளவு' });

const localeTexts: Record<string, Record<string, string>> = { en: enText, id: idText, ms: msText, fil: filText, th: thText, vi: viText, km: kmText, lo: loText, my: myText, zh: zhText, ta: taText };

function normalize(value: string) {
  return value.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function translateText(value: string, translations: Record<string, string>) {
  return translations[normalize(value)] ?? null;
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
