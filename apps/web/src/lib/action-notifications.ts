export type ActionNotificationType = 'success' | 'error';

export type ActionNotificationDetail = {
  type: ActionNotificationType;
  message: string;
  description?: string;
};

export const actionNotificationEvent = 'maternalink:action-notification';

export function notifyAction(detail: ActionNotificationDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ActionNotificationDetail>(actionNotificationEvent, { detail }));
}

export function isMutationMethod(method?: string) {
  const normalized = (method ?? 'GET').toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD' && normalized !== 'OPTIONS';
}

export function getDefaultActionMessage(method?: string) {
  switch ((method ?? 'GET').toUpperCase()) {
    case 'POST':
      return 'Data berhasil dibuat';
    case 'PUT':
    case 'PATCH':
      return 'Perubahan berhasil disimpan';
    case 'DELETE':
      return 'Data berhasil dihapus';
    default:
      return 'Aksi berhasil dilakukan';
  }
}
