import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
// import { Image } from 'expo-image'; // Comment out if only AvatarDisplayComponent is used for avatar
import { ThemedText } from '@/components/ThemedText';
import { StarRating } from '@/components/StarRating';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Artist } from '@/types/artist';
import { ReviewStatsResponse } from '@/types/review';
import * as reviewService from '@/services/review.service';
import { useAuth } from '@/contexts/AuthContext';
import AvatarDisplayComponent from '@/components/AvatarDisplayComponent'; // Import AvatarDisplayComponent

interface ArtistCardProps {
  artist: Artist;
  onPress: (artistId: string) => void;
  style?: any;
  showBookingButton?: boolean;
  showSendMessageButton?: boolean;
  onSendMessage?: (artistId: string) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onPress,
  style,
  showBookingButton = true,
  showSendMessageButton = true,
  onSendMessage,
}) => {
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  // const [avatarLoadError, setAvatarLoadError] = useState(false); // Removed
  // const [loggedBaseUrl, setLoggedBaseUrl] = useState(false); // Removed
  const { user: loggedInUser } = useAuth();

  useEffect(() => {
    fetchReviewStats();
    // console.log(`ArtistCard Effect: Artist ID: ${artist.id}, Initial avatarUrl: '${artist.avatarUrl}'`); // Old log
    // setAvatarLoadError(false); // Removed
    console.log(`ArtistCard Effect: Artist ID: ${artist.id}, Avatar Config:`, artist.avatarConfiguration ? 'Present' : 'Absent');
  }, [artist.id, artist.avatarConfiguration]); // Depend on avatarConfiguration

  const fetchReviewStats = async () => {
    try {
      const stats = await reviewService.getArtistReviewStats(artist.id);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error fetching review stats for artist:', artist.id, error);
      setReviewStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const displayRating = reviewStats?.averageRating || artist.rating || 0;
  const displayReviewCount = reviewStats?.totalReviews || artist.reviewCount || 0;

  let isViewingOwnCard = false;
  if (loggedInUser && loggedInUser.id !== null && artist && artist.id !== null) {
    if (String(loggedInUser.id) === String(artist.id)) {
      isViewingOwnCard = true;
    }
  }

  return (
    <TouchableOpacity 
      style={[styles.artistCard, style]}
      onPress={() => onPress(artist.id)}
      activeOpacity={0.7}
    >
      <View style={styles.artistImageContainer}>
        {/* Updated Avatar Display Logic */}
        {artist.avatarConfiguration ? (
          <AvatarDisplayComponent
            avatarConfiguration={artist.avatarConfiguration}
            isEditing={false}
            containerWidth={70} // Use numeric value from styles.artistImageContainer.width
            containerHeight={70} // Use numeric value from styles.artistImageContainer.height
          />
        ) : artist.avatarUrl ? (
            // Fallback for old avatarUrl - consider if this is needed
            <View style={styles.artistImagePlaceholder}>
                <IconSymbol name="person.circle.fill" size={49} color="#888888" /> {/* Numeric size: 70 * 0.7 */}
                <ThemedText style={{fontSize: 9, color: '#888888', textAlign: 'center', marginTop: 2}}>Legacy</ThemedText>
            </View>
        ) : (
          <View style={styles.artistImagePlaceholder}>
            <IconSymbol name="person.fill" size={49} color="#555555" /> {/* Numeric size: 70 * 0.7 */}
            <ThemedText style={{fontSize: 9, color: '#555555', textAlign: 'center', marginTop: 2}}>No Avatar</ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.artistInfo}>
        <ThemedText style={styles.artistName} numberOfLines={1}>{artist.name}</ThemedText>
        <ThemedText style={styles.artistLocation} numberOfLines={1}>{artist.location || 'Location not set'}</ThemedText>
        
        {artist.specialties && artist.specialties.length > 0 && (
          <View style={styles.detailRow}>
            <IconSymbol name="sparkles" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText} numberOfLines={1}>Specialties: {artist.specialties.join(', ')}</ThemedText>
          </View>
        )}

        {artist.styles && artist.styles.length > 0 && (
          <View style={styles.detailRow}>
            <IconSymbol name="paintbrush.fill" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText} numberOfLines={1}>Styles: {artist.styles.join(', ')}</ThemedText>
          </View>
        )}
        
        <View style={styles.artistRating}>
          {loadingStats ? (
            <View style={styles.ratingPlaceholder}><ThemedText style={styles.loadingText}>Loading...</ThemedText></View>
          ) : displayReviewCount > 0 ? (
            <>
              <StarRating rating={Math.round(displayRating)} size={14} starColor="#FFD700" emptyStarColor="#555555" />
              <ThemedText style={styles.averageRating}>{displayRating.toFixed(1)}</ThemedText>
              <ThemedText style={styles.reviewCount}>({displayReviewCount})</ThemedText>
            </>
          ) : (
            <ThemedText style={styles.noReviewsText}>No reviews yet</ThemedText>
          )}
        </View>

        {!isViewingOwnCard && (showBookingButton || showSendMessageButton) && (
          <View style={styles.actionButtonsContainer}>
            {showBookingButton && (
              <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Book Appointment with', artist.name)}>
                <IconSymbol name="calendar.badge.plus" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Book</ThemedText>
              </TouchableOpacity>
            )}
            {showSendMessageButton && (
              <TouchableOpacity 
                style={[styles.actionButton, !showBookingButton && styles.fullWidthButton]} 
                onPress={() => onSendMessage && onSendMessage(artist.id)}
              >
                <IconSymbol name="message.fill" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Message</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  artistCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 12, // Reduced padding
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  artistImageContainer: {
    width: 70, // Reduced size
    height: 70, // Reduced size
    borderRadius: 35, // Half of width/height
    backgroundColor: '#3A3A3C', // Placeholder background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure AvatarDisplayComponent respects border radius
    marginRight: 12, // Reduced margin
  },
  artistImage: { // Style for AvatarDisplayComponent container
    width: '100%',
    height: '100%',
  },
  artistImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
  },
  artistInfo: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
  },
  artistName: {
    fontSize: 17, // Slightly reduced
    fontWeight: '600', // Bolder
    color: '#EFEFF0',
    marginBottom: 2, // Reduced margin
  },
  artistLocation: {
    fontSize: 13, // Slightly reduced
    color: '#8E8E93',
    marginBottom: 4, // Reduced margin
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2, // Reduced margin
  },
  detailIcon: {
    marginRight: 5,
    color: '#8E8E93', // Consistent icon color
  },
  detailText: {
    fontSize: 12, // Reduced size
    color: '#C7C7CC',
    flexShrink: 1, // Allow text to shrink if needed
  },
  artistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Reduced margin
  },
  ratingPlaceholder: { /* For loading text */ },
  loadingText: { fontSize: 12, color: '#8E8E93' },
  averageRating: {
    fontSize: 12, // Reduced size
    color: '#EFEFF0',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12, // Reduced size
    color: '#8E8E93',
    marginLeft: 4,
  },
  noReviewsText: {
    fontSize: 12, // Reduced size
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8, // Reduced margin
    gap: 8, // Space between buttons
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A84FF',
    paddingVertical: 7, // Reduced padding
    paddingHorizontal: 10, // Reduced padding
    borderRadius: 8,
    flex: 1, // Allow buttons to share space
  },
  fullWidthButton: {
    // Styles if only one button is present, not strictly needed if flex:1 is used
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // Reduced size
    fontWeight: '500',
    marginLeft: 5,
  },
});