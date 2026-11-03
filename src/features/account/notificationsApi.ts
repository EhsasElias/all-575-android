import { http } from '@/shared/api';

export type CustomerNotice = {
  id: number;
  type: string;
  title: string;
  message: string;
  target_path: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationInbox = {
  data: CustomerNotice[];
  unread_count: number;
};

export const notificationKeys = {
  inbox: ['customer', 'notifications'] as const,
};

export function getNotifications(signal?: AbortSignal) {
  return http.get<NotificationInbox>('/me/notifications', signal ? { signal } : {});
}

export function markNotificationRead(id: number) {
  return http.patch('/me/notifications/' + id + '/read');
}

export function markAllNotificationsRead() {
  return http.patch('/me/notifications/read-all');
}
