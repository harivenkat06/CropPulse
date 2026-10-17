import { apiClient } from './apiClient';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type?: string;
  logisticsRequestId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsService = {
  getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications');
  },

  markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
  },

  markAllAsRead(): Promise<any> {
    return apiClient.patch<any>('/notifications/read-all', {});
  },
};
