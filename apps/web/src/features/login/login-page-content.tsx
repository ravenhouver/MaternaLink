'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { login } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './login-page.module.css';

const stats = [
  { value: '10K+', label: 'Puskesmas' },
  { value: '514', label: 'IFK' },
  { value: '30', label: 'Jenis Obat' },
];

export function LoginPageContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(username.trim(), password);
      router.replace(user.role === 'IFK_ADMIN' ? routes.ifkRecommendations : routes.queue);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal');
    } finally {
      setIsSubmitting(false);
    }
  }

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

          <form className={styles.card} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Username</span>
              <span className={styles.inputWrap}>
                <AppIcon name="user" width={17} height={17} />
                <input type="text" name="username" placeholder="bidan" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              </span>
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <span className={styles.inputWrap}>
                <AppIcon name="lock" width={16} height={16} />
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Masukkan password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
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

            {error ? <p className={styles.errorMessage}>{error}</p> : null}

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Log In'}</button>
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
