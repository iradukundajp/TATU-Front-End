export interface PortfolioItem {
  id: string;
  artistId: string;
  imageUrl: string;
  caption: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddPortfolioItemData {
  imageUrl: string;
  caption: string;
  tags?: string[];
}

export interface UpdatePortfolioItemData {
  caption?: string;
  tags?: string[];
}

// Represents the structure of an image object within the API response's "images" array
export interface PortfolioImageAPI {
  id: string;
  url: string;
  caption: string;
  portfolioId: string;
}

// Represents the overall structure of the response from getArtistPortfolio API endpoint
export interface ArtistPortfolioAPIResponse {
  id: string; // The portfolio's own ID
  artistId: string;
  styles: string[];
  about: string;
  // artist: Artist; // Or a more specific type if needed for the nested artist object
  images: PortfolioImageAPI[];
}