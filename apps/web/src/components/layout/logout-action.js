export async function performLogout({ logout, redirectToLogin }) {
  try {
    await logout();
  } catch {
    // Redirect still matters when session cleanup cannot reach the API.
  } finally {
    redirectToLogin();
  }
}
