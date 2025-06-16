import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Message, Conversation } from '../types/message';

interface UseMessagesReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (conversationId: string, content: string, messageType?: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => void;
  loadMessages: (conversationId: string, page?: number) => void;
  loadConversations: () => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

export const useMessages = (conversationId?: string): UseMessagesReturn => {
  const webSocket = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  
  // Refs to track current conversation and prevent stale closures
  const currentConversationId = useRef<string | undefined>(conversationId);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Update current conversation ref when prop changes
  useEffect(() => {
    currentConversationId.current = conversationId;
  }, [conversationId]);

  // Handle new messages
  const handleNewMessage = useCallback((message: Message) => {
    console.log('📨 Received new message:', message);
    
    // Add message to current conversation if it matches
    if (currentConversationId.current === message.conversationId) {
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        // Insert message in chronological order
        const newMessages = [...prev, message].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return newMessages;
      });
    }

    // Update conversation list with latest message
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessageAt: message.createdAt,
            messages: [message] // Latest message for preview
          };
        }
        return conv;
      }).sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    });
  }, []);

  // Handle message read receipts
  const handleMessageRead = useCallback((data: { messageId: string; conversationId: string }) => {
    console.log('👁️ Message read receipt:', data);
    
    if (currentConversationId.current === data.conversationId) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isRead: true }
            : msg
        )
      );
    }
  }, []);

  // Handle conversation updates
  const handleConversationUpdated = useCallback((conversation: Conversation) => {
    console.log('💬 Conversation updated:', conversation);
    
    setConversations(prev => {
      const exists = prev.find(c => c.id === conversation.id);
      if (exists) {
        return prev.map(c => c.id === conversation.id ? conversation : c)
          .sort((a, b) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
      } else {
        return [conversation, ...prev]
          .sort((a, b) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
      }
    });
  }, []);

  // Handle typing indicators
  const handleUserTyping = useCallback((data: { userId: string; conversationId: string; isTyping: boolean }) => {
    console.log('⌨️ User typing status:', data);
    
    setTypingUsers(prev => {
      const conversationTyping = prev[data.conversationId] || [];
      
      if (data.isTyping) {
        // Add user to typing list if not already there
        if (!conversationTyping.includes(data.userId)) {
          return {
            ...prev,
            [data.conversationId]: [...conversationTyping, data.userId]
          };
        }
      } else {
        // Remove user from typing list
        return {
          ...prev,
          [data.conversationId]: conversationTyping.filter(id => id !== data.userId)
        };
      }
      
      return prev;
    });

    // Clear typing indicator after timeout
    if (data.isTyping) {
      const timeoutKey = `${data.conversationId}-${data.userId}`;
      
      // Clear existing timeout
      if (typingTimeouts.current[timeoutKey]) {
        clearTimeout(typingTimeouts.current[timeoutKey]);
      }
      
      // Set new timeout
      typingTimeouts.current[timeoutKey] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || []).filter(id => id !== data.userId)
        }));
        delete typingTimeouts.current[timeoutKey];
      }, 3000); // Clear typing indicator after 3 seconds
    }
  }, []);

  // Handle conversations loaded
  const handleConversationsLoaded = useCallback((data: { conversations: Conversation[]; success: boolean }) => {
    console.log('📋 Conversations loaded via WebSocket:', data);
    if (data.success && data.conversations) {
      setConversations(data.conversations.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ));
    }
    setLoading(false);
  }, []);

  // Handle messages loaded
  const handleMessagesLoaded = useCallback((data: { messages: Message[]; success: boolean; conversationId: string }) => {
    console.log('📨 Messages loaded via WebSocket:', data);
    if (data.success && data.messages && data.conversationId === currentConversationId.current) {
      setMessages(data.messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    }
    setLoading(false);
  }, []);

  // Handle WebSocket errors
  const handleError = useCallback((error: { message: string }) => {
    console.error('❌ WebSocket error in useMessages:', error);
    setError(error.message);
  }, []);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!webSocket.isConnected) return;

    webSocket.on('new_message', handleNewMessage);
    webSocket.on('message_read', handleMessageRead);
    webSocket.on('conversation_updated', handleConversationUpdated);
    webSocket.on('conversations_loaded', handleConversationsLoaded);
    webSocket.on('messages_loaded', handleMessagesLoaded);
    webSocket.on('user_typing', handleUserTyping);
    webSocket.on('error', handleError);

    return () => {
      webSocket.off('new_message', handleNewMessage);
      webSocket.off('message_read', handleMessageRead);
      webSocket.off('conversation_updated', handleConversationUpdated);
      webSocket.off('conversations_loaded', handleConversationsLoaded);
      webSocket.off('messages_loaded', handleMessagesLoaded);
      webSocket.off('user_typing', handleUserTyping);
      webSocket.off('error', handleError);
    };
  }, [webSocket.isConnected, handleNewMessage, handleMessageRead, handleConversationUpdated, handleConversationsLoaded, handleMessagesLoaded, handleUserTyping, handleError]);

  // Join/leave conversation when conversationId changes
  useEffect(() => {
    if (!webSocket.isConnected || !conversationId) return;

    console.log('🔗 Joining conversation:', conversationId);
    webSocket.joinConversation(conversationId);

    return () => {
      console.log('🔗 Leaving conversation:', conversationId);
      webSocket.leaveConversation(conversationId);
    };
  }, [webSocket.isConnected, conversationId]);

  // Load conversations on mount and when connected
  useEffect(() => {
    if (webSocket.isConnected) {
      loadConversations();
    }
  }, [webSocket.isConnected]);

  // Load messages when conversation changes and WebSocket is connected
  useEffect(() => {
    if (webSocket.isConnected && conversationId) {
      loadMessages(conversationId);
    }
  }, [webSocket.isConnected, conversationId]);

  // Methods
  const sendMessage = useCallback(async (conversationId: string, content: string, messageType: string = 'text'): Promise<void> => {
    try {
      setError(null);
      webSocket.sendMessage(conversationId, content, messageType);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      throw error;
    }
  }, [webSocket]);

  const markMessagesAsRead = useCallback((conversationId: string): void => {
    try {
      webSocket.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [webSocket]);

  const loadMessages = useCallback((conversationId: string, page: number = 1): void => {
    try {
      setLoading(true);
      setError(null);
      webSocket.getMessages(conversationId, page, 50);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [webSocket]);

  const loadConversations = useCallback((): void => {
    try {
      setLoading(true);
      setError(null);
      webSocket.getConversations();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load conversations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [webSocket]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean): void => {
    try {
      webSocket.setTyping(conversationId, isTyping);
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  }, [webSocket]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    loadMessages,
    loadConversations,
    setTyping,
    typingUsers,
    isConnected: webSocket.isConnected,
    connectionState: webSocket.connectionState,
  };
}; 