import { getToken } from './auth.service';
import { Message, Conversation } from '@/types/message';

interface WebSocketMessage {
  type: string;
  data?: any;
  token?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Event listeners
  private messageListeners: ((message: Message) => void)[] = [];
  private conversationUpdateListeners: ((conversation: Conversation) => void)[] = [];
  private messageReadListeners: ((data: { conversationId: string; userId: string; messageIds: string[] }) => void)[] = [];
  private typingListeners: ((data: { userId: string; conversationId: string }) => void)[] = [];
  private stoppedTypingListeners: ((data: { userId: string; conversationId: string }) => void)[] = [];

  async connect(): Promise<boolean> {
    try {
      if (this.ws && this.isConnected && this.isAuthenticated) {
        return true;
      }

      const token = await getToken();
      if (!token) {
        console.log('No auth token available for WebSocket connection');
        return false;
      }

      // Use a simple WebSocket endpoint
      const serverUrl = __DEV__ ? 'ws://localhost:5001' : 'wss://your-production-url.com:5001';
      
      this.ws = new WebSocket(serverUrl);

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected to', serverUrl);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send authentication message
          console.log('🔐 Sending authentication...');
          this.sendMessage('authenticate', { token });
          
          // Start heartbeat
          this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
            
            // Check if authentication was successful
            if (message.type === 'authenticated') {
              this.isAuthenticated = true;
              console.log('✅ WebSocket authenticated successfully - Real-time messaging enabled');
              resolve(true);
            } else if (message.type === 'authentication_error') {
              console.error('❌ WebSocket authentication failed');
              this.disconnect();
              resolve(false);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error connecting to', serverUrl, ':', error);
          this.isConnected = false;
          this.isAuthenticated = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.isAuthenticated = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        // Set a timeout for the connection attempt
        setTimeout(() => {
          if (!this.isAuthenticated) {
            console.log('WebSocket authentication timeout');
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      return false;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'authenticated':
        // Authentication successful
        break;
      case 'authentication_error':
        // Authentication failed
        break;
      case 'new_message':
        if (message.data) {
          console.log('Received new message via WebSocket:', message.data);
          this.messageListeners.forEach(listener => listener(message.data));
        }
        break;
      case 'conversation_updated':
        if (message.data) {
          console.log('Received conversation update via WebSocket:', message.data);
          this.conversationUpdateListeners.forEach(listener => listener(message.data));
        }
        break;
      case 'messages_read':
        if (message.data) {
          console.log('Received message read status via WebSocket:', message.data);
          this.messageReadListeners.forEach(listener => listener(message.data));
        }
        break;
      case 'user_typing':
        if (message.data) {
          console.log('User typing:', message.data);
          this.typingListeners.forEach(listener => listener(message.data));
        }
        break;
      case 'user_stopped_typing':
        if (message.data) {
          console.log('User stopped typing:', message.data);
          this.stoppedTypingListeners.forEach(listener => listener(message.data));
        }
        break;
      case 'pong':
        // Heartbeat response
        break;
    }
  }

  private sendMessage(type: string, data?: any) {
    if (this.ws && this.isConnected) {
      const message: WebSocketMessage = { type, data };
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.sendMessage('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      await this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    if (this.isConnected && this.isAuthenticated) {
      this.sendMessage('join_conversation', { conversationId });
      console.log(`Joined conversation: ${conversationId}`);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (this.isConnected && this.isAuthenticated) {
      this.sendMessage('leave_conversation', { conversationId });
      console.log(`Left conversation: ${conversationId}`);
    }
  }

  // Send typing indicator
  startTyping(conversationId: string) {
    if (this.isConnected && this.isAuthenticated) {
      this.sendMessage('typing_start', { conversationId });
    }
  }

  // Stop typing indicator
  stopTyping(conversationId: string) {
    if (this.isConnected && this.isAuthenticated) {
      this.sendMessage('typing_stop', { conversationId });
    }
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

  // Check connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService(); 