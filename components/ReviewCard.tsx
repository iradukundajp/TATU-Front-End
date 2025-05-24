import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { StarRating } from '@/components/StarRating';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
  showArtistInfo?: boolean;
  onUserPress?: (userId: string) => void;
  onArtistPress?: (artistId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showArtistInfo = false,
  onUserPress,
  onArtistPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
      }
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleUserPress = () => {
    if (onUserPress) {
      onUserPress(review.userId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={handleUserPress}
          activeOpacity={onUserPress ? 0.7 : 1}
        >
          {review.user.avatarUrl ? (
            <Image source={{ uri: review.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <IconSymbol name="person.fill" size={16} color="#999999" />
            </View>
          )}
          <View style={styles.userDetails}>
            <ThemedText style={styles.userName}>{review.user.name}</ThemedText>
            <ThemedText style={styles.reviewDate}>{formatDate(review.createdAt)}</ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.ratingContainer}>
          <StarRating rating={review.rating} size={16} />
        </View>
      </View>

      {review.comment && (
        <View style={styles.commentContainer}>
          <ThemedText style={styles.comment}>{review.comment}</ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999999',
  },
  ratingContainer: {
    marginLeft: 12,
  },
  commentContainer: {
    marginTop: 4,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
}); 