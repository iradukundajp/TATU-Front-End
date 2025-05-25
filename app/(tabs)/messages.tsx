import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, View, AppState } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScreenFocused = useRef(false);

  // Use focus effect to control polling
  useFocusEffect(
    React.useCallback(() => {
      isScreenFocused.current = true;
      if (isAuthenticated) {
        loadConversations();
        startConversationPolling();
      }

      return () => {
        isScreenFocused.current = false;
        stopConversationPolling();
      };
    }, [isAuthenticated])
  );

  useEffect(() => {
    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isAuthenticated && isScreenFocused.current) {
        loadConversations(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopConversationPolling();
    };
  }, [isAuthenticated]);

  const startConversationPolling = () => {
    // Only poll if screen is focused and user is authenticated
    if (!isScreenFocused.current || !isAuthenticated) return;
    
    // Clear any existing interval
    stopConversationPolling();
    
    // Poll for conversation updates every 10 seconds (less frequent)
    pollIntervalRef.current = setInterval(() => {
      if (isAuthenticated && isScreenFocused.current) {
        loadConversations(false);
      } else {
        stopConversationPolling();
      }
    }, 10000);
  };

  const stopConversationPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await messageService.getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load conversations');
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
    await loadConversations(false);
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

  const handleBackPress = () => {
    router.back();
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Messages</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Messages</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 24,
    height: 24,
  },
});
