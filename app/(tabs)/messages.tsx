import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ConversationList } from '@/components/ConversationList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as messageService from '@/services/message.service';
import { Conversation } from '@/types/message';

export default function MessagesScreen() {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to chat screen with conversation data
    const chatPath = `/chat/${conversation.id}?otherUserId=${conversation.otherUser.id}&otherUserName=${encodeURIComponent(conversation.otherUser.name)}` as const;
    router.push(chatPath as any);
  };

  const handleNewMessage = () => {
    // Navigate to user selection screen or artist list
    const artistsPath = '/artists' as const;
    router.push(artistsPath as any);
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <IconSymbol name="lock.fill" size={64} color="#555555" />
          <ThemedText style={styles.notAuthenticatedTitle}>Login Required</ThemedText>
          <ThemedText style={styles.notAuthenticatedText}>
            Please log in to view your messages
          </ThemedText>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <IconSymbol name="ellipsis" size={32} color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading conversations...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={handleNewMessage}
        >
          <IconSymbol name="square.and.pencil" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ConversationList
        conversations={conversations}
        onConversationPress={handleConversationPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newMessageButton: {
    padding: 8,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
  },
});
