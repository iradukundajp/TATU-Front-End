// services/booking.service.ts

import { api } from './api.service';
import { Booking, CreateBookingData, UpdateBookingStatusData, BookingStatus } from '../types/booking';

// Flag to enable fallback to mock data during development
// Set to false when your API is properly working
const USE_MOCK_FALLBACK = false;

/**
 * Get all bookings for the current user (client view)
 * @returns Promise with bookings
 */
export const getMyBookings = async (): Promise<Booking[]> => {
  try {
    console.log('Fetching my bookings');
    
    // Try the new endpoint first (what the app expects)
    try {
      return await api.get<Booking[]>('/api/bookings/me');
    } catch (error: any) {
      // If the new endpoint fails with 404, try the original endpoint
      if (error?.status === 404) {
        console.log('Endpoint /api/bookings/me not found, trying /api/bookings/user');
        return await api.get<Booking[]>('/api/bookings/user');
      }
      throw error; // Rethrow if it's not a 404
    }
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    
    // Use mock fallback if enabled and in development mode
    if (USE_MOCK_FALLBACK && __DEV__) {
      console.warn('Using mock booking data as fallback');
      return getMockBookings();
    }
    
    throw error;
  }
};

/**
 * Get all bookings for the artist (artist view)
 * @returns Promise with bookings
 */
export const getArtistBookings = async (): Promise<Booking[]> => {
  try {
    console.log('Fetching artist bookings');
    return await api.get<Booking[]>('/api/bookings/artist');
  } catch (error) {
    console.error('Error fetching artist bookings:', error);
    
    // Use mock fallback if enabled and in development mode
    if (USE_MOCK_FALLBACK && __DEV__) {
      console.warn('Using mock artist booking data as fallback');
      return getMockArtistBookings();
    }
    
    throw error;
  }
};

/**
 * Create a new booking request
 * @param data - Booking data
 * @returns Promise with the created booking
 */
export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  try {
    console.log('Creating booking with data:', data);
    return await api.post<Booking>('/api/bookings', data);
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Use mock fallback if enabled and in development mode
    if (USE_MOCK_FALLBACK && __DEV__) {
      console.warn('Using mock response for create booking');
      return getMockCreatedBooking(data);
    }
    
    throw error;
  }
};

/**
 * Update booking status
 * @param bookingId - Booking ID
 * @param data - Status update data
 * @returns Promise with the updated booking
 */
export const updateBookingStatus = async (bookingId: string, data: UpdateBookingStatusData): Promise<Booking> => {
  try {
    console.log(`Updating booking ${bookingId} status to ${data.status}`);
    
    // Try PATCH first (the method the app expects)
    try {
      return await api.patch<Booking>(`/api/bookings/${bookingId}/status`, data);
    } catch (error: any) {
      // If PATCH fails with 404 or 405 (method not allowed), try PUT
      if (error?.status === 404 || error?.status === 405) {
        console.log('PATCH method failed, trying PUT method');
        return await api.put<Booking>(`/api/bookings/${bookingId}/status`, data);
      }
      throw error; // Rethrow if it's not a 404/405
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    
    // Use mock fallback if enabled and in development mode
    if (USE_MOCK_FALLBACK && __DEV__) {
      console.warn('Using mock response for update booking status');
      return getMockUpdatedBooking(bookingId, data.status);
    }
    
    throw error;
  }
};

/**
 * Cancel a booking
 * @param bookingId - Booking ID
 * @returns Promise with the updated booking
 */
export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  try {
    console.log(`Cancelling booking ${bookingId}`);
    
    // Try the generic status update first
    try {
      return await updateBookingStatus(bookingId, { status: 'cancelled' });
    } catch (error) {
      // If that fails, try the dedicated cancel endpoint
      console.log('Status update failed, trying dedicated cancel endpoint');
      return await api.put<Booking>(`/api/bookings/${bookingId}/cancel`, {});
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    // Use mock fallback if enabled and in development mode
    if (USE_MOCK_FALLBACK && __DEV__) {
      console.warn('Using mock response for cancel booking');
      return getMockUpdatedBooking(bookingId, 'cancelled');
    }
    
    throw error;
  }
};

/**
 * Confirm a booking (artist only)
 * @param bookingId - Booking ID
 * @returns Promise with the updated booking
 */
export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  console.log(`Confirming booking ${bookingId}`);
  return await updateBookingStatus(bookingId, { status: 'confirmed' });
};

/**
 * Complete a booking (artist only)
 * @param bookingId - Booking ID
 * @returns Promise with the updated booking
 */
export const completeBooking = async (bookingId: string): Promise<Booking> => {
  console.log(`Completing booking ${bookingId}`);
  return await updateBookingStatus(bookingId, { status: 'completed' });
};

// MOCK DATA FUNCTIONS - Only used if USE_MOCK_FALLBACK is true
// You can disable these by setting USE_MOCK_FALLBACK to false

function getMockBookings(): Booking[] {
  return [
    {
      id: 'mock-booking-1',
      artistId: 'artist-1',
      clientId: 'client-1',
      clientName: 'You',
      artistName: 'Ink Master',
      artistAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 120,
      status: 'pending',
      note: 'Traditional sleeve design',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-booking-2',
      artistId: 'artist-2',
      clientId: 'client-1',
      clientName: 'You',
      artistName: 'Color Queen',
      artistAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90,
      status: 'completed',
      note: 'Watercolor flower design',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

function getMockArtistBookings(): Booking[] {
  return [
    {
      id: 'mock-booking-3',
      artistId: 'current-artist',
      clientId: 'client-2',
      clientName: 'John Doe',
      artistName: 'You',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90,
      status: 'pending',
      note: 'Small dragon design on forearm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-booking-4',
      artistId: 'current-artist',
      clientId: 'client-3',
      clientName: 'Jane Smith',
      artistName: 'You',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 180,
      status: 'confirmed',
      note: 'Custom portrait on shoulder',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function getMockCreatedBooking(data: CreateBookingData): Booking {
  return {
    id: 'new-booking-' + Date.now(),
    artistId: data.artistId,
    clientId: 'current-user-id',
    clientName: 'You',
    artistName: 'Requested Artist',
    date: data.date,
    duration: data.duration,
    status: 'pending',
    note: data.note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getMockUpdatedBooking(id: string, status: BookingStatus): Booking {
  // First check if the booking is in mock data
  const allMockBookings = [...getMockBookings(), ...getMockArtistBookings()];
  const existingBooking = allMockBookings.find(b => b.id === id);
  
  if (existingBooking) {
    return {
      ...existingBooking,
      status,
      updatedAt: new Date().toISOString()
    };
  }
  
  // Fallback mock booking
  return {
    id,
    artistId: 'mock-artist-id',
    clientId: 'mock-client-id',
    clientName: 'Mock Client',
    artistName: 'Mock Artist',
    date: new Date().toISOString(),
    duration: 60,
    status,
    note: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}