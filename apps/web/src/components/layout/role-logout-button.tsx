'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { logout } from '@/lib/api';
import { routes } from '@/lib/routes';
import { performLogout } from './logout-action';

type RoleLogoutButtonProps = {
  className?: string;
  iconSize?: number;
  label?: string;
};

export function RoleLogoutButton({ className, iconSize = 20, label = 'Logout' }: RoleLogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await performLogout({
      logout,
      redirectToLogin: () => router.replace(routes.login),
    });
  }

  return (
    <button type="button" className={className} onClick={handleLogout} disabled={isLoggingOut}>
      <AppIcon name="logOut" width={iconSize} height={iconSize} />
      <span>{isLoggingOut ? 'Keluar...' : label}</span>
    </button>
  );
}
