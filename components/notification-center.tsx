'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/lib/db';
import { authManager } from '@/lib/auth';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = authManager.getCurrentUser();
    if (user) {
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    // Load notifications
    const loadNotifications = async () => {
      const userNotifications = await notificationService.getNotificationsByUserId(userId);
      setNotifications(userNotifications);
      
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    };
    
    loadNotifications();
    
    // Set up interval to check for new notifications
    const intervalId = setInterval(loadNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [userId]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = async (notificationId: number) => {
    await notificationService.markAsRead(notificationId);
    
    // Update local state
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true } 
        : notification
    ));
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    await notificationService.markAllAsRead(userId);
    
    // Update local state
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: number) => {
    await notificationService.deleteNotification(notificationId);
    
    // Update local state
    const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
    setNotifications(updatedNotifications);
    
    // Recalculate unread count
    const newUnreadCount = updatedNotifications.filter(notification => !notification.isRead).length;
    setUnreadCount(newUnreadCount);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleNotifications}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 p-2 shadow-lg">
          <div className="flex justify-between items-center mb-2 p-2 border-b">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-7 px-2"
                >
                  Mark all as read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleNotifications}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground p-4">
                No notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-2 p-2 rounded-md ${!notification.isRead ? 'bg-muted/50' : ''}`}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <div className="flex gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id!)}
                            className="h-5 w-5"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id!)}
                          className="h-5 w-5"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}