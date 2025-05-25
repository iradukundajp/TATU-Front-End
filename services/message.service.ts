import { api } from './api.service';
import { 
  Conversation, 
  Message, 
  CreateMessageRequest, 
  MessagesResponse, 
  UnreadCountResponse 
} from '@/types/message';

/**
 * Message service for handling messaging API calls
 */

/**
 * Get all conversations for the current user
 * @returns Promise<Conversation[]> - Array of conversations
 */
export async function getUserConversations(): Promise<Conversation[]> {
  try {
    console.log('Fetching user conversations');
    
    const response = await api.get<Conversation[]>('/api/messages/conversations');
    console.log('User conversations fetched:', response);
    
    return response;
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
}

/**
 * Get messages for a specific conversation
 * @param conversationId - The conversation ID
 * @param page - Page number (default: 1)
 * @param limit - Messages per page (default: 50)
 * @returns Promise<MessagesResponse> - Messages and pagination info
 */
export async function getConversationMessages(
  conversationId: string, 
  page: number = 1, 
  limit: number = 50
): Promise<MessagesResponse> {
  try {
    console.log(`Fetching messages for conversation: ${conversationId}`);
    
    const response = await api.get<MessagesResponse>(
      `/api/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    console.log('Conversation messages fetched:', response);
    
    return response;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
}

/**
 * Send a new message
 * @param messageData - The message data to send
 * @returns Promise<Message> - The created message
 */
export async function sendMessage(messageData: CreateMessageRequest): Promise<Message> {
  try {
    console.log('Sending message:', messageData);
    
    const response = await api.post<Message>('/api/messages', messageData);
    console.log('Message sent successfully:', response);
    
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Mark messages as read in a conversation
 * @param conversationId - The conversation ID
 * @returns Promise<{message: string, markedCount: number}>
 */
export async function markMessagesAsRead(conversationId: string): Promise<{message: string, markedCount: number}> {
  try {
    console.log(`Marking messages as read for conversation: ${conversationId}`);
    
    const response = await api.put<{message: string, markedCount: number}>(
      `/api/messages/conversations/${conversationId}/read`,
      {}
    );
    console.log('Messages marked as read:', response);
    
    return response;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Get unread message count for the current user
 * @returns Promise<number> - Unread message count
 */
export async function getUnreadMessageCount(): Promise<number> {
  try {
    console.log('Fetching unread message count');
    
    const response = await api.get<UnreadCountResponse>('/api/messages/unread-count');
    console.log('Unread message count fetched:', response);
    
    return response.unreadCount;
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    throw error;
  }
}

/**
 * Start a conversation with a user
 * @param userId - The user ID to start conversation with
 * @returns Promise<Conversation> - The conversation object
 */
export async function startConversation(userId: string): Promise<any> {
  try {
    console.log(`Starting conversation with user: ${userId}`);
    
    const response = await api.post<any>(`/api/messages/conversations/${userId}`);
    console.log('Conversation started:', response);
    
    return response;
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
}

/**
 * Delete a message
 * @param messageId - The message ID to delete
 * @returns Promise<{message: string}>
 */
export async function deleteMessage(messageId: string): Promise<{message: string}> {
  try {
    console.log(`Deleting message: ${messageId}`);
    
    const response = await api.delete<{message: string}>(`/api/messages/${messageId}`);
    console.log('Message deleted:', response);
    
    return response;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
} 