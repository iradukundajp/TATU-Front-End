import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, View, AppState } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ConversationList } from '@/components/ConversationList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { Conversation } from '@/types/message';

export default function MessagesScreen() {
  const { isAuthenticated, user } = useAuth();
  const { 
    conversations, 
    loading, 
    error, 
    loadConversations, 
    isConnected, 
    connectionState 
  } = useMessages();
  const { showSuccessNotification, showErrorNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  // Use focus effect to load conversations when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Messages screen focused - loading conversations via WebSocket');
      if (isAuthenticated && isConnected) {
        loadConversations();
      }
    }, [isAuthenticated, isConnected, loadConversations])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isConnected) {
        loadConversations();
        showSuccessNotification('Refreshed', 'Conversations updated successfully');
      } else {
        showErrorNotification('Connection Error', 'Unable to refresh - not connected to server');
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      showErrorNotification('Refresh Failed', 'Unable to refresh conversations');
    } finally {
      setRefreshing(false);
    }
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
        <View style={styles.headerRight}>
          <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <TouchableOpacity 
            style={styles.newMessageButton}
            onPress={handleNewMessage}
          >
            <IconSymbol name="square.and.pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
