'use client';

import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import Link from 'next/link';
import { useState } from 'react';

const asset = (name: string) => `/figma-add-patient/${name}`;
const registrationAsset = (name: string) => `/figma-registration/${name}`;

const methods = [
  {
    key: 'manual',
    title: 'Ketik Manual',
    subtitle: 'Isi form langkah demi langkah',
    description: 'Pilihan terbaik untuk input data mendetail dengan kontrol penuh pada setiap kolom isian.',
    icon: 'manual.svg',
    visual: 'manual-bg.svg',
    button: 'Mulai Mengetik',
    buttonIcon: 'arrow.svg',
  },
  {
    key: 'photo',
    title: 'Upload Foto KIA',
    subtitle: 'AI bantu baca foto, kamu cek hasilnya',
    description: 'Cukup unggah foto buku KIA. Sistem AI kami akan mengekstraksi informasi secara otomatis.',
    icon: 'camera.svg',
    button: 'Ambil Foto',
    buttonIcon: 'upload.svg',
    featured: true,
  },
  {
    key: 'voice',
    title: 'Input Suara',
    subtitle: 'Cukup bicara, AI yang catat',
    description: 'Metode tercepat saat sedang menangani pasien. Bicara secara natural untuk mencatat anamnesa.',
    icon: 'microphone.svg',
    visual: 'voice-bg.svg',
    button: 'Mulai Bicara',
    buttonIcon: 'mic-small.svg',
  },
];

export function AddPatientMethodContent() {
  const [mode, setMode] = useState<'method' | 'manual'>('method');

  if (mode === 'manual') {
    return <ManualPatientRegistration onBack={() => setMode('method')} />;
  }

  return (
    <main className="add-patient-page">
      <nav className="add-patient-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <img src={asset('chevron.svg')} alt="" />
        <Link href="/master">Daftar Pasien</Link>
        <img src={asset('chevron.svg')} alt="" />
        <strong>Tambah Pasien Baru</strong>
      </nav>

      <section className="add-patient-header">
        <Typography.Title level={1}>Pilih Metode Input</Typography.Title>
        <Typography.Paragraph>
          Silakan pilih cara yang paling nyaman bagi Anda untuk memasukkan data pasien baru. Teknologi kami siap membantu mempercepat proses
          administrasi.
        </Typography.Paragraph>
      </section>

      <section className="input-method-grid" aria-label="Metode input pasien">
        {methods.map((method) => (
          <article className={`input-method-card ${method.featured ? 'featured' : ''}`} key={method.key}>
            {method.featured ? <span className="method-orb" /> : method.visual ? <img src={asset(method.visual)} alt="" className="method-visual" /> : null}
            <div className="method-icon">
              <img src={asset(method.icon)} alt="" />
            </div>
            <div className="method-copy">
              <div className="method-title-row">
                <h3>{method.title}</h3>
                {method.featured ? <span className="popular-pill">POPULER</span> : null}
              </div>
              <Typography.Text className="method-subtitle">{method.subtitle}</Typography.Text>
              <Typography.Paragraph>{method.description}</Typography.Paragraph>
            </div>
            <Button className="method-button" onClick={method.key === 'manual' ? () => setMode('manual') : undefined}>
              {method.button}
              <img src={asset(method.buttonIcon)} alt="" />
            </Button>
          </article>
        ))}
      </section>

      <section className="method-notice" aria-label="Catatan metode input">
        <img src={asset('shield.svg')} alt="" />
        <Typography.Text>Apapun metode yang dipilih, kamu tetap bisa edit data sebelum disimpan</Typography.Text>
      </section>

      <section className="digital-context-card">
        <div className="digital-context-copy">
          <Typography.Title level={2}>Digitalisasi Posyandu &amp; Puskesmas</Typography.Title>
          <Typography.Paragraph>
            Sistem ini dirancang untuk memudahkan tenaga kesehatan di seluruh pelosok Indonesia. Mendukung penggunaan luring (offline) dan sinkronisasi
            otomatis saat terhubung internet.
          </Typography.Paragraph>
          <div className="digital-stats">
            <span>
              <strong>99.2%</strong>
              <small>AKURASI AI</small>
            </span>
            <i />
            <span>
              <strong>3x Lipat</strong>
              <small>LEBIH CEPAT</small>
            </span>
          </div>
        </div>
        <div className="digital-context-image">
          <img src={asset('health-worker.png')} alt="Tenaga kesehatan membawa tablet" />
          <span />
        </div>
      </section>
    </main>
  );
}

type ManualPatientRegistrationProps = {
  onBack: () => void;
};

const steps = [
  { number: 1, label: 'Data Diri', active: true },
  { number: 2, label: 'Data Kehamilan' },
  { number: 3, label: 'Faktor Risiko' },
];

function ManualPatientRegistration({ onBack }: ManualPatientRegistrationProps) {
  const [registrationStep, setRegistrationStep] = useState(1);
  const isFinalStep = registrationStep === 3;

  return (
    <main className="patient-registration-page">
      <nav className="add-patient-breadcrumb patient-registration-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <img src={asset('chevron.svg')} alt="" />
        <Link href="/master">Daftar Pasien</Link>
        <img src={asset('chevron.svg')} alt="" />
        <strong>Tambah Pasien Baru</strong>
      </nav>

      <section className="patient-registration-panel">
        <header className="patient-registration-header">
          <Typography.Title level={1}>Pendaftaran Pasien Baru</Typography.Title>
          <Typography.Paragraph>Lengkapi data pasien untuk memulai pemantauan kehamilan.</Typography.Paragraph>
        </header>

        <ol className="registration-steps" aria-label="Tahapan pendaftaran pasien">
          {steps.map((step, index) => (
            <li className={`registration-step${registrationStep === step.number ? ' active' : ''}`} key={step.number}>
              <span className="step-badge">{step.number}</span>
              <span className="step-label">{step.label}</span>
              {index < steps.length - 1 ? <span className="step-line" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>

        {registrationStep === 1 ? <RegistrationStepOne /> : registrationStep === 2 ? <RegistrationStepTwo /> : <RegistrationStepThree />}

        <footer className="registration-form-nav">
          <Button className="registration-back-button" onClick={registrationStep === 1 ? onBack : () => setRegistrationStep((current) => current - 1)}>
            <img src={registrationAsset('arrow-left.svg')} alt="" />
            Kembali
          </Button>
          <Button className={`registration-next-button${isFinalStep ? ' save-patient-button' : ''}`} onClick={() => setRegistrationStep((current) => Math.min(3, current + 1))}>
            {isFinalStep ? (
              <>
                <span className="save-patient-icon" aria-hidden="true" />
                Simpan Pasien
              </>
            ) : (
              <>
                Lanjut
                <img src={registrationAsset('arrow-right.svg')} alt="" />
              </>
            )}
          </Button>
        </footer>
      </section>
    </main>
  );
}

const riskFactors = [
  { title: 'Hipertensi', description: 'Tekanan darah tinggi' },
  { title: 'Anemia', description: 'Kurang darah' },
  { title: 'Diabetes Gestasional', description: 'Kadar gula darah tinggi saat hamil' },
  { title: 'Kehamilan Bermasalah', description: 'Riwayat komplikasi sebelumnya' },
  { title: 'Usia di bawah 18 tahun', description: 'Risiko kehamilan usia dini' },
  { title: 'Usia di atas 35 tahun', description: 'Risiko tinggi usia matang' },
  { title: 'Kehamilan kembar', description: 'Multiplet (Gemelli)', wide: true },
];

function RegistrationStepThree() {
  return (
    <section className="risk-step-fields" aria-label="Form faktor risiko">
      <div className="risk-factor-grid">
        {riskFactors.map((factor) => (
          <label className={`risk-factor-card${factor.wide ? ' wide' : ''}`} key={factor.title}>
            <span className="risk-factor-copy">
              <strong>{factor.title}</strong>
              <small>{factor.description}</small>
            </span>
            <input type="checkbox" aria-label={factor.title} />
            <span className="risk-toggle" aria-hidden="true" />
          </label>
        ))}
      </div>

      <label className="risk-note-field">
        <span>Catatan tambahan (optional)...</span>
        <textarea placeholder="Masukkan detail tambahan tentang kondisi kesehatan pasien..." />
      </label>
    </section>
  );
}

function RegistrationStepOne() {
  return (
    <>
      <section className="registration-card" aria-label="Form data diri pasien">
        <label className="registration-field registration-field-full">
          <span>Nama Lengkap Pasien</span>
          <input type="text" placeholder="Contoh: Siti Aminah" />
        </label>

        <div className="registration-field-grid">
          <label className="registration-field registration-age-field">
            <span>Usia</span>
            <span className="registration-input-affix">
              <input type="number" placeholder="00" min="0" />
              <small>Tahun</small>
            </span>
          </label>

          <label className="registration-field">
            <span>Nomor Telepon (WhatsApp)</span>
            <input type="tel" placeholder="0812xxxxxxx" />
          </label>
        </div>
      </section>

      <section className="registration-ai-card" aria-label="Fitur Cerdas AI">
        <span className="registration-ai-icon">
          <img src={registrationAsset('ai-sparkle.svg')} alt="" />
        </span>
        <div className="registration-ai-copy">
          <Typography.Title level={3}>Fitur Cerdas AI</Typography.Title>
          <Typography.Paragraph>
            Anda dapat mengunggah foto buku KIA. Sistem AI akan mengekstrak data secara otomatis untuk mempercepat proses.
          </Typography.Paragraph>
          <div className="registration-ai-result">
            <strong>AI berhasil membaca:</strong>
            <em>&quot;Usia kehamilan 28 minggu, HPL 15 Jan&quot;</em>
            <div className="registration-ai-actions">
              <Button type="primary" className="ai-confirm-button">Konfirmasi</Button>
              <Button className="ai-edit-button">Edit Manual</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function RegistrationStepTwo() {
  return (
    <section className="pregnancy-step-fields" aria-label="Form data kehamilan">
      <div className="pregnancy-age-section">
        <div className="pregnancy-age-header">
          <Typography.Text>Usia kehamilan saat ini (minggu)</Typography.Text>
          <output className="pregnancy-week-value">
            <strong>24</strong>
            <span>Minggu</span>
          </output>
        </div>
        <div className="pregnancy-slider" aria-hidden="true">
          <span className="pregnancy-slider-track" />
          <span className="pregnancy-slider-thumb" />
        </div>
        <div className="pregnancy-scale">
          <span>1 Minggu</span>
          <span>Trimester 1</span>
          <span>Trimester 2</span>
          <span>Trimester 3</span>
          <span>42 Minggu</span>
        </div>
      </div>

      <div className="pregnancy-data-grid">
        <label className="pregnancy-data-field">
          <span>Hari Perkiraan Lahir (HPL)</span>
          <span className="pregnancy-display-input">
            <img src={registrationAsset('calendar.svg')} alt="" />
            <input type="text" value="15 Januari 2026" readOnly />
          </span>
          <small>Dihitung otomatis berdasarkan HPHT</small>
        </label>

        <label className="pregnancy-data-field">
          <span>Kunjungan ANC Terakhir</span>
          <span className="pregnancy-display-input select-like">
            <img src={registrationAsset('anc-kit.svg')} alt="" />
            <select defaultValue="K3" aria-label="Kunjungan ANC Terakhir">
              <option>K1</option>
              <option>K2</option>
              <option>K3</option>
              <option>K4</option>
            </select>
            <img src={registrationAsset('select-chevron.svg')} alt="" className="select-chevron" />
          </span>
        </label>
      </div>

      <aside className="trimester-status-card" aria-label="Status Trimester">
        <img src={registrationAsset('status-icon.svg')} alt="" />
        <div>
          <Typography.Title level={3}>Status Trimester</Typography.Title>
          <Typography.Paragraph>
            Pasien saat ini berada di akhir trimester kedua. Disarankan untuk memantau tekanan darah dan detak jantung janin secara rutin setiap kunjungan.
          </Typography.Paragraph>
        </div>
      </aside>
    </section>
  );
}
