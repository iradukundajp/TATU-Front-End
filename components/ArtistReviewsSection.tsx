import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { TouchableFix } from '@/components/TouchableFix';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewModal } from '@/components/ReviewModal';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ArtistReviewsSectionProps {
  artistId: string;
  artistName: string;
  canLeaveReview?: boolean;
  maxPreviewReviews?: number;
  onUserPress?: (userId: string) => void;
}

export const ArtistReviewsSection: React.FC<ArtistReviewsSectionProps> = ({
  artistId,
  artistName,
  canLeaveReview = false,
  maxPreviewReviews = 5,
  onUserPress,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleReviewSubmitted = () => {
    // The ReviewsList component will automatically refresh when new reviews are added
    console.log('Review submitted for artist:', artistId);
  };

  return (
    <View style={styles.container}>
      {canLeaveReview && (
        <View style={styles.actionContainer}>
          <TouchableFix
            style={styles.writeReviewButton}
            onPress={() => setShowReviewModal(true)}
          >
            <IconSymbol name="star.fill" size={16} color="#FFFFFF" />
            <ThemedText style={styles.writeReviewText}>Write a Review</ThemedText>
          </TouchableFix>
        </View>
      )}

      <ReviewsList
        artistId={artistId}
        showStats={true}
        maxReviews={maxPreviewReviews}
        onUserPress={onUserPress}
      />

      <ReviewModal
        visible={showReviewModal}
        artistId={artistId}
        artistName={artistName}
        onClose={() => setShowReviewModal(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  writeReviewButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  writeReviewText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 