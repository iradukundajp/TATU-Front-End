/**
 * Represents a tattoo design that artists offer for clients
 */
export interface TattooDesign {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  price?: number;
  size?: string;
  style: string;
  categories: string[];
  artistId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  artist?: {
    id: string;
    name: string;
    location?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

/**
 * Data needed to create a new tattoo design
 */
export interface TattooDesignFormData {
  title: string;
  description?: string;
  price?: number | string;
  size?: string;
  style: string;
  categories?: string[];
  isAvailable?: boolean;
} 