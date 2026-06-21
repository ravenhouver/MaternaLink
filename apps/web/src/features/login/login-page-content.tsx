'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { login } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './login-page.module.css';

const demoCredentials = [
  { role: 'Super Admin', username: 'admin', password: 'password123' },
  { role: 'Clinics', username: 'bidan', password: 'password123' },
  { role: 'Admin IFK', username: 'ifk', password: 'password123' },
] as const;

export function LoginPageContent() {
  const router = useRouter();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(username.trim(), password);
      router.replace(user.role === 'SUPER_ADMIN' ? routes.admin : user.role === 'IFK_ADMIN' ? routes.ifk : routes.dashboard);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillCredential(credential: (typeof demoCredentials)[number]) {
    setUsername(credential.username);
    setPassword(credential.password);
    setError(null);
    setNotice(null);
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label={t('identityLabel')}>
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
            <p>{t('testimonial')}</p>
          </blockquote>

          <dl className={styles.statsRow}>
            {['puskesmas', 'ifk', 'medicineTypes'].map((key) => (
              <div className={styles.statItem} key={key}>
                <dt>{t(`stats.${key}.label`)}</dt>
                <dd>{t(`stats.${key}.value`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.formPanel} aria-label={t('formLabel')}>
        <div className={styles.formWrap}>
          <div className={styles.greeting}>
            <h1>{t('welcome')}</h1>
            <p>{t('subtitle')}</p>
          </div>

          <form className={styles.card} onSubmit={handleSubmit}>
            <div className={styles.roleButtons} aria-label="Isi otomatis login berdasarkan role">
              {demoCredentials.map((credential) => (
                <button
                  type="button"
                  className={styles.roleButton}
                  key={credential.username}
                  onClick={() => fillCredential(credential)}
                >
                  <span>{credential.role}</span>
                  <small>{credential.username}</small>
                </button>
              ))}
            </div>

            <label className={styles.field}>
              <span>{tCommon('username')}</span>
              <span className={styles.inputWrap}>
                <AppIcon name="user" width={17} height={17} />
                <input type="text" name="username" placeholder="bidan" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              </span>
            </label>

            <label className={styles.field}>
              <span>{tCommon('password')}</span>
              <span className={styles.inputWrap}>
                <AppIcon name="lock" width={16} height={16} />
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder={t('passwordPlaceholder')} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button
                  type="button"
                  className={styles.visibilityButton}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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
                <span>{t('rememberMe')}</span>
              </label>
              <button type="button" onClick={() => setNotice('Reset password dilakukan oleh Super Admin melalui menu Admin Users.')}>{t('forgotPassword')}</button>
            </div>

            {error ? <p className={styles.errorMessage}>{error}</p> : null}
            {notice ? <p role="status" className={styles.errorMessage}>{notice}</p> : null}

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? t('processing') : t('submit')}</button>
          </form>

          <footer className={styles.secondaryFooter}>
            <span className={styles.onlineStatus}><i />{t('online')}</span>
            <p><span>&copy; 2024 MaternaLink</span><span aria-hidden="true">.</span><span>{t('systemName')}</span></p>
          </footer>
        </div>
      </section>
    </main>
  );
}
