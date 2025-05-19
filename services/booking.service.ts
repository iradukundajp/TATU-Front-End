import { api } from './api.service';
import { Booking, CreateBookingData, UpdateBookingStatusData, BookingStatus } from '../types/booking';

/**
 * Get all bookings for the current user (client view)
 * @returns Promise with bookings
 */
export const getMyBookings = async (): Promise<Booking[]> => {
  try {
    return await api.get<Booking[]>('/api/bookings/me');
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    throw error;
  }
};

/**
 * Get all bookings for the artist (artist view)
 * @returns Promise with bookings
 */
export const getArtistBookings = async (): Promise<Booking[]> => {
  try {
    return await api.get<Booking[]>('/api/bookings/artist');
  } catch (error) {
    console.error('Error fetching artist bookings:', error);
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
    return await api.post<Booking>('/api/bookings', data);
  } catch (error) {
    console.error('Error creating booking:', error);
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
    return await api.patch<Booking>(`/api/bookings/${bookingId}/status`, data);
  } catch (error) {
    console.error('Error updating booking status:', error);
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
    return await updateBookingStatus(bookingId, { status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Confirm a booking (artist only)
 * @param bookingId - Booking ID
 * @returns Promise with the updated booking
 */
export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  try {
    return await updateBookingStatus(bookingId, { status: 'confirmed' });
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};

/**
 * Complete a booking (artist only)
 * @param bookingId - Booking ID
 * @returns Promise with the updated booking
 */
export const completeBooking = async (bookingId: string): Promise<Booking> => {
  try {
    return await updateBookingStatus(bookingId, { status: 'completed' });
  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
}; 