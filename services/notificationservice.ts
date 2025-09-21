// Notification Service
export class NotificationService {
  // Mock implementation
  async getNotifications() {
    return [
      { id: '1', title: 'New batch', message: 'New batch has been added', read: false, timestamp: new Date() },
      { id: '2', title: 'Quality alert', message: 'Quality check required', read: true, timestamp: new Date() }
    ];
  }
}

export const notificationService = new NotificationService();