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