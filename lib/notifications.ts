import { db, Notification } from './db';
import { formatTimestamp } from './utils';

/**
 * Creates a new notification
 */
export const createNotification = async ({
  userId,
  userType,
  title,
  message,
  type,
  relatedTo
}: {
  userId: string;
  userType: "farmer" | "lab" | "processor" | "consumer";
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  relatedTo?: {
    type: "collection" | "lab" | "processing" | "batch";
    id: string;
  };
}): Promise<Notification> => {
  const now = new Date();
  
  const notification: Notification = {
    userId,
    userType,
    title,
    message,
    type,
    relatedTo,
    isRead: false,
    createdAt: formatTimestamp(now)
  };
  
  // Save the notification
  const id = await db.notifications.add(notification);
  notification.id = id;
  
  return notification;
};

/**
 * Gets all notifications for a user
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  return await db.notifications.where('userId').equals(userId).toArray();
};

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await db.notifications.update(notificationId, { isRead: true });
};

/**
 * Marks all notifications for a user as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const notifications = await db.notifications.where('userId').equals(userId).toArray();
  
  await Promise.all(
    notifications.map(async (notification) => {
      await db.notifications.update(notification.id!, { isRead: true });
    })
  );
};

/**
 * Deletes a notification
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  await db.notifications.delete(notificationId);
};

/**
 * Creates a notification for lab test results
 */
export const notifyLabResults = async ({
  batchId,
  farmerId,
  labUserId,
  testResults
}: {
  batchId: string;
  farmerId: string;
  labUserId: string;
  testResults: {
    moisturePct: number;
    pesticideLevels?: number;
    dnaBarcoding?: string;
  };
}): Promise<void> => {
  // Create notification for the farmer
  await createNotification({
    userId: farmerId,
    userType: 'farmer',
    title: 'Lab Results Available',
    message: `Lab results for batch ${batchId} are now available. Moisture: ${testResults.moisturePct}%${testResults.pesticideLevels ? `, Pesticide levels: ${testResults.pesticideLevels}` : ''}.`,
    type: 'info',
    relatedTo: {
      type: 'lab',
      id: batchId
    }
  });
  
  // Check for threshold alerts
  if (testResults.moisturePct > 15) {
    await createNotification({
      userId: labUserId,
      userType: 'lab',
      title: 'High Moisture Alert',
      message: `Batch ${batchId} has high moisture content (${testResults.moisturePct}%). This may affect quality.`,
      type: 'warning',
      relatedTo: {
        type: 'lab',
        id: batchId
      }
    });
  }
  
  if (testResults.pesticideLevels && testResults.pesticideLevels > 0.5) {
    await createNotification({
      userId: labUserId,
      userType: 'lab',
      title: 'High Pesticide Alert',
      message: `Batch ${batchId} has high pesticide levels (${testResults.pesticideLevels}). This exceeds recommended limits.`,
      type: 'error',
      relatedTo: {
        type: 'lab',
        id: batchId
      }
    });
    
    // Also notify the farmer of high pesticide levels
    await createNotification({
      userId: farmerId,
      userType: 'farmer',
      title: 'High Pesticide Alert',
      message: `Your batch ${batchId} has high pesticide levels (${testResults.pesticideLevels}). Please review your farming practices.`,
      type: 'error',
      relatedTo: {
        type: 'lab',
        id: batchId
      }
    });
  }
};

/**
 * Creates a notification for processing completion
 */
export const notifyProcessingComplete = async ({
  batchId,
  farmerId,
  processorId
}: {
  batchId: string;
  farmerId: string;
  processorId: string;
}): Promise<void> => {
  // Notify the farmer
  await createNotification({
    userId: farmerId,
    userType: 'farmer',
    title: 'Processing Complete',
    message: `Processing for batch ${batchId} is now complete.`,
    type: 'success',
    relatedTo: {
      type: 'processing',
      id: batchId
    }
  });
  
  // Notify the processor
  await createNotification({
    userId: processorId,
    userType: 'processor',
    title: 'Processing Complete',
    message: `Processing for batch ${batchId} is now complete. Ready for lab testing.`,
    type: 'success',
    relatedTo: {
      type: 'processing',
      id: batchId
    }
  });
};

/**
 * Creates a notification for batch completion
 */
export const notifyBatchComplete = async ({
  batchId,
  farmerId,
  processorId,
  labUserId
}: {
  batchId: string;
  farmerId: string;
  processorId: string;
  labUserId: string;
}): Promise<void> => {
  // Notify all parties
  const message = `Batch ${batchId} is now complete and ready for distribution.`;
  
  await createNotification({
    userId: farmerId,
    userType: 'farmer',
    title: 'Batch Complete',
    message,
    type: 'success',
    relatedTo: {
      type: 'batch',
      id: batchId
    }
  });
  
  await createNotification({
    userId: processorId,
    userType: 'processor',
    title: 'Batch Complete',
    message,
    type: 'success',
    relatedTo: {
      type: 'batch',
      id: batchId
    }
  });
  
  await createNotification({
    userId: labUserId,
    userType: 'lab',
    title: 'Batch Complete',
    message,
    type: 'success',
    relatedTo: {
      type: 'batch',
      id: batchId
    }
  });
};