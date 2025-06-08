import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native'; // Added Dimensions
import { Image as ExpoImage } from 'expo-image'; // Renamed to avoid conflict
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView, // Required for gesture handler
} from 'react-native-gesture-handler';
import { AvatarConfiguration, TattooPlacement } from '@/types/avatar';
import { ThemedText } from './ThemedText';

// Mannequin dimensions - crucial for percentage calculations if needed later
// For now, we assume x, y, width, height in TattooPlacement are direct pixel values for simplicity of gesture handling.
// If they are percentages, conversion logic will be needed when reading from and writing to TattooPlacement.
const MANNEQUIN_WIDTH = 300; // Default, can be overridden by props
const MANNEQUIN_HEIGHT = 450; // Default, can be overridden by props

interface AvatarDisplayProps {
  avatarConfiguration?: AvatarConfiguration | null;
  onUpdateTattooPlacement?: (placementId: string, updates: Partial<TattooPlacement>) => void;
  isEditing?: boolean;
  containerWidth?: number; // New prop for dynamic width
  containerHeight?: number; // New prop for dynamic height
  onTattooInteractionStart?: () => void;
  onTattooInteractionEnd?: () => void;
  selectedTattooId?: string | null; // New prop: ID of the currently selected tattoo
  onSelectTattoo?: (tattooId: string | null) => void; // New prop: Callback when a tattoo is selected/deselected
}

const mannequinImages: { [key: string]: any } = {
  'male_standard': require('@/assets/images/avatar/mannequins/manequin-male.webp'),
  'female_standard': require('@/assets/images/avatar/mannequins/manequin-female.webp'),
};

// Individual Interactive Tattoo Component
interface InteractiveTattooProps {
  tattoo: TattooPlacement;
  onUpdate: (updates: Partial<TattooPlacement>) => void;
  isEditing?: boolean;
  containerWidth: number;
  containerHeight: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  isSelected?: boolean; // New prop: Is this tattoo currently selected for fine-tuning?
  onSelect?: (tattooId: string) => void; // New prop: Callback when this tattoo is tapped
}

const InteractiveTattoo: React.FC<InteractiveTattooProps> = ({
  tattoo,
  onUpdate,
  isEditing,
  containerWidth,
  containerHeight,
  onInteractionStart,
  onInteractionEnd,
  isSelected, // Destructure new prop
  onSelect,   // Destructure new prop
}) => {
  const initialPixelX = (tattoo.x / 100) * containerWidth;
  const initialPixelY = (tattoo.y / 100) * containerHeight;
  const initialPixelWidth = (tattoo.width / 100) * containerWidth;
  const initialPixelHeight = (tattoo.height / 100) * containerHeight;

  const translateX = useSharedValue(initialPixelX);
  const translateY = useSharedValue(initialPixelY);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(tattoo.rotation);
  const isInteracting = useSharedValue(false);

  const currentBaseX = useSharedValue(initialPixelX);
  const currentBaseY = useSharedValue(initialPixelY);
  const initialWidth = useSharedValue(initialPixelWidth);
  const initialHeight = useSharedValue(initialPixelHeight);
  const currentRotation = useSharedValue(tattoo.rotation);

  // Effect to update shared values if the tattoo prop itself changes (e.g., new tattoo selected)
  React.useEffect(() => {
    const newPixelX = (tattoo.x / 100) * containerWidth;
    const newPixelY = (tattoo.y / 100) * containerHeight;
    const newPixelWidth = (tattoo.width / 100) * containerWidth;
    const newPixelHeight = (tattoo.height / 100) * containerHeight;

    translateX.value = withTiming(newPixelX, { duration: 50 });
    translateY.value = withTiming(newPixelY, { duration: 50 });
    initialWidth.value = withTiming(newPixelWidth, { duration: 50 });
    initialHeight.value = withTiming(newPixelHeight, { duration: 50 });
    rotateZ.value = withTiming(tattoo.rotation, { duration: 50 });
    scale.value = 1; // Reset scale

    // Update base values for next gestures
    currentBaseX.value = newPixelX;
    currentBaseY.value = newPixelY;
    currentRotation.value = tattoo.rotation;
  }, [tattoo.id, tattoo.x, tattoo.y, tattoo.width, tattoo.height, tattoo.rotation, containerWidth, containerHeight]); // tattoo.id ensures it runs for a new tattoo

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(!!isEditing)
    .onBegin(() => {
      if (isEditing) {
        isInteracting.value = true;
        if (onInteractionStart) runOnJS(onInteractionStart)();
      }
    })
    .onUpdate((event) => {
      translateX.value = currentBaseX.value + event.translationX;
      translateY.value = currentBaseY.value + event.translationY;
    })
    .onEnd(() => {
      currentBaseX.value = translateX.value;
      currentBaseY.value = translateY.value;
      const newXPercent = (translateX.value / containerWidth) * 100;
      const newYPercent = (translateY.value / containerHeight) * 100;
      runOnJS(onUpdate)({ x: newXPercent, y: newYPercent });
      // Note: onFinalize will handle isInteracting.value = false and onInteractionEnd
    })
    .onFinalize(() => {
      if (isEditing) {
        isInteracting.value = false;
        if (onInteractionEnd) runOnJS(onInteractionEnd)();
      }
    });

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .enabled(!!isEditing)
    .onBegin(() => {
      if (isEditing) {
        isInteracting.value = true;
        if (onInteractionStart) runOnJS(onInteractionStart)();
      }
    })
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      const newWidth = initialWidth.value * scale.value;
      const newHeight = initialHeight.value * scale.value;
      initialWidth.value = newWidth;
      initialHeight.value = newHeight;
      scale.value = 1;
      const newWidthPercent = (newWidth / containerWidth) * 100;
      const newHeightPercent = (newHeight / containerHeight) * 100;
      runOnJS(onUpdate)({ width: newWidthPercent, height: newHeightPercent });
      // Note: onFinalize will handle isInteracting.value = false and onInteractionEnd
    })
    .onFinalize(() => {
      if (isEditing) {
        isInteracting.value = false;
        if (onInteractionEnd) runOnJS(onInteractionEnd)();
      }
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .enabled(!!isEditing)
    .onBegin(() => {
      if (isEditing) {
        isInteracting.value = true;
        if (onInteractionStart) runOnJS(onInteractionStart)();
      }
    })
    .onUpdate((event) => {
      rotateZ.value = currentRotation.value + event.rotation * (180 / Math.PI);
    })
    .onEnd(() => {
      currentRotation.value = rotateZ.value;
      runOnJS(onUpdate)({ rotation: rotateZ.value });
      // Note: onFinalize will handle isInteracting.value = false and onInteractionEnd
    })
    .onFinalize(() => {
      if (isEditing) {
        isInteracting.value = false;
        if (onInteractionEnd) runOnJS(onInteractionEnd)();
      }
    });

  // Compose gestures: Pan, Pinch, Rotate
  const composedManipulationGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

  // Tap gesture for selecting the tattoo
  const tapGesture = Gesture.Tap()
    .enabled(!!isEditing)
    .onEnd(() => {
      if (isEditing && onSelect) {
        runOnJS(onSelect)(tattoo.id);
      }
    });

  // Compose gestures: Manipulation gestures and Tap gesture (exclusive)
  const allGestures = Gesture.Exclusive(composedManipulationGesture, tapGesture);

  // Animated style for the tattoo
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: translateX.value,
      top: translateY.value,
      width: initialWidth.value * scale.value,
      height: initialHeight.value * scale.value,
      transform: [
        { rotateZ: `${rotateZ.value}deg` },
      ],
      zIndex: tattoo.zIndex,
      borderWidth: isInteracting.value || isSelected ? 2 : 0, // Show border if interacting OR selected
      borderColor: isInteracting.value ? 'yellow' : (isSelected ? '#00FFFF' : 'transparent'), // Yellow for interaction, Cyan for selection
    };
  });

  const imageSource = tattoo.customImageUri ? { uri: tattoo.customImageUri } : tattoo.imageRequire;

  if (!imageSource) {
    // Optionally, render a placeholder or return null if no image source is available
    console.warn('No image source for tattoo:', tattoo.id, tattoo.tattooTitle);
    return null;
  }

  return (
    <GestureDetector gesture={allGestures}>
      <Animated.View style={[styles.tattooWrapper, animatedStyle]}>
        <ExpoImage
          source={imageSource}
          style={styles.image}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};


const AvatarDisplayComponent: React.FC<AvatarDisplayProps> = ({
  avatarConfiguration,
  onUpdateTattooPlacement,
  isEditing,
  containerWidth: propContainerWidth,
  containerHeight: propContainerHeight,
  onTattooInteractionStart,
  onTattooInteractionEnd,
  selectedTattooId, // Destructure new prop
  onSelectTattoo,   // Destructure new prop
}) => {
  const displayWidth = propContainerWidth || MANNEQUIN_WIDTH;
  const displayHeight = propContainerHeight || MANNEQUIN_HEIGHT;

  if (!avatarConfiguration || !avatarConfiguration.baseMannequinId) {
    return <ThemedText>No avatar configuration set or mannequin ID missing.</ThemedText>;
  }

  const mannequinImageSource = mannequinImages[avatarConfiguration.baseMannequinId];

  const handleTattooUpdate = (placementId: string, updates: Partial<TattooPlacement>) => {
    if (onUpdateTattooPlacement) {
      onUpdateTattooPlacement(placementId, updates);
    }
  };

  return (
    <GestureHandlerRootView style={{ width: displayWidth, height: displayHeight }}>
      <View style={styles.container}>
        <ExpoImage
          source={mannequinImageSource}
          style={styles.mannequinImage}
          contentFit="contain"
        />
        {avatarConfiguration.tattoos && avatarConfiguration.tattoos.filter(t => t).map((tattoo) => (
          <InteractiveTattoo
            key={tattoo.id}
            tattoo={tattoo}
            onUpdate={(updates) => handleTattooUpdate(tattoo.id, updates)}
            isEditing={isEditing}
            containerWidth={displayWidth}
            containerHeight={displayHeight}
            onInteractionStart={onTattooInteractionStart}
            onInteractionEnd={onTattooInteractionEnd}
            isSelected={selectedTattooId === tattoo.id} // Pass down isSelected
            onSelect={onSelectTattoo} // Pass down onSelectTattoo
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent', // Changed from #e0e0e0
    overflow: 'hidden',
  },
  mannequinImage: {
    width: '100%', // Fill the container
    height: '100%', // Fill the container
  },
  tattooWrapper: {
    position: 'absolute',
    // Other styles are handled by animatedStyle
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // tattooOverlay style is now handled by InteractiveTattoo's animatedStyle
});

export default AvatarDisplayComponent;
