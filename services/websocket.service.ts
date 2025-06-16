import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '@/types/message';
import { getToken } from './auth.service';

export interface WebSocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  
  // Authentication events
  authenticated: (data: any) => void;
  authentication_error: (error: { message: string }) => void;
  
  // Message events
  new_message: (message: any) => void;
  message_read: (data: { messageId: string; conversationId: string }) => void;
  conversation_updated: (conversation: any) => void;
  conversations_loaded: (data: { conversations: any[]; success: boolean }) => void;
  messages_loaded: (data: { messages: any[]; success: boolean; conversationId: string }) => void;
  
  // Typing events
  user_typing: (data: { userId: string; conversationId: string; isTyping: boolean }) => void;
  
  // Error events
  error: (error: { message: string }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private eventListeners: Map<string, Function[]> = new Map();

  // Event listeners
  private messageListeners: ((message: Message) => void)[] = [];
  private conversationUpdateListeners: ((conversation: Conversation) => void)[] = [];
  private messageReadListeners: ((data: { conversationId: string; userId: string; messageIds: string[] }) => void)[] = [];
  private typingListeners: ((data: { userId: string; conversationId: string }) => void)[] = [];
  private stoppedTypingListeners: ((data: { userId: string; conversationId: string }) => void)[] = [];

  async connect(serverUrl: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log('🔌 WebSocket already connected or connecting');
      return;
    }

    try {
      this.isConnecting = true;
      console.log('Connecting to WebSocket server:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: false, // We'll handle reconnection manually
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          console.log('✅ WebSocket connected');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('❌ WebSocket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ WebSocket connection failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('disconnect', reason);
      
      // Auto-reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.emit('connect_error', error);
      this.handleReconnection();
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('❌ WebSocket authentication error:', error);
      this.emit('authentication_error', error);
    });

    // Message events
    this.socket.on('new_message', (message) => {
      console.log('📨 New message received:', message);
      console.log('📨 WebSocket Service: Broadcasting new_message event to listeners');
      this.emit('new_message', message);
    });

    this.socket.on('message_read', (data) => {
      console.log('👁️ Message read:', data);
      this.emit('message_read', data);
    });

    this.socket.on('conversation_updated', (conversation) => {
      console.log('💬 Conversation updated:', conversation);
      this.emit('conversation_updated', conversation);
    });

    this.socket.on('conversations_loaded', (data) => {
      console.log('📋 Conversations loaded:', data);
      this.emit('conversations_loaded', data);
    });

    this.socket.on('messages_loaded', (data) => {
      console.log('📨 Messages loaded:', data);
      this.emit('messages_loaded', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.emit('user_typing', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', error);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        if (this.socket) {
          this.socket.disconnect();
        }
        
        const serverUrl = (this.socket?.io as any)?.uri || 'http://localhost:5000';
        await this.connect(serverUrl);
        
        // Re-authenticate after reconnection
        const token = await getToken();
        if (token) {
          this.authenticate(token);
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  async authenticate(token: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Cannot authenticate: WebSocket not connected');
    }

    console.log('Authenticating with WebSocket server');
    console.log('Token being sent:', token ? `${token.substring(0, 20)}...` : 'null/undefined');
    this.socket.emit('authenticate', token);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from WebSocket server');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Event emitter methods
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    console.log(`📨 WebSocket Service: Emitting ${event} to ${listeners?.length || 0} listeners`);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Message operations
  sendMessage(conversationId: string, content: string, messageType: string = 'text'): void {
    if (!this.socket?.connected) {
      throw new Error('Cannot send message: WebSocket not connected');
    }

    this.socket.emit('send_message', {
      conversationId,
      content,
      messageType
    });
  }

  markMessagesAsRead(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Cannot mark messages as read: WebSocket not connected');
    }

    this.socket.emit('mark_messages_read', { conversationId });
  }

  getMessages(conversationId: string, page: number = 1, limit: number = 50): void {
    if (!this.socket?.connected) {
      throw new Error('Cannot get messages: WebSocket not connected');
    }

    this.socket.emit('get_messages', { conversationId, page, limit });
  }

  getConversations(): void {
    if (!this.socket?.connected) {
      throw new Error('Cannot get conversations: WebSocket not connected');
    }

    this.socket.emit('get_conversations');
  }

  // Typing indicators
  setTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', { conversationId, isTyping });
  }

  // Join/leave conversation rooms
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_conversation', { conversationId });
  }

  // Utility methods
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionState(): string {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.connected) return 'connected';
    return 'disconnected';
  }

  // Event listener management
  onNewMessage(listener: (message: Message) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  onConversationUpdate(listener: (conversation: Conversation) => void) {
    this.conversationUpdateListeners.push(listener);
    return () => {
      this.conversationUpdateListeners = this.conversationUpdateListeners.filter(l => l !== listener);
    };
  }

  onMessageRead(listener: (data: { conversationId: string; userId: string; messageIds: string[] }) => void) {
    this.messageReadListeners.push(listener);
    return () => {
      this.messageReadListeners = this.messageReadListeners.filter(l => l !== listener);
    };
  }

  onUserTyping(listener: (data: { userId: string; conversationId: string }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== listener);
    };
  }

  onUserStoppedTyping(listener: (data: { userId: string; conversationId: string }) => void) {
    this.stoppedTypingListeners.push(listener);
    return () => {
      this.stoppedTypingListeners = this.stoppedTypingListeners.filter(l => l !== listener);
    };
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService; 