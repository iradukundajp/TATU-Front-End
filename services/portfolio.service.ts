import { api, apiRequest } from './api.service';
import { PortfolioItem, AddPortfolioItemData, UpdatePortfolioItemData } from '../types/portfolio';

/**
 * Get all portfolio items for an artist
 * @param artistId - The artist ID
 * @returns Promise with portfolio items
 */
export const getArtistPortfolio = async (artistId: string): Promise<PortfolioItem[]> => {
  try {
    return await api.get<PortfolioItem[]>(`/api/portfolio/${artistId}`);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
};

/**
 * Get the current artist's portfolio
 * @returns Promise with portfolio items
 */
export const getMyPortfolio = async (): Promise<PortfolioItem[]> => {
  try {
    return await api.get<PortfolioItem[]>('/api/portfolio/me');
  } catch (error) {
    console.error('Error fetching my portfolio:', error);
    throw error;
  }
};

/**
 * Add a new portfolio item
 * @param data - Portfolio item data
 * @returns Promise with the created portfolio item
 */
export const addPortfolioItem = async (data: AddPortfolioItemData): Promise<PortfolioItem> => {
  try {
    return await api.post<PortfolioItem>('/api/portfolio', data);
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    throw error;
  }
};

/**
 * Update a portfolio item
 * @param id - Portfolio item ID
 * @param data - Data to update
 * @returns Promise with the updated portfolio item
 */
export const updatePortfolioItem = async (id: string, data: UpdatePortfolioItemData): Promise<PortfolioItem> => {
  try {
    return await api.patch<PortfolioItem>(`/api/portfolio/${id}`, data);
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    throw error;
  }
};

/**
 * Delete a portfolio item
 * @param id - Portfolio item ID
 * @returns Promise with success flag
 */
export const deletePortfolioItem = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting portfolio item with ID: ${id}`);
    const response = await api.delete(`/api/portfolio/${id}`);
    console.log('Delete response:', response);
    return true;
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    throw error;
  }
};

/**
 * Upload an image for portfolio
 * @param formData - FormData with the image file
 * @returns Promise with the imageUrl
 */
export const uploadPortfolioImage = async (formData: FormData): Promise<{ imageUrl: string }> => {
  try {
    // Use api.post which now correctly handles FormData
    return await api.post<{ imageUrl: string }>('/api/portfolio/images', formData);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 