import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, Alert, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { ReviewModal } from '@/components/ReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Booking } from '@/types/booking';
import * as bookingService from '@/services/booking.service';
import { router } from 'expo-router';

export default function BookingsScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    visible: boolean;
    artistId: string;
    artistName: string;
  }>({
    visible: false,
    artistId: '',
    artistName: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    // Fetch user's bookings
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching bookings...");
      const data = await bookingService.getMyBookings();
      console.log("Fetched bookings:", data);
      
      // Sort bookings by date (most recent first)
      const sortedBookings = [...data].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setBookings(sortedBookings);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      
      // Handle specific error cases
      if (error?.status === 401) {
        console.log('Token expired or invalid - redirecting to login');
        setError('Your session has expired. Please log in again.');
        
        // Clear auth data and redirect to login
        if (logout) {
          await logout();
        }
        router.replace('/login');
        return;
      }
      
      // Handle network errors
      if (error?.status === 0 || error?.status === 408) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error?.message || 'Failed to load your bookings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleRetry = () => {
    fetchBookings();
  };

  const handleCancelBooking = async (id: string) => {
    // Confirmation before cancelling
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              console.log(`Cancelling booking with ID: ${id}`);
              const updatedBooking = await bookingService.cancelBooking(id);
              
              setBookings(current =>
                current.map(booking =>
                  booking.id === id ? updatedBooking : booking
                )
              );
              
              Alert.alert('Success', 'Your booking has been cancelled');
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              
              if (error?.status === 401) {
                Alert.alert('Session Expired', 'Please log in again to cancel your booking');
                if (logout) {
                  await logout();
                }
                router.replace('/login');
              } else {
                Alert.alert('Error', 'Failed to cancel booking');
              }
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleViewArtist = (artistId: string) => {
    const artistPath = `/artist/${artistId}` as const;
    router.push(artistPath as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const handleLeaveReview = (booking: Booking) => {
    setReviewModal({
      visible: true,
      artistId: booking.artistId,
      artistName: booking.artistName,
    });
  };

  const handleCloseReviewModal = () => {
    setReviewModal({
      visible: false,
      artistId: '',
      artistName: '',
    });
  };

  const handleReviewSubmitted = () => {
    // Optionally refresh bookings or show a success message
    console.log('Review submitted successfully');
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <TouchableOpacity 
          style={styles.artistInfo}
          onPress={() => handleViewArtist(item.artistId)}
        >
          {item.artistAvatar ? (
            <Image source={{ uri: item.artistAvatar }} style={styles.artistAvatar} />
          ) : (
            <View style={styles.artistAvatarPlaceholder}>
              <IconSymbol name="person.fill" size={18} color="#555555" />
            </View>
          )}
          <ThemedText style={styles.artistName}>{item.artistName}</ThemedText>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>{item.status}</ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
      <ThemedText style={styles.durationText}>{item.duration} minutes</ThemedText>
      
      {item.note && (
        <ThemedText style={styles.noteText}>{item.note}</ThemedText>
      )}
      
      <View style={styles.actionsContainer}>
        {(item.status === 'pending' || item.status === 'confirmed') && (
          <TouchableFix 
            style={[styles.actionButton, styles.cancelButton]} 
            onPress={() => handleCancelBooking(item.id)}
          >
            <IconSymbol name="xmark.circle.fill" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Cancel Booking</ThemedText>
          </TouchableFix>
        )}
        
        {item.status === 'completed' && (
          <TouchableFix 
            style={[styles.actionButton, styles.reviewButton]} 
            onPress={() => handleLeaveReview(item)}
          >
            <IconSymbol name="star.fill" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Leave Review</ThemedText>
          </TouchableFix>
        )}
        
        <TouchableFix 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={() => handleViewArtist(item.artistId)}
        >
          <IconSymbol name="person.fill" size={16} color="#FFFFFF" />
          <ThemedText style={styles.actionButtonText}>View Artist</ThemedText>
        </TouchableFix>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <IconSymbol name="person.crop.circle.badge.xmark" size={60} color="#555555" />
          <ThemedText style={styles.titleText}>Not Logged In</ThemedText>
          <ThemedText style={styles.subtitleText}>Please log in to view your bookings</ThemedText>
          <TouchableFix 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
          </TouchableFix>
        </View>
      </ThemedView>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading your bookings...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (error && bookings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <IconSymbol name="exclamationmark.triangle" size={60} color="#F44336" />
          <ThemedText style={styles.titleText}>Unable to Load Bookings</ThemedText>
          <ThemedText style={styles.subtitleText}>{error}</ThemedText>
          <TouchableFix 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <IconSymbol name="arrow.clockwise" size={16} color="#FFFFFF" />
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableFix>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>My Bookings</ThemedText>
      
      {error && (
        <View style={styles.errorBanner}>
          <IconSymbol name="exclamationmark.triangle" size={16} color="#F44336" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={handleRetry}>
            <IconSymbol name="arrow.clockwise" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
      
      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="calendar" size={60} color="#555555" />
          <ThemedText style={styles.emptyStateText}>No bookings yet</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>Explore artists to book your first tattoo session!</ThemedText>
          <TouchableFix 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <ThemedText style={styles.exploreButtonText}>Explore Artists</ThemedText>
          </TouchableFix>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <ReviewModal
        visible={reviewModal.visible}
        artistId={reviewModal.artistId}
        artistName={reviewModal.artistName}
        onClose={handleCloseReviewModal}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#999999',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: '#999999',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  errorBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: '#721C24',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyStateText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
    color: '#555555',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#555555',
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 24,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  artistAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#BBBBBB',
  },
  noteText: {
    fontSize: 14,
    marginBottom: 12,
    color: '#AAAAAA',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  reviewButton: {
    backgroundColor: '#FFC107',
  },
  viewButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});