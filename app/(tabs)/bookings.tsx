import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, Alert, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Booking } from '@/types/booking';
import * as bookingService from '@/services/booking.service';

export default function BookingsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    // Fetch user's bookings
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load your bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
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
              const updatedBooking = await bookingService.cancelBooking(id);
              setBookings(current =>
                current.map(booking =>
                  booking.id === id ? updatedBooking : booking
                )
              );
              Alert.alert('Success', 'Your booking has been cancelled');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
          style: 'destructive'
        }
      ]
    );
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

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.artistInfo}>
          {item.artistAvatar ? (
            <Image source={{ uri: item.artistAvatar }} style={styles.artistAvatar} />
          ) : (
            <View style={styles.artistAvatarPlaceholder}>
              <IconSymbol name="person.fill" size={18} color="#555555" />
            </View>
          )}
          <ThemedText style={styles.artistName}>{item.artistName}</ThemedText>
        </View>
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
            onPress={() => Alert.alert('Coming Soon', 'Review functionality will be available soon')}
          >
            <IconSymbol name="star.fill" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Leave Review</ThemedText>
          </TouchableFix>
        )}
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to view your bookings</ThemedText>
      </ThemedView>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>My Bookings</ThemedText>
      
      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="calendar" size={60} color="#555555" />
          <ThemedText style={styles.emptyStateText}>No bookings yet</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>Explore artists to book your first tattoo session!</ThemedText>
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  reviewButton: {
    backgroundColor: '#FFC107',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 