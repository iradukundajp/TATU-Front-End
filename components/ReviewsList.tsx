import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Review, ReviewStatsResponse } from '@/types/review';
import * as reviewService from '@/services/review.service';

interface ReviewsListProps {
  artistId: string;
  showStats?: boolean;
  maxReviews?: number;
  onUserPress?: (userId: string) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  artistId,
  showStats = true,
  maxReviews,
  onUserPress,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    if (showStats) {
      fetchStats();
    }
  }, [artistId, showStats]);

  const fetchReviews = async () => {
    try {
      setError(null);
      const data = await reviewService.getArtistReviews(artistId);
      
      // Limit reviews if maxReviews is specified
      const reviewsToShow = maxReviews ? data.slice(0, maxReviews) : data;
      setReviews(reviewsToShow);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await reviewService.getArtistReviewStats(artistId);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching review stats:', error);
      // Don't set error for stats as it's not critical
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
    if (showStats) {
      fetchStats();
    }
  };

  const handleRetry = () => {
    setLoading(true);
    fetchReviews();
    if (showStats) {
      fetchStats();
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      onUserPress={onUserPress}
    />
  );

  const renderHeader = () => {
    if (!showStats || !stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <ThemedText style={styles.statsTitle}>Reviews</ThemedText>
          <View style={styles.ratingContainer}>
            <StarRating rating={Math.round(stats.averageRating)} size={20} />
            <ThemedText style={styles.averageRating}>
              {stats.averageRating.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.totalReviews}>
              ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="star" size={48} color="#CCCCCC" />
      <ThemedText style={styles.emptyStateText}>No reviews yet</ThemedText>
      <ThemedText style={styles.emptyStateSubtext}>
        Be the first to leave a review for this artist!
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <IconSymbol name="exclamationmark.triangle" size={48} color="#F44336" />
      <ThemedText style={styles.errorTitle}>Unable to Load Reviews</ThemedText>
      <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
      <TouchableFix style={styles.retryButton} onPress={handleRetry}>
        <IconSymbol name="arrow.clockwise" size={16} color="#FFFFFF" />
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableFix>
    </View>
  );

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading reviews...</ThemedText>
      </View>
    );
  }

  if (error && reviews.length === 0) {
    return renderErrorState();
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          reviews.length === 0 && styles.emptyContainer,
        ]}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 4,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666666',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#999999',
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#F44336',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 