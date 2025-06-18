/**
 * Message and conversation types for the messaging system
 */

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isArtist?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'booking_request' | 'aftercare';
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: Message | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface CreateMessageRequest {
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'booking_request' | 'aftercare';
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}