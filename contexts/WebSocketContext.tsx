import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { webSocketService, WebSocketEvents } from '../services/websocket.service';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (conversationId: string, content: string, messageType?: string) => void;
  markMessagesAsRead: (conversationId: string) => void;
  getMessages: (conversationId: string, page?: number, limit?: number) => void;
  getConversations: () => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  on: <K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) => void;
  off: <K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Get server URL from environment
  const getServerUrl = () => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    // Replace the port with WebSocket port (5000)
    return baseUrl.replace(':3000', ':5000');
  };

  const connect = async (): Promise<void> => {
    if (!user || !token) {
      console.log('🔌 Disconnecting WebSocket - no user or token');
      webSocketService.disconnect();
      return;
    }

    try {
      console.log('🔌 Initializing WebSocket connection for user:', user.id);
      setConnectionState('connecting');
      
      const serverUrl = getServerUrl();
      await webSocketService.connect(serverUrl);
      await webSocketService.authenticate(token);
      
      setIsConnected(true);
      setConnectionState('connected');
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      setIsConnected(false);
      setConnectionState('disconnected');
      throw error;
    }
  };

  const disconnect = (): void => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionState('disconnected');
  };

  // Setup WebSocket event listeners
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleAuthenticated = (data: any) => {
      console.log('✅ WebSocket authenticated in context:', data);
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleAuthenticationError = (error: { message: string }) => {
      console.error('❌ WebSocket authentication failed in context:', error);
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);
    webSocketService.on('connect_error', handleConnectError);
    webSocketService.on('authenticated', handleAuthenticated);
    webSocketService.on('authentication_error', handleAuthenticationError);

    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
      webSocketService.off('connect_error', handleConnectError);
      webSocketService.off('authenticated', handleAuthenticated);
      webSocketService.off('authentication_error', handleAuthenticationError);
    };
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (user && token) {
      connect().catch(console.error);
    } else {
      disconnect();
    }
  }, [user, token]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        console.log('📱 App went to background - maintaining WebSocket connection');
        // Keep connection alive in background for real-time notifications
      } else if (nextAppState === 'active') {
        console.log('📱 App became active - ensuring WebSocket connection');
        if (user && token && !isConnected) {
          connect().catch(console.error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, token, isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionState,
    connect,
    disconnect,
    sendMessage: webSocketService.sendMessage.bind(webSocketService),
    markMessagesAsRead: webSocketService.markMessagesAsRead.bind(webSocketService),
    getMessages: webSocketService.getMessages.bind(webSocketService),
    getConversations: webSocketService.getConversations.bind(webSocketService),
    setTyping: webSocketService.setTyping.bind(webSocketService),
    joinConversation: webSocketService.joinConversation.bind(webSocketService),
    leaveConversation: webSocketService.leaveConversation.bind(webSocketService),
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 