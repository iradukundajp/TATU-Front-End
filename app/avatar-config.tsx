// filepath: c:/Users/sahir/OneDrive/Documents/Desktop/THOMAS MORE/2ND YEAR/Project Lab/TATU-Front-END/app/avatar-config.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Image, Alert, TouchableOpacity, Switch, Platform, ImageSourcePropType, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AvatarDisplayComponent from '../components/AvatarDisplayComponent';
// REMOVED BodyZone from import
import { AvatarConfiguration, TattooPlacement, SelectableTattooItem } from '@/types/avatar';
import { router } from 'expo-router'; // For navigation
import { api } from '@/services/api.service'; // Import the api service
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Define Mannequin Types (can be moved to a constants file if shared)
const MANNEQUIN_TYPES = [
  { id: 'male_standard', label: 'Male' },
  { id: 'female_standard', label: 'Female' },
];

// Define your static tattoos here (can be moved to a constants file if shared)
const STATIC_TATTOOS_FOR_SELECTION: SelectableTattooItem[] = [
  {
    id: 'tattoo_1',
    title: 'Dragon Silhouette',
    imageRequire: require('../assets/images/avatar/tattoos/20250523_1824_Tattoo Design Collection_simple_compose_01jvyz7xvvfmj8x7p0pbv0h5zf.png'),
  },
  {
    id: 'tattoo_2',
    title: 'Tribal Armband',
    imageRequire: require('../assets/images/avatar/tattoos/20250523_1824_Tattoo Design Collection_simple_compose_01jvyz7xvwfzba2htbq4zqwt4f.png'),
  },
  // Add more static tattoos as needed
];

// Increased dimensions for the AvatarDisplayComponent on this dedicated screen
const AVATAR_DISPLAY_WIDTH = Dimensions.get('window').width > 600 ? 450 : Dimensions.get('window').width * 0.9;
const AVATAR_DISPLAY_HEIGHT = AVATAR_DISPLAY_WIDTH * 1.5; // Maintain 2:3 aspect ratio

export default function AvatarConfigScreen() {
  const { user, updateAvatarConfiguration } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editableAvatarConfig, setEditableAvatarConfig] = useState<AvatarConfiguration | undefined>(undefined);
  const [isAvatarInteracting, setIsAvatarInteracting] = useState(false); // This now covers tattoo interaction, mannequin zoom, and mannequin pan
  const [selectedTattooForControls, setSelectedTattooForControls] = useState<TattooPlacement | null>(null);
  const [mannequinZoom, setMannequinZoom] = useState(1); // New state for mannequin zoom

  // Shared values for mannequin panning
  const mannequinTranslateX = useSharedValue(0);
  const mannequinTranslateY = useSharedValue(0);
  const mannequinBaseTranslateX = useSharedValue(0);
  const mannequinBaseTranslateY = useSharedValue(0);


  const showInstructions = () => {
    Alert.alert(
      "How to Customize Your Avatar",
      "- Select Mannequin: Tap \'Male\' or \'Female\'.\n" +
      "- Add Tattoos: Select from the \'Add Tattoo\' list or upload your own.\n" +
      "- Adjust Tattoos: On the mannequin, tap and drag to move a tattoo. Use two fingers to pinch-to-zoom (resize) or twist (rotate).\n" +
      "- Remove Tattoos: Tap the trash icon next to a tattoo in the \'Placed Tattoos\' list.\n" +
      "- Save: Tap the \'Save\' button to keep your changes.",
      [{ text: "OK" }]
    );
  };

  useEffect(() => {
    if (user?.avatarConfiguration) {
      setEditableAvatarConfig({
        ...user.avatarConfiguration,
        tattoos: user.avatarConfiguration.tattoos || [], // Ensure tattoos array exists
      });
    } else {
      setEditableAvatarConfig({
        baseMannequinId: MANNEQUIN_TYPES[0].id, // Default mannequin
        tattoos: [],
      });
    }
  }, [user?.avatarConfiguration]);

  const handleSaveConfiguration = async () => {
    if (!editableAvatarConfig || !updateAvatarConfiguration) {
      Alert.alert("Error", "Could not save configuration.");
      return;
    }
    setLoading(true);
    try {
      await updateAvatarConfiguration(editableAvatarConfig);
      Alert.alert('Success', 'Avatar configuration saved!');
      router.back(); // Go back to profile screen
    } catch (error) {
      console.error('Error saving avatar configuration:', error);
      Alert.alert('Error', 'Failed to save avatar configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTattoo = (tattooItem: SelectableTattooItem, customImageUri?: string) => {
    setEditableAvatarConfig(prevConfig => {
      const currentConfig = prevConfig || { baseMannequinId: MANNEQUIN_TYPES[0].id, tattoos: [] };
      const currentTattoos = currentConfig.tattoos || [];
      const newPlacement: TattooPlacement = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        tattooId: customImageUri ? undefined : tattooItem.id,
        tattooTitle: customImageUri ? 'Custom Tattoo' : tattooItem.title,
        imageRequire: customImageUri ? undefined : tattooItem.imageRequire,
        customImageUri: customImageUri,
        x: 50, 
        y: 40, 
        width: 25, 
        height: 25, 
        initialWidth: 25, // Store initial width
        initialHeight: 25, // Store initial height
        rotation: 0,
        zIndex: currentTattoos.length + 1,
      };
      return { ...currentConfig, tattoos: [...currentTattoos, newPlacement] };
    });
  };

  const handleUpdateTattooPlacement = (placementId: string, updates: Partial<TattooPlacement>) => {
    setEditableAvatarConfig(prevConfig => {
      if (!prevConfig || !prevConfig.tattoos) return prevConfig;
      const updatedTattoos = prevConfig.tattoos.map(tattoo =>
        tattoo.id === placementId ? { ...tattoo, ...updates } : tattoo
      );
      return { ...prevConfig, tattoos: updatedTattoos };
    });
  };

  const handleRemoveTattoo = (placementIdToRemove: string) => {
    setEditableAvatarConfig(prevConfig => {
      if (!prevConfig || !prevConfig.tattoos) return prevConfig;
      const updatedTattoos = prevConfig.tattoos.filter(tattoo => tattoo.id !== placementIdToRemove);
      return { ...prevConfig, tattoos: updatedTattoos };
    });
  };

  const handlePickCustomTattooImage = async () => {
    setLoading(true); // Indicate loading state
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions.');
          setLoading(false);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8, // Compress image slightly
        // allowsEditing: true, // Optional: if you want to allow basic editing
        // aspect: [4, 3], // Optional: if you want to enforce an aspect ratio
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        
        // Create FormData
        const formData = new FormData();
        const fileName = uri.split('/').pop();
        const fileType = asset.mimeType || 'image/jpeg'; // Fallback mime type

        // For web, uri is often a blob URL or base64, needs conversion for FormData
        // For native, uri is a file path
        if (Platform.OS === 'web' && uri.startsWith('blob:')) {
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('tattooImage', blob, fileName || 'upload.jpg');
        } else if (Platform.OS === 'web' && uri.startsWith('data:')) {
            // Handle base64 URI
            const base64Response = await fetch(uri);
            const blob = await base64Response.blob();
            formData.append('tattooImage', blob, fileName || 'upload.jpg');
        }
        else {
             // For native, this is usually correct
            formData.append('tattooImage', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: fileName || `tattoo-${Date.now()}.jpg`,
                type: fileType,
            } as any);
        }
        
        try {
          // Make API call to upload image
          // Ensure your API_BASE_URL is correctly set in your environment
          // and that the backend expects 'tattooImage' as the field name.
          const uploadResponse = await api.uploadFile<{ message: string; filePath: string; filename: string; fileId?: string; name?: string; }>('/api/users/profile/custom-tattoo', formData, { requiresAuth: true });

          if (uploadResponse && uploadResponse.filePath) {
            // Use the returned filePath (which is now a full ImageKit URL)
            const fullImageUrl = uploadResponse.filePath; // Directly use the ImageKit URL
            
            handleSelectTattoo(
              { 
                id: 'custom-' + Date.now() + '-' + (uploadResponse.name || uploadResponse.filename), // Use ImageKit name if available
                title: uploadResponse.name || uploadResponse.filename || 'Custom Tattoo' 
              }, 
              fullImageUrl // Use the direct ImageKit URL
            );
            Alert.alert('Success', 'Custom tattoo uploaded and added!');
          } else {
            Alert.alert('Upload Failed', uploadResponse.message || 'Could not get file path from server.');
          }
        } catch (apiError: any) {
          console.error('Error uploading custom tattoo:', apiError);
          Alert.alert('Upload Error', apiError.message || 'Failed to upload custom tattoo image.');
        }
      }
    } catch (error) {
      console.error('Error picking custom tattoo image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTattooForControls = (tattooId: string | null) => {
    if (tattooId) {
      const tattoo = editableAvatarConfig?.tattoos.find(t => t.id === tattooId);
      setSelectedTattooForControls(tattoo || null);
    } else {
      setSelectedTattooForControls(null);
    }
    // Prevent scrolling when a tattoo is selected for fine-tuning, as sliders might be near the scroll view.
    setIsAvatarInteracting(!!tattooId); 
  };

  const handleFineTuneTattoo = (property: 'scale' | 'rotation', value: number) => {
    if (!selectedTattooForControls) return;

    const tattooToUpdate = editableAvatarConfig?.tattoos.find(t => t.id === selectedTattooForControls.id);
    if (!tattooToUpdate) return;

    if (property === 'scale') {
      // value is the scale multiplier (e.g., 0.5 to 2.0 from the slider)
      // Apply the scale to the *initial* dimensions of the tattoo
      const newWidth = tattooToUpdate.initialWidth * value;
      const newHeight = tattooToUpdate.initialHeight * value;

      handleUpdateTattooPlacement(selectedTattooForControls.id, { 
        width: newWidth, 
        height: newHeight 
      });

    } else if (property === 'rotation') {
      handleUpdateTattooPlacement(selectedTattooForControls.id, { rotation: value });
    }
  };

  // Gesture handler for panning the zoomed mannequin
  const mannequinPanGesture = Gesture.Pan()
    .enabled(mannequinZoom > 1) // Only allow panning if zoomed
    .onBegin(() => {
      runOnJS(setIsAvatarInteracting)(true);
    })
    .onUpdate((event) => {
      mannequinTranslateX.value = mannequinBaseTranslateX.value + event.translationX;
      mannequinTranslateY.value = mannequinBaseTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      mannequinBaseTranslateX.value = mannequinTranslateX.value;
      mannequinBaseTranslateY.value = mannequinTranslateY.value;
    })
    .onFinalize(() => {
      runOnJS(setIsAvatarInteracting)(false);
    });

  // Animated style for the mannequin container (for zoom and pan)
  const animatedMannequinStyle = useAnimatedStyle(() => {
    return {
      width: AVATAR_DISPLAY_WIDTH,
      height: AVATAR_DISPLAY_HEIGHT,
      transform: [
        { translateX: mannequinTranslateX.value },
        { translateY: mannequinTranslateY.value },
        { scale: mannequinZoom },
      ],
    };
  });
  
  // Reset pan when zoom changes back to 1
  useEffect(() => {
    if (mannequinZoom <= 1) {
      mannequinTranslateX.value = withTiming(0);
      mannequinTranslateY.value = withTiming(0);
      mannequinBaseTranslateX.value = 0;
      mannequinBaseTranslateY.value = 0;
    }
  }, [mannequinZoom]);


  if (!user) {
    return (
      <ThemedView style={styles.containerCenter}>
        <ThemedText>Loading user data or please log in.</ThemedText>
        <TouchableFix onPress={() => router.replace('/login')} style={styles.button}>
          <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
        </TouchableFix>
      </ThemedView>
    );
  }
  
  if (!editableAvatarConfig) {
    return (
      <ThemedView style={styles.containerCenter}>
        <ThemedText>Loading configuration...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>{/* Required for GestureDetector */}
      <ThemedView style={styles.outerContainer}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={!isAvatarInteracting} 
        >
          <View style={styles.headerControls}>
            <TouchableFix onPress={() => router.push('/(tabs)/profile')} style={[styles.button, styles.backButton, styles.headerButtonSmall]}>
                <IconSymbol name="chevron.left" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}> Back</ThemedText>
            </TouchableFix>
            <View style={styles.titleContainer}>
                <ThemedText type="title" style={styles.title}>Customize Avatar</ThemedText>
                <TouchableFix onPress={showInstructions} style={styles.infoButton}>
                    <IconSymbol name="info.circle" size={22} color="#FFFFFF" />
                </TouchableFix>
            </View>
            <TouchableFix onPress={handleSaveConfiguration} disabled={loading} style={[styles.button, styles.saveButton, styles.headerButtonSmall]}>
                <IconSymbol name="checkmark.circle" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}> Save</ThemedText>
            </TouchableFix>
          </View>

          {/* Mannequin Zoom Slider Section */}
          <View style={styles.zoomControlsSection}>
            <ThemedText style={styles.sliderLabel}>Mannequin Zoom (Drag to Pan when Zoomed)</ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={3}
              value={mannequinZoom}
              step={0.1}
              onValueChange={(value) => {
                runOnJS(setMannequinZoom)(value);
                // If zooming out completely, ensure interaction state is managed
                if (value <= 1) {
                  runOnJS(setIsAvatarInteracting)(false); // Allow scroll if not zoomed
                }
              }}
              // onSlidingStart={() => runOnJS(setIsAvatarInteracting)(true)} // Covered by mannequinPanGesture or tattoo interaction
              // onSlidingComplete={() => { /* Potentially setIsAvatarInteracting(false) if not panning */ }} // Covered by mannequinPanGesture
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#FFFFFF"
              thumbTintColor="#007AFF"
            />
          </View>

          <View style={styles.avatarDisplaySection}>
            <GestureDetector gesture={mannequinPanGesture}>
              <Animated.View style={animatedMannequinStyle}>
                <AvatarDisplayComponent
                  avatarConfiguration={editableAvatarConfig}
                  onUpdateTattooPlacement={handleUpdateTattooPlacement}
                  isEditing={true}
                  containerWidth={AVATAR_DISPLAY_WIDTH}
                  containerHeight={AVATAR_DISPLAY_HEIGHT}
                  onTattooInteractionStart={() => runOnJS(setIsAvatarInteracting)(true)}
                  onTattooInteractionEnd={() => runOnJS(setIsAvatarInteracting)(false)}
                  selectedTattooId={selectedTattooForControls?.id}
                  onSelectTattoo={handleSelectTattooForControls}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          {selectedTattooForControls && (
            <View style={styles.fineTuneControlsSection}>
              <ThemedText style={styles.sectionTitle}>Adjust Selected Tattoo: {selectedTattooForControls.tattooTitle}</ThemedText>
              <View style={styles.sliderContainer}>
                <ThemedText style={styles.sliderLabel}>Scale (Size)</ThemedText>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5} 
                  maximumValue={2.5} // Increased max scale   
                  value={selectedTattooForControls.width / (selectedTattooForControls.initialWidth || selectedTattooForControls.width || 1)} // Calculate current scale based on initial width
                  step={0.05} // Finer step
                  onValueChange={(sliderValue: number) => {
                      handleFineTuneTattoo('scale', sliderValue);
                  }}
                  onSlidingStart={() => runOnJS(setIsAvatarInteracting)(true)}
                  onSlidingComplete={() => runOnJS(setIsAvatarInteracting)(false)}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#FFFFFF"
                  thumbTintColor="#007AFF"
                />
              </View>
              <View style={styles.sliderContainer}>
                <ThemedText style={styles.sliderLabel}>Rotation</ThemedText>
                <Slider
                  style={styles.slider}
                  minimumValue={-180}
                  maximumValue={180}
                  value={selectedTattooForControls.rotation || 0}
                  step={1}
                  onValueChange={(sliderValue: number) => handleFineTuneTattoo('rotation', sliderValue)}
                  onSlidingStart={() => runOnJS(setIsAvatarInteracting)(true)}
                  onSlidingComplete={() => runOnJS(setIsAvatarInteracting)(false)}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#FFFFFF"
                  thumbTintColor="#007AFF"
                />
              </View>
               <TouchableFix onPress={() => {
                  handleSelectTattooForControls(null);
                  runOnJS(setIsAvatarInteracting)(false); // Ensure scroll is re-enabled
                }} style={[styles.button, styles.doneButton]}>
                  <ThemedText style={styles.buttonText}>Done Adjusting</ThemedText>
              </TouchableFix>
            </View>
          )}

          {/* THIS IS THE controlsSection THAT WAS MISSING */}
          <View style={styles.controlsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Mannequin</ThemedText>
            <View style={styles.selectionGroup}>
              {MANNEQUIN_TYPES.map((type) => (
                <TouchableFix
                  key={type.id}
                  style={[
                    styles.selectableItem,
                    editableAvatarConfig.baseMannequinId === type.id && styles.selectedItem,
                  ]}
                  onPress={() => setEditableAvatarConfig(prev => ({ ...prev!, baseMannequinId: type.id }))}
                >
                  <ThemedText style={editableAvatarConfig.baseMannequinId === type.id ? styles.selectedItemText : styles.itemText}>{type.label}</ThemedText>
                </TouchableFix>
              ))}
            </View>

            <ThemedText type="subtitle" style={styles.sectionTitle}>Add Tattoo</ThemedText>
            <View style={styles.tattooSelectionList}>
              {STATIC_TATTOOS_FOR_SELECTION.map((tattoo) => (
                <TouchableFix key={tattoo.id} onPress={() => handleSelectTattoo(tattoo)} style={styles.tattooItem}>
                  {tattoo.imageRequire && <Image source={tattoo.imageRequire} style={styles.tattooImageThumbnail} />}
                  <ThemedText style={styles.itemText}>{tattoo.title}</ThemedText>
                </TouchableFix>
              ))}
            </View>
            <TouchableFix onPress={handlePickCustomTattooImage} style={[styles.button, styles.uploadButton]}>
              <IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}> Upload Custom Tattoo</ThemedText>
            </TouchableFix>

            {editableAvatarConfig.tattoos && editableAvatarConfig.tattoos.length > 0 && (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Placed Tattoos</ThemedText>
                <View style={styles.placedTattoosList}>
                  {editableAvatarConfig.tattoos
                    .filter(tattoo => tattoo && tattoo.id) 
                    .map((tattoo) => (
                    <View key={tattoo.id} style={styles.placedTattooItem}>
                      <View style={styles.placedTattooInfo}>
                          {tattoo.customImageUri ? (
                              <Image source={{uri: tattoo.customImageUri}} style={styles.tattooImageThumbnailSmall} />
                          ) : tattoo.imageRequire ? (
                              <Image source={tattoo.imageRequire} style={styles.tattooImageThumbnailSmall} />
                          ) : null}
                          <ThemedText style={styles.itemTextSmall} numberOfLines={1}>{tattoo.tattooTitle || `Tattoo ${tattoo.id.substring(0,6)}`}</ThemedText>
                      </View>
                      <TouchableFix onPress={() => handleRemoveTattoo(tattoo.id)} style={styles.removeButton}>
                        <IconSymbol name="trash.fill" size={18} color="#FF6347" />
                      </TouchableFix>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
          {/* END OF MISSING controlsSection */}

        </ScrollView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Takes up space between Back and Save
    minWidth: 0, // Helps flex item shrink below its content's intrinsic size
    marginHorizontal: 4, // Add a small gap between title area and buttons
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18, // Reduced from 20
    marginRight: 8,
    flexShrink: 1, // Allow title to shrink if needed
  },
  infoButton: {
    padding: 5,
  },
  headerButtonSmall: {
    paddingHorizontal: 12, // Reduced from 15
    paddingVertical: 10,
  },
  zoomControlsSection: { // New style for the zoom slider container
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2c2c2c', 
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  avatarDisplaySection: { // Remains mostly the same, acts as viewport
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#2c2c2c',
    padding: 5,
    borderRadius: 8,
    width: AVATAR_DISPLAY_WIDTH + 10,
    height: AVATAR_DISPLAY_HEIGHT + 10,
    alignSelf: 'center',
    overflow: 'hidden', // Crucial for zoom effect
  },
  controlsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#e0e0e0',
  },
  selectionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  selectableItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#333333',
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#444444',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  itemText: {
    color: '#FFFFFF',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tattooSelectionList: {
    marginBottom: 10,
  },
  tattooItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444444',
  },
  tattooImageThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#555555',
  },
  tattooImageThumbnailSmall: {
    width: 30,
    height: 30,
    borderRadius: 3,
    marginRight: 8,
    backgroundColor: '#555555',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  backButton: {
     backgroundColor: '#555555',
  },
  uploadButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  placedTattoosList: {
    marginTop: 5,
  },
  placedTattooItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  placedTattooInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTextSmall: {
    color: '#e0e0e0',
    fontSize: 14,
    flexShrink: 1,
  },
  removeButton: {
    padding: 8,
  },
  fineTuneControlsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2c2c2c',
    marginTop: 10,
    borderRadius: 8,
    marginHorizontal: 10, // Give it some horizontal margin
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40, // Standard slider height
  },
  doneButton: {
    backgroundColor: '#555555',
    marginTop: 10,
  }
});
