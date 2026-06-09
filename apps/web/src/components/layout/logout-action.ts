type LogoutActionOptions = {
  logout: () => Promise<void>;
  redirectToLogin: () => void;
};

export async function performLogout({ logout, redirectToLogin }: LogoutActionOptions) {
  try {
    await logout();
  } catch {
    // Redirect still matters when session cleanup cannot reach the API.
  } finally {
    redirectToLogin();
  }
}
