import { api } from './api.service';
import { Artist, ArtistSearchParams } from '../types/artist';
import { Booking, CreateBookingData } from '../types/booking';
// import { PortfolioItem } from '../types/portfolio'; // Old import
import { PortfolioItem, ArtistPortfolioAPIResponse } from '../types/portfolio'; // Import new type
import * as bookingService from './booking.service';

/**
 * Get a list of artists based on search params
 * @param params - Search parameters
 * @returns Promise with artists
 */
export const searchArtists = async (params?: ArtistSearchParams): Promise<Artist[]> => {
  try {
    const apiParams: Record<string, any> = { isArtist: true };
    if (params?.name) {
      apiParams.search = params.name;
    }
    if (params?.location) {
      apiParams.location = params.location;
    }
    if (params?.specialty) {
      apiParams.specialty = params.specialty;
    }
    if (params?.style) {
      apiParams.style = params.style;
    }
    if (params?.minRating) {
      apiParams.minRating = params.minRating;
    }
    if (params?.page) {
      apiParams.page = params.page;
    }
    if (params?.limit) {
      apiParams.limit = params.limit;
    }

    console.log('Searching artists with params:', apiParams);
    // The API /api/users returns an object { users: Artist[], pagination: ... }
    // We need to extract the users array.
    const response = await api.get<{ users: Artist[], pagination: any }>('/api/users', { params: apiParams });
    return response.users; // Return the array of artists directly
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
    // This endpoint is already correct
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
    console.log(`Fetching artist with ID: ${artistId}`);
    // Fixed: Use /api/users/:id instead of /api/artists/:id
    return await api.get<Artist>(`/api/users/${artistId}`);
  } catch (error) {
    console.error(`Error fetching artist with ID ${artistId}:`, error);
    throw error;
  }
};

/**
 * Get artist portfolio
 * @param artistId - Artist ID
 * @returns Promise with portfolio items
 */
export const getArtistPortfolio = async (artistId: string): Promise<ArtistPortfolioAPIResponse> => {
  try {
    // Use the correct portfolio endpoint and the new response type
    return await api.get<ArtistPortfolioAPIResponse>(`/api/portfolio/artist/${artistId}`);
  } catch (error) {
    console.error('Error fetching artist portfolio:', error);
    throw error;
  }
};

/**
 * Book an appointment with an artist
 * @param bookingData - Booking data
 * @returns Promise with the created booking
 * @deprecated Use bookingService.createBooking instead
 */
export const bookAppointment = async (bookingData: CreateBookingData): Promise<Booking> => {
  console.warn('artistService.bookAppointment is deprecated. Use bookingService.createBooking instead.');
  return bookingService.createBooking(bookingData);
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
    console.log(`Fetching available time slots for artist ${artistId} on date ${date}`);
    // Fixed: Use /api/users/:id endpoint for availability
    return await api.get<{ startHour: number; endHour: number }[]>(
      `/api/users/${artistId}/available-slots`,
      { params: { date } }
    );
  } catch (error) {
    console.error(`Error fetching available time slots for artist ${artistId}:`, error);
    // Return default business hours as fallback
    console.log('Using default business hours as fallback');
    return [{ startHour: 9, endHour: 17 }];
  }
};

/**
 * Get all artists with optional pagination
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise with artists and pagination info
 */
export const getAllArtists = async (page: number = 1, limit: number = 10): Promise<{
  artists: Artist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  try {
    console.log(`Fetching all artists - page ${page}, limit ${limit}`);
    // Use /api/users with isArtist filter
    const response = await api.get<any>('/api/users', { 
      params: { 
        page, 
        limit, 
        isArtist: true 
      } 
    });
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return {
        artists: response,
        pagination: {
          page: 1,
          limit: response.length,
          total: response.length,
          pages: 1
        }
      };
    }
    
    return {
      artists: response.users || response.artists || [],
      pagination: response.pagination || {
        page: 1,
        limit: limit,
        total: (response.users || response.artists || []).length,
        pages: 1
      }
    };
  } catch (error) {
    console.error('Error fetching all artists:', error);
    throw error;
  }
};