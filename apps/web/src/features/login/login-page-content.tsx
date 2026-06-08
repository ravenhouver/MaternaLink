'use client';

import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import styles from './login-page.module.css';

const stats = [
  { value: '10K+', label: 'Puskesmas' },
  { value: '514', label: 'IFK' },
  { value: '30', label: 'Jenis Obat' },
];

export function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label="MaternaLink identity">
        <div className={styles.brandHeader}>
          <span className={styles.logoMark}>
            <AppIcon name="shield" width={20} height={20} />
          </span>
          <span className={styles.brandCopy}>
            <strong>MaternaLink</strong>
            <span>Digital Sanctuary</span>
          </span>
        </div>

        <div className={styles.visualAnchor} aria-hidden="true">
          <span className={styles.aura} />
          <span className={styles.threadOne} />
          <span className={styles.threadTwo} />
          <span className={styles.crossOne}>+</span>
          <span className={styles.crossTwo}>+</span>
        </div>

        <div className={styles.brandFooter}>
          <blockquote className={styles.testimonial}>
            <span className={styles.quoteMark} aria-hidden="true">&quot;</span>
            <p>Membantu 10.000+ puskesmas mengelola stok obat maternal secara akurat dan efisien.</p>
          </blockquote>

          <dl className={styles.statsRow}>
            {stats.map((stat) => (
              <div className={styles.statItem} key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.formPanel} aria-label="Login form">
        <div className={styles.formWrap}>
          <div className={styles.greeting}>
            <h1>Welcome</h1>
            <p>Login to your account</p>
          </div>

          <form className={styles.card}>
            <label className={styles.field}>
              <span>Email</span>
              <span className={styles.inputWrap}>
                <AppIcon name="mail" width={17} height={17} />
                <input type="email" name="email" placeholder="nama@puskesmas.go.id" autoComplete="email" />
              </span>
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <span className={styles.inputWrap}>
                <AppIcon name="lock" width={16} height={16} />
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Masukkan password" autoComplete="current-password" />
                <button
                  type="button"
                  className={styles.visibilityButton}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <AppIcon name="eye" width={18} height={18} />
                </button>
              </span>
            </label>

            <div className={styles.optionsRow}>
              <label className={styles.rememberLabel}>
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <a href="#forgot-password">Forgot Password</a>
            </div>

            <button type="submit" className={styles.submitButton}>Log In</button>
          </form>

          <footer className={styles.secondaryFooter}>
            <span className={styles.onlineStatus}><i />Online</span>
            <p><span>&copy; 2024 MaternaLink</span><span aria-hidden="true">.</span><span>Health Inventory System</span></p>
          </footer>
        </div>
      </section>
    </main>
  );
}
