import { api } from './api.service';
import { TattooDesign, TattooDesignFormData } from '../types/tattooDesign';

/**
 * Get all tattoo designs with filtering options
 */
export const getAllTattooDesigns = async (params?: {
  page?: number;
  limit?: number;
  style?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  categories?: string[];
}): Promise<{ designs: TattooDesign[]; pagination: any }> => {
  try {
    // Create a new object for query params instead of modifying the original
    const queryParams: Record<string, any> = { ...params };
    
    if (params?.categories && Array.isArray(params.categories)) {
      queryParams.categories = params.categories.join(',');
    }
    
    return await api.get('/api/tattoos', { params: queryParams });
  } catch (error) {
    console.error('Error fetching tattoo designs:', error);
    throw error;
  }
};

/**
 * Search tattoo designs by a query string
 * @param query - Search query string
 * @returns Promise with tattoo designs
 */
export const searchTattooDesigns = async (query: string): Promise<{ designs: TattooDesign[]; pagination: any }> => {
  try {
    return await api.get('/api/tattoos', { params: { search: query } });
  } catch (error) {
    console.error('Error searching tattoo designs:', error);
    throw error;
  }
};

/**
 * Get tattoo designs for a specific artist
 */
export const getArtistTattooDesigns = async (
  artistId: string,
  page = 1,
  limit = 10
): Promise<{ designs: TattooDesign[]; pagination: any }> => {
  try {
    return await api.get(`/api/tattoos/artist/${artistId}`, {
      params: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching artist tattoo designs:', error);
    throw error;
  }
};

/**
 * Get a specific tattoo design by ID
 */
export const getTattooDesignById = async (id: string): Promise<TattooDesign> => {
  try {
    return await api.get(`/api/tattoos/${id}`);
  } catch (error) {
    console.error('Error fetching tattoo design:', error);
    throw error;
  }
};

/**
 * Get the current artist's tattoo designs
 */
export const getMyTattooDesigns = async (): Promise<TattooDesign[]> => {
  try {
    return await api.get('/api/tattoos/my/designs');
  } catch (error) {
    console.error('Error fetching my tattoo designs:', error);
    throw error;
  }
};

/**
 * Create a new tattoo design
 */
export const createTattooDesign = async (formData: FormData): Promise<TattooDesign> => {
  try {
    return await api.post('/api/tattoos', formData);
  } catch (error) {
    console.error('Error creating tattoo design:', error);
    throw error;
  }
};

/**
 * Update a tattoo design
 */
export const updateTattooDesign = async (id: string, formData: FormData): Promise<TattooDesign> => {
  try {
    return await api.put(`/api/tattoos/${id}`, formData);
  } catch (error) {
    console.error('Error updating tattoo design:', error);
    throw error;
  }
};

/**
 * Delete a tattoo design
 */
export const deleteTattooDesign = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/tattoos/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting tattoo design:', error);
    throw error;
  }
};