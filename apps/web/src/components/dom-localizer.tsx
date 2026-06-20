'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

const idText: Record<string, string> = {
  Home: 'Beranda', Dashboard: 'Dasbor', Distribution: 'Distribusi', 'Clinic List': 'Daftar Klinik', 'Environment Monitoring': 'Pemantauan Lingkungan', 'District Monitoring': 'Pemantauan Distrik', 'Medicine Sender': 'Pengiriman Obat', 'Review queue': 'Review antrean', Map: 'Peta', Satellite: 'Satelit', 'Route overlay': 'Overlay rute', 'Facility route map': 'Peta rute fasilitas', 'Urgent actions required': 'Aksi mendesak diperlukan', 'No urgent actions': 'Tidak ada aksi mendesak', Supply: 'Pasokan', 'All clear': 'Semua aman', 'Weather risk': 'Risiko cuaca', 'Supply shortage': 'Kekurangan pasokan', 'Recent Approval Activity': 'Aktivitas Approval Terbaru', Timestamp: 'Waktu', Entity: 'Entitas', 'Action type': 'Tipe aksi', Operator: 'Operator', Status: 'Status', 'All Clinics': 'Semua Klinik', 'Export CSV': 'Ekspor CSV', 'Add Clinic': 'Tambah Klinik', 'Clinic Name': 'Nama Klinik', Location: 'Lokasi', 'Logistics Update': 'Update Logistik', 'Critical Stock': 'Stok Kritis', 'Maternal Health (Active)': 'Kesehatan Ibu (Aktif)', 'Risk Level': 'Tingkat Risiko', 'Weather Conditions': 'Kondisi Cuaca', Action: 'Aksi', Filter: 'Filter', Registry: 'Registri', Infrastructure: 'Infrastruktur', 'Clinic Profile': 'Profil Klinik', 'Medication & Supplies': 'Obat & Persediaan', 'Medication Name': 'Nama Obat', Stock: 'Stok', Needs: 'Kebutuhan', 'Days Remaining': 'Sisa Hari', 'AI Recommendation Analysis': 'Analisis Rekomendasi AI', 'Optimized Logistics Route': 'Rute Logistik Optimal', 'Storage capacity:': 'Kapasitas penyimpanan:', 'Shipping History': 'Riwayat Pengiriman', 'Nearby Clinics (Alt. Sourcing)': 'Klinik Terdekat (Sumber Alternatif)', 'Operational Ledger': 'Ledger Operasional', 'Chronological Intelligence Log': 'Log Intelijen Kronologis', Sort: 'Urutkan', Tanggal: 'Tanggal', Petugas: 'Petugas', Klinik: 'Klinik', Tindakan: 'Tindakan', 'AI Prediction Stocks': 'Prediksi Stok AI', 'Actual Decision': 'Keputusan Aktual', 'Audit Trail Analysis': 'Analisis Jejak Audit', Matched: 'Sesuai', Deviated: 'Menyimpang', 'Compliance Rating': 'Rating Kepatuhan', 'Primary Deviation Factor': 'Faktor Penyimpangan Utama', 'Medicine Delivery Report': 'Laporan Pengiriman Obat', 'Delivery Report': 'Laporan Pengiriman', 'Loading shipping map...': 'Memuat peta pengiriman...', 'Patient detail tabs': 'Tab detail pasien', 'Medical Record': 'Rekam Medis', 'Personal Info': 'Info Pribadi', 'Active Pregnancy': 'Kehamilan Aktif', 'Gestational Age': 'Usia Kehamilan', 'Due Date': 'HPL', 'Last ANC Visit': 'Kunjungan ANC Terakhir', Queue: 'Antrekan', 'Queueing...': 'Memasukkan antrean...', 'Edit Patient': 'Ubah Pasien', 'Pregnancy Status': 'Status Kehamilan', 'Gest. Age': 'Usia Kehamilan', 'Preg. Type': 'Tipe Kehamilan', 'Active Risk Factors': 'Faktor Risiko Aktif', 'No active risk factor': 'Tidak ada faktor risiko aktif', 'Routine Medication': 'Obat Rutin', 'Medical Background': 'Riwayat Medis', 'Blood Type': 'Golongan Darah', Allergy: 'Alergi', 'Chronic Conditions': 'Kondisi Kronis', 'Examination History': 'Riwayat Pemeriksaan', 'New Examination': 'Pemeriksaan Baru', 'No examination record yet.': 'Belum ada catatan pemeriksaan.', 'Chief Complaint': 'Keluhan Utama', 'No complaint recorded.': 'Tidak ada keluhan tercatat.', 'Vital Signs': 'Tanda Vital', 'Blood Pressure': 'Tekanan Darah', Temperature: 'Suhu', 'Heart Rate': 'Denyut Jantung', Respiratory: 'Respirasi', Recorded: 'Tercatat', Normal: 'Normal', Visit: 'Kunjungan', 'Additional Symptoms': 'Gejala Tambahan', 'Diagnosis & Findings': 'Diagnosis & Temuan', 'Medication Issued': 'Obat Diberikan', 'No medication recorded.': 'Tidak ada obat tercatat.', 'Print Prescription': 'Cetak Resep', 'Routine ANC Checkup': 'Pemeriksaan ANC Rutin', 'Main Identity': 'Identitas Utama', 'Full Name': 'Nama Lengkap', 'Date of Birth': 'Tanggal Lahir', 'Phone Number': 'Nomor Telepon', Address: 'Alamat', 'Insurance & Administration': 'Asuransi & Administrasi', 'BPJS Number': 'Nomor BPJS', 'Patient ID': 'ID Pasien', 'Registration Date': 'Tanggal Registrasi', Puskesmas: 'Puskesmas', 'Responsible Doctor': 'Dokter Penanggung Jawab', 'Next of Kin': 'Kontak Darurat', Relationship: 'Hubungan', Phone: 'Telepon', 'Pregnancy History': 'Riwayat Kehamilan', 'High Risk Classification': 'Klasifikasi Risiko Tinggi', 'No high risk factor': 'Tidak ada faktor risiko tinggi', 'Acara Hari Ini': 'Acara Hari Ini', 'Belum ada acara': 'Belum ada acara', 'Data kalender akan muncul dari jadwal pasien aktif.': 'Data kalender akan muncul dari jadwal pasien aktif.', UTAMA: 'UTAMA', 'BUTUH PERSIAPAN:': 'BUTUH PERSIAPAN:', 'Siapkan Tindakan': 'Siapkan Tindakan', 'Jadwal aktif': 'Jadwal aktif', 'CATATAN BIDAN': 'CATATAN BIDAN', 'Interior klinik': 'Interior klinik',
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

function translateText(value: string) {
  return idText[value.replace(/\s+/g, ' ').trim()] ?? null;
}

function localizeNode(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    const translated = translateText(node.nodeValue ?? '');
    if (translated) node.nodeValue = translated;
  }
  for (const element of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    for (const attr of attrs) {
      const value = element.getAttribute(attr);
      const translated = value ? translateText(value) : null;
      if (translated) element.setAttribute(attr, translated);
    }
  }
}

export function DomLocalizer() {
  const locale = useLocale();
  useEffect(() => {
    if (locale !== 'id') return;
    localizeNode(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) localizeNode(node as Element);
          if (node.nodeType === Node.TEXT_NODE) {
            const translated = translateText(node.nodeValue ?? '');
            if (translated) node.nodeValue = translated;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}
