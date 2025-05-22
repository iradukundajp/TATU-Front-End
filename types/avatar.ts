export interface TattooPlacement {
  tattooId: string;    // Identifier for a specific tattoo design asset
  x: number;           // Position on the mannequin
  y: number;
  width: number;       // Size
  height: number;
  rotation: number;    // Rotation in degrees
  zIndex: number;      // For layering tattoos
}

export interface AvatarConfiguration {
  baseMannequinId: string; // Identifier for the base mannequin style
  tattoos: TattooPlacement[];
}
