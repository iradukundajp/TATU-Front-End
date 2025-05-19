import { api } from './api.service';
import { Artist, ArtistSearchParams } from '../types/artist';
import { Booking, CreateBookingData } from '../types/booking';
import { PortfolioItem } from '../types/portfolio';

/**
 * Get a list of artists based on search params
 * @param params - Search parameters
 * @returns Promise with artists
 */
export const searchArtists = async (params?: ArtistSearchParams): Promise<Artist[]> => {
  try {
    return await api.get<Artist[]>('/api/artists', { params });
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
};

/**
 * Get featured artists for home page
 * @param limit - Number of artists to fetch
 * @returns Promise with featured artists
 */
export const getFeaturedArtists = async (limit: number = 5): Promise<Artist[]> => {
  try {
    return await api.get<Artist[]>('/api/users/featured', {
      params: { limit }
    });
  } catch (error) {
    console.error('Error fetching featured artists:', error);
    throw error;
  }
};

/**
 * Get artist by ID
 * @param artistId - Artist ID
 * @returns Promise with artist details
 */
export const getArtistById = async (artistId: string): Promise<Artist> => {
  try {
    return await api.get<Artist>(`/api/artists/${artistId}`);
  } catch (error) {
    console.error('Error fetching artist details:', error);
    throw error;
  }
};

/**
 * Get artist portfolio
 * @param artistId - Artist ID
 * @returns Promise with portfolio items
 */
export const getArtistPortfolio = async (artistId: string): Promise<PortfolioItem[]> => {
  try {
    return await api.get<PortfolioItem[]>(`/api/portfolio/${artistId}`);
  } catch (error) {
    console.error('Error fetching artist portfolio:', error);
    throw error;
  }
};

/**
 * Book an appointment with an artist
 * @param bookingData - Booking data
 * @returns Promise with the created booking
 */
export const bookAppointment = async (bookingData: CreateBookingData): Promise<Booking> => {
  try {
    return await api.post<Booking>('/api/bookings', bookingData);
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw error;
  }
};

/**
 * Get available time slots for an artist on a specific date
 * @param artistId - Artist ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise with available time slots
 */
export const getAvailableTimeSlots = async (
  artistId: string, 
  date: string
): Promise<{ startHour: number; endHour: number }[]> => {
  try {
    return await api.get<{ startHour: number; endHour: number }[]>(
      `/api/artists/${artistId}/available-slots`,
      { params: { date } }
    );
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    throw error;
  }
}; 