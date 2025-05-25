import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Conversation } from '@/types/message';

interface ConversationListProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationPress,
  onRefresh,
  refreshing = false,
}) => {
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.avatarUrl ? (
          <Image 
            source={{ uri: item.otherUser.avatarUrl }} 
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.fill" size={24} color="#AAAAAA" />
          </View>
        )}
        {item.otherUser.isArtist && (
          <View style={styles.artistBadge}>
            <IconSymbol name="paintbrush.fill" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.conversationInfo}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.userName} numberOfLines={1}>
            {item.otherUser.name}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatTime(item.lastMessageAt)}
          </ThemedText>
        </View>
        
        <View style={styles.messageRow}>
          <ThemedText 
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage 
              ? `${item.lastMessage.sender.id === item.otherUser.id ? '' : 'You: '}${item.lastMessage.content}`
              : 'No messages yet'
            }
          </ThemedText>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="message" size={64} color="#555555" />
      <ThemedText style={styles.emptyTitle}>No conversations yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Start a conversation with an artist to get started
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    flex: 1,
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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