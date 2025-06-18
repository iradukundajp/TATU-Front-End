import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  AppState,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { Message } from '@/types/message';
import * as aftercareService from '@/services/aftercare.service';

function AftercareMessageBubble({ aftercareData, isMyMessage, router }: { aftercareData: { bookingId: string; aftercareId: string }, isMyMessage: boolean, router: any }) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    async function fetchPreview() {
      if (aftercareData && aftercareData.aftercareId) {
        try {
          const data = await aftercareService.getAftercare(aftercareData.bookingId);
          if (isMounted && data && data.images && data.images.length > 0) {
            setPreviewImage(data.images[0]);
          }
        } catch {}
      }
    }
    fetchPreview();
    return () => { isMounted = false; };
  }, [aftercareData]);
  return (
    <View style={[
      styles.messageBubble,
      isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
    ]}>
      <ThemedText style={styles.messageText}>
        {isMyMessage ? 'You sent aftercare instructions.' : 'Aftercare instructions have been sent.'}
      </ThemedText>
      {previewImage && (
        <Image
          source={{ uri: previewImage }}
          style={styles.aftercarePreviewImage}
        />
      )}
      <TouchableOpacity
        style={styles.aftercareButton}
        onPress={() => router.push(`/aftercare/${aftercareData.bookingId}`)}
      >
        <ThemedText style={styles.aftercareButtonText}>View Aftercare</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export default function ChatScreen() {
  const { id: conversationId, otherUserId, otherUserName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { 
    messages, 
    loading, 
    error, 
    sendMessage: sendWebSocketMessage, 
    markMessagesAsRead, 
    loadMessages, 
    setTyping, 
    typingUsers, 
    isConnected, 
    connectionState 
  } = useMessages(typeof conversationId === 'string' ? conversationId : undefined);
  
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use focus effect to mark messages as read when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (conversationId && typeof conversationId === 'string' && isConnected) {
        markMessagesAsRead(conversationId);
      }
    }, [conversationId, isConnected, markMessagesAsRead])
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (typeof conversationId === 'string' && isConnected) {
        loadMessages(conversationId);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || typeof conversationId !== 'string') return;

    try {
      setSending(true);
      await sendWebSocketMessage(conversationId, newMessage.trim(), 'text');
      setNewMessage('');
      
      // Stop typing indicator
      setTyping(conversationId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicators
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    if (typeof conversationId === 'string' && isConnected) {
      // Start typing indicator
      setTyping(conversationId, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(conversationId, false);
      }, 2000);
    }
  };

  // Get typing users for current conversation
  const currentTypingUsers = typingUsers[conversationId as string] || [];
  const otherUsersTyping = currentTypingUsers.filter(userId => userId !== user?.id);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;

    // Handle aftercare message type
    if (item.messageType === 'aftercare') {
      let aftercareData: { bookingId: string; aftercareId: string } | null = null;
      try {
        aftercareData = JSON.parse(item.content);
      } catch (e) {
        // fallback: show raw content
      }
      return (
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          {aftercareData && (
            <AftercareMessageBubble aftercareData={aftercareData} isMyMessage={isMyMessage} router={router} />
          )}
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {/* Add sender name for debugging */}
        {!isMyMessage && (
          <ThemedText style={styles.senderName}>
            {otherUserName}
          </ThemedText>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <ThemedText style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </ThemedText>
          <ThemedText style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="message" size={64} color="#555555" />
      <ThemedText style={styles.emptyTitle}>Start the conversation</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Send your first message to {otherUserName}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {otherUserName || 'Chat'}
            </ThemedText>
            <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          </View>
          {otherUsersTyping.length > 0 && (
            <ThemedText style={styles.typingIndicator}>
              {otherUsersTyping.length === 1 ? 'typing...' : `${otherUsersTyping.length} people typing...`}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={!loading ? EmptyState : null}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />

        {/* Message Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <IconSymbol 
              name={sending ? "hourglass" : "paperplane.fill"} 
              size={20} 
              color={(!newMessage.trim() || sending) ? "#666666" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  otherMessageBubble: {
    backgroundColor: '#333333',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#444444',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#AAAAAA',
  },
  senderName: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  aftercareButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  aftercareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  aftercarePreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
});