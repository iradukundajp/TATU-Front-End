import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { notificationEmitter, NotificationData } from '@/hooks/useNotifications';

interface Notification extends NotificationData {
  id: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const NotificationComponent: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const webSocket = useWebSocket();
  const { user } = useAuth();
  const animatedValues = useRef<Map<string, Animated.Value>>(new Map());

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    console.log('🔔 NotificationComponent: Adding notification:', notification);
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      duration: 4000, // Default 4 seconds
      ...notification,
    };

    console.log('🔔 NotificationComponent: Setting notifications state with:', newNotification);
    setNotifications(prev => {
      console.log('🔔 NotificationComponent: Previous notifications:', prev.length);
      return [...prev, newNotification];
    });

    // Create animated value for this notification
    const animatedValue = new Animated.Value(0);
    animatedValues.current.set(id, animatedValue);

    // Animate in
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    const animatedValue = animatedValues.current.get(id);
    if (animatedValue) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        animatedValues.current.delete(id);
      });
    }
  };

  // Listen to notification emitter
  useEffect(() => {
    console.log('🔔 NotificationComponent: Setting up notification emitter listener');
    const unsubscribe = notificationEmitter.subscribe((notificationData) => {
      console.log('🔔 NotificationComponent: Received notification from emitter:', notificationData);
      addNotification(notificationData);
    });

    // Test notification on mount
    setTimeout(() => {
      console.log('🔔 NotificationComponent: Adding test notification');
      addNotification({
        type: 'info',
        title: 'Notification System',
        message: 'Real-time notifications are active!',
        duration: 3000,
      });
    }, 2000);

    return unsubscribe;
  }, []);

    // Handle new message notifications
  useEffect(() => {
    console.log('🔔 NotificationComponent: Setting up WebSocket listeners, connected:', webSocket.isConnected);
    if (!webSocket.isConnected) return;

    const handleNewMessage = (message: any) => {
      console.log('🔔 NotificationComponent: Received new message event:', message);
      console.log('🔔 NotificationComponent: Current user ID:', user?.id);
      console.log('🔔 NotificationComponent: Message sender ID:', message.senderId);
      console.log('🔔 NotificationComponent: Message receiver ID:', message.receiverId);
      
      // Don't show notification for own messages (when current user is the sender)
      if (message.senderId === user?.id) {
        console.log('🔔 NotificationComponent: Skipping notification for own message');
        return;
      }

      // Only show notification if current user is the receiver
      if (message.receiverId !== user?.id) {
        console.log('🔔 NotificationComponent: Skipping notification - not for current user');
        return;
      }

      // Don't show notification if user is currently in the same chat
      // Note: We could implement more sophisticated route detection here
      // For now, we'll show notifications regardless of current screen
      // if (currentRoute === 'chat' && currentConversationId === message.conversationId) {
      //   console.log('🔔 NotificationComponent: Skipping notification - user in same chat');
      //   return;
      // }

      console.log('🔔 NotificationComponent: Adding message notification');
      addNotification({
        type: 'message',
        title: message.sender?.name || 'New Message',
        message: message.content.length > 50 
          ? `${message.content.substring(0, 50)}...` 
          : message.content,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender?.name,
        action: () => {
          router.push(`/chat/${message.conversationId}`);
        },
      });
    };

    const handleTyping = (data: { userId: string; conversationId: string; userName?: string }) => {
      // Don't show typing for own typing
      if (data.userId === user?.id) return;

      addNotification({
        type: 'typing',
        title: 'Typing...',
        message: `${data.userName || 'Someone'} is typing`,
        conversationId: data.conversationId,
        duration: 3000,
      });
    };

    const handleConnectionChange = (connected: boolean) => {
      addNotification({
        type: 'connection',
        title: connected ? 'Connected' : 'Disconnected',
        message: connected 
          ? 'Real-time messaging is active' 
          : 'Connection lost, trying to reconnect...',
        duration: connected ? 2000 : 5000,
      });
    };

    const handleError = (error: { message: string }) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message,
        duration: 5000,
      });
    };

    // Set up event listeners
    webSocket.on('new_message', handleNewMessage);
    webSocket.on('user_typing', handleTyping);
    webSocket.on('connect', () => handleConnectionChange(true));
    webSocket.on('disconnect', () => handleConnectionChange(false));
    webSocket.on('error', handleError);

    return () => {
      webSocket.off('new_message', handleNewMessage);
      webSocket.off('user_typing', handleTyping);
      webSocket.off('connect', () => handleConnectionChange(true));
      webSocket.off('disconnect', () => handleConnectionChange(false));
      webSocket.off('error', handleError);
    };
  }, [webSocket.isConnected, user?.id]);

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'chatbubble';
      case 'typing':
        return 'ellipsis-horizontal';
      case 'connection':
        return 'wifi';
      case 'error':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  // Get notification color
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return '#007AFF';
      case 'typing':
        return '#FF9500';
      case 'connection':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'success':
        return '#34C759';
      case 'info':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  console.log('🔔 NotificationComponent: Rendering with notifications:', notifications.length);

  if (notifications.length === 0) {
    console.log('🔔 NotificationComponent: No notifications to show');
    return null;
  }

  console.log('🔔 NotificationComponent: Rendering notifications:', notifications);
  return (
    <View style={styles.container}>
      {notifications.map((notification) => {
        const animatedValue = animatedValues.current.get(notification.id);
        if (!animatedValue) return null;

        return (
          <Animated.View
            key={notification.id}
            style={[
              styles.notification,
              {
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: animatedValue,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.notificationContent,
                { borderLeftColor: getNotificationColor(notification.type) }
              ]}
              onPress={() => {
                if (notification.action) {
                  notification.action();
                }
                removeNotification(notification.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={24}
                  color={getNotificationColor(notification.type)}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Text style={styles.message} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => removeNotification(notification.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  notification: {
    marginBottom: 8,
  },
  notificationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 70,
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationComponent; 