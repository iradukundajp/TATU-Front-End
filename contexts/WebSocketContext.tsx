import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { webSocketService } from '@/services/websocket.service';
import { useAuth } from './AuthContext';
import { Message, Conversation } from '@/types/message';

interface WebSocketContextType {
  isConnected: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onNewMessage: (listener: (message: Message) => void) => () => void;
  onConversationUpdate: (listener: (conversation: Conversation) => void) => () => void;
  onMessageRead: (listener: (data: { conversationId: string; userId: string; messageIds: string[] }) => void) => () => void;
  onUserTyping: (listener: (data: { userId: string; conversationId: string }) => void) => () => void;
  onUserStoppedTyping: (listener: (data: { userId: string; conversationId: string }) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let connectionAttempted = false;

    const initializeWebSocket = async () => {
      if (isAuthenticated && user && !connectionAttempted) {
        connectionAttempted = true;
        console.log('Attempting to connect to WebSocket...');
        
        try {
          const connected = await webSocketService.connect();
          setIsConnected(connected);
          
          if (connected) {
            console.log('✅ WebSocket connected successfully - Real-time messaging enabled');
          } else {
            console.log('❌ WebSocket connection failed - Falling back to polling');
          }
        } catch (error) {
          console.error('Error initializing WebSocket:', error);
          setIsConnected(false);
        }
      }
    };

    const cleanupWebSocket = () => {
      if (!isAuthenticated) {
        console.log('User logged out, disconnecting WebSocket');
        webSocketService.disconnect();
        setIsConnected(false);
      }
    };

    if (isAuthenticated && user) {
      initializeWebSocket();
    } else {
      cleanupWebSocket();
    }

    return () => {
      // Don't disconnect on unmount, let the service handle reconnection
    };
  }, [isAuthenticated, user]);

  const connect = async (): Promise<boolean> => {
    try {
      const connected = await webSocketService.connect();
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
      return false;
    }
  };

  const disconnect = () => {
    webSocketService.disconnect();
    setIsConnected(false);
  };

  const joinConversation = (conversationId: string) => {
    webSocketService.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    webSocketService.leaveConversation(conversationId);
  };

  const startTyping = (conversationId: string) => {
    webSocketService.startTyping(conversationId);
  };

  const stopTyping = (conversationId: string) => {
    webSocketService.stopTyping(conversationId);
  };

  const onNewMessage = (listener: (message: Message) => void) => {
    return webSocketService.onNewMessage(listener);
  };

  const onConversationUpdate = (listener: (conversation: Conversation) => void) => {
    return webSocketService.onConversationUpdate(listener);
  };

  const onMessageRead = (listener: (data: { conversationId: string; userId: string; messageIds: string[] }) => void) => {
    return webSocketService.onMessageRead(listener);
  };

  const onUserTyping = (listener: (data: { userId: string; conversationId: string }) => void) => {
    return webSocketService.onUserTyping(listener);
  };

  const onUserStoppedTyping = (listener: (data: { userId: string; conversationId: string }) => void) => {
    return webSocketService.onUserStoppedTyping(listener);
  };

  const value: WebSocketContextType = {
    isConnected,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onConversationUpdate,
    onMessageRead,
    onUserTyping,
    onUserStoppedTyping,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
} 