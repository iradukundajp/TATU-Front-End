import { useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface NotificationData {
  type: 'message' | 'typing' | 'connection' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: () => void;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
}

// Global notification event emitter
class NotificationEmitter {
  private listeners: ((notification: NotificationData) => void)[] = [];

  subscribe(listener: (notification: NotificationData) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(notification: NotificationData) {
    this.listeners.forEach(listener => listener(notification));
  }
}

export const notificationEmitter = new NotificationEmitter();

export const useNotifications = () => {
  const webSocket = useWebSocket();

  const showNotification = useCallback((notification: NotificationData) => {
    notificationEmitter.emit(notification);
  }, []);

  const showMessageNotification = useCallback((
    senderName: string,
    message: string,
    conversationId: string,
    senderId: string,
    action?: () => void
  ) => {
    showNotification({
      type: 'message',
      title: senderName,
      message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      conversationId,
      senderId,
      senderName,
      action,
      duration: 5000,
    });
  }, [showNotification]);

  const showTypingNotification = useCallback((
    userName: string,
    conversationId: string
  ) => {
    showNotification({
      type: 'typing',
      title: 'Typing...',
      message: `${userName} is typing`,
      conversationId,
      duration: 3000,
    });
  }, [showNotification]);

  const showConnectionNotification = useCallback((connected: boolean) => {
    showNotification({
      type: 'connection',
      title: connected ? 'Connected' : 'Disconnected',
      message: connected 
        ? 'Real-time messaging is active' 
        : 'Connection lost, trying to reconnect...',
      duration: connected ? 2000 : 5000,
    });
  }, [showNotification]);

  const showErrorNotification = useCallback((
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  }, [showNotification]);

  const showSuccessNotification = useCallback((
    title: string,
    message: string,
    duration: number = 3000
  ) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [showNotification]);

  const showInfoNotification = useCallback((
    title: string,
    message: string,
    duration: number = 4000
  ) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [showNotification]);

  return {
    showNotification,
    showMessageNotification,
    showTypingNotification,
    showConnectionNotification,
    showErrorNotification,
    showSuccessNotification,
    showInfoNotification,
    isConnected: webSocket.isConnected,
    connectionState: webSocket.connectionState,
  };
}; 