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
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as messageService from '@/services/message.service';
import { Message } from '@/types/message';

export default function ChatScreen() {
  const { id: conversationId, otherUserId, otherUserName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCountRef = useRef(0);
  const isScreenFocused = useRef(false);

  // Use focus effect to control polling
  useFocusEffect(
    React.useCallback(() => {
      isScreenFocused.current = true;
      if (conversationId && typeof conversationId === 'string') {
        loadMessages();
        markMessagesAsRead();
        startMessagePolling();
      }

      return () => {
        isScreenFocused.current = false;
        stopMessagePolling();
      };
    }, [conversationId])
  );

  useEffect(() => {
    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isScreenFocused.current) {
        // App came to foreground, refresh messages
        loadMessages(false);
        markMessagesAsRead();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopMessagePolling();
    };
  }, []);

  const startMessagePolling = () => {
    // Only poll if screen is focused
    if (!isScreenFocused.current || !conversationId) return;
    
    // Clear any existing interval
    stopMessagePolling();
    
    // Poll for new messages every 5 seconds (less frequent than before)
    pollIntervalRef.current = setInterval(() => {
      if (isScreenFocused.current && typeof conversationId === 'string') {
        loadMessages(false);
      } else {
        stopMessagePolling();
      }
    }, 5000);
  };

  const stopMessagePolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      if (typeof conversationId === 'string') {
        const response = await messageService.getConversationMessages(conversationId);
        const newMessages = response.messages;
        
        // Only update if there are new messages
        if (newMessages.length !== lastMessageCountRef.current) {
          setMessages(newMessages);
          lastMessageCountRef.current = newMessages.length;
          
          // Auto-scroll to bottom only if there are new messages and we're not manually refreshing
          if (!refreshing && newMessages.length > messages.length) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages(false);
    await markMessagesAsRead();
  };

  const markMessagesAsRead = async () => {
    try {
      if (typeof conversationId === 'string') {
        await messageService.markMessagesAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !otherUserId || typeof otherUserId !== 'string') return;

    try {
      setSending(true);
      const message = await messageService.sendMessage({
        receiverId: otherUserId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      // Add message to local state immediately
      setMessages(prev => {
        const newMessages = [...prev, message];
        lastMessageCountRef.current = newMessages.length;
        return newMessages;
      });
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
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
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {otherUserName || 'Chat'}
          </ThemedText>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  otherMessageBubble: {
    backgroundColor: '#333333',
    borderBottomLeftRadius: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
}); 