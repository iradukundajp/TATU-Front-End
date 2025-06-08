import { ImageSourcePropType } from 'react-native';

export interface TattooPlacement {
  id: string; // Unique identifier for this specific placement instance
  tattooId?: string; // ID of the original tattoo design (from SelectableTattooItem)
  tattooTitle?: string; // Optional: Title of the tattoo design for display purposes
  imageRequire?: ImageSourcePropType; // For static, bundled assets (require() output)
  customImageUri?: string; // For user-uploaded image URIs
  initialWidth: number;  // Initial width percentage when tattoo was added
  initialHeight: number; // Initial height percentage when tattoo was added
  x: number;           // Position on the mannequin (percentage from left)
  y: number;           // Position on the mannequin (percentage from top)
  width: number;       // Current width (percentage of mannequin width)
  height: number;      // Current height (percentage of mannequin height)
  rotation: number;    // Rotation in degrees
  zIndex: number;      // For layering tattoos
}

export interface AvatarConfiguration {
  baseMannequinId: string; // Identifier for the base mannequin style
  tattoos: TattooPlacement[];
}

export interface SelectableTattooItem {
  id: string;
  title?: string;
  imageUrl?: string; // URL for tattoos fetched from backend
  imageRequire?: ImageSourcePropType; // For static, bundled assets (require() output)
  // Potentially other metadata like artist, style, etc.
}
