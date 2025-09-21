'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Notification } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Bell, AlertTriangle, Check, Info, X, RefreshCw } from 'lucide-react';

interface NotificationsPanelProps {
  userRole: string;
  userId: string;
  onMarkAsRead: (notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onRefresh: () => void;
}

export function NotificationsPanel({
  userRole,
  userId,
  onMarkAsRead,
  onDeleteNotification,
  onRefresh
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, [userId, userRole]);
  
  const loadNotifications = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, these would be loaded from the database
      // For now, we'll use placeholder data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId,
          type: 'lab_result',
          title: 'Lab Results Available',
          message: 'New lab results are available for Batch BATCH-1234',
          relatedId: 'BATCH-1234',
          status: 'unread',
          priority: 'high',
          timestamp: formatTimestamp(new Date(Date.now() - 3600000))
        },
        {
          id: '2',
          userId,
          type: 'processing_complete',
          title: 'Processing Step Completed',
          message: 'Drying process completed for Batch BATCH-5678',
          relatedId: 'BATCH-5678',
          status: 'unread',
          priority: 'medium',
          timestamp: formatTimestamp(new Date(Date.now() - 86400000))
        },
        {
          id: '3',
          userId,
          type: 'threshold_alert',
          title: 'Moisture Level Alert',
          message: 'Moisture levels exceed threshold for Batch BATCH-9012',
          relatedId: 'BATCH-9012',
          status: 'read',
          priority: 'high',
          timestamp: formatTimestamp(new Date(Date.now() - 172800000))
        }
      ];
      
      // Filter notifications based on user role
      const filteredNotifications = mockNotifications.filter(notification => {
        if (userRole === 'admin') return true;
        if (userRole === 'lab' && ['lab_result', 'threshold_alert'].includes(notification.type)) return true;
        if (userRole === 'processor' && ['processing_complete', 'threshold_alert'].includes(notification.type)) return true;
        if (userRole === 'collector' && notification.type === 'lab_result') return true;
        return false;
      });
      
      setNotifications(filteredNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    onMarkAsRead(notificationId);
    
    // Update local state
    setNotifications(notifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, status: 'read' };
      }
      return notification;
    }));
  };
  
  // Handle delete notification
  const handleDeleteNotification = (notificationId: string) => {
    onDeleteNotification(notificationId);
    
    // Update local state
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };
  
  // Get notification icon based on type and priority
  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'threshold_alert') {
      return <AlertTriangle className={`h-5 w-5 ${priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />;
    } else if (type === 'lab_result') {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (type === 'processing_complete') {
      return <Info className="h-5 w-5 text-blue-500" />;
    } else {
      return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get notification badge color based on priority
  const getNotificationBadgeVariant = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'outline';
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onRefresh();
            loadNotifications();
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="space-y-2">
                  <div
                    className={`flex items-start space-x-4 p-3 rounded-md ${notification.status === 'unread' ? 'bg-blue-50' : 'bg-gray-50'}`}
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant={getNotificationBadgeVariant(notification.priority)}>
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{notification.timestamp}</span>
                        
                        <div className="flex space-x-2">
                          {notification.status === 'unread' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}