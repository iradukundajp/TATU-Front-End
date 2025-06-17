// filepath: c:/Users/sahir/OneDrive/Documents/Desktop/THOMAS MORE/2ND YEAR/Project Lab/TATU-Front-END/app/avatar-config.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Image, Alert, TouchableOpacity, Switch, Platform, ImageSourcePropType, Dimensions, Text } from 'react-native'; // Added Text
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AvatarDisplayComponent from '../components/AvatarDisplayComponent';
import { AvatarConfiguration, TattooPlacement, SelectableTattooItem } from '@/types/avatar';
import { router } from 'expo-router';
import { api } from '@/services/api.service';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const MANNEQUIN_TYPES = [
  { id: 'male_standard', label: 'Male' },
  { id: 'female_standard', label: 'Female' },
];

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

const AVATAR_DISPLAY_WIDTH = Dimensions.get('window').width > 600 ? 400 : Dimensions.get('window').width * 0.9; // Slightly reduced for more control space
const AVATAR_DISPLAY_HEIGHT = AVATAR_DISPLAY_WIDTH * 1.5;

export default function AvatarConfigScreen() {
  const { user, updateAvatarConfiguration } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editableAvatarConfig, setEditableAvatarConfig] = useState<AvatarConfiguration | undefined>(undefined);
  const [initialAvatarConfigForComparison, setInitialAvatarConfigForComparison] = useState<AvatarConfiguration | null>(null);
  const [isAvatarInteracting, setIsAvatarInteracting] = useState(false);
  const [selectedTattooForControls, setSelectedTattooForControls] = useState<TattooPlacement | null>(null);
  const [mannequinZoom, setMannequinZoom] = useState(1);

  const mannequinTranslateX = useSharedValue(0);
  const mannequinTranslateY = useSharedValue(0);
  const mannequinBaseTranslateX = useSharedValue(0);
  const mannequinBaseTranslateY = useSharedValue(0);

  const showInstructions = () => {
    Alert.alert(
      "How to Customize Your Avatar",
      "- Select Mannequin: Tap 'Male' or 'Female'.\\n" +
      "- Add Tattoos: Select from the 'Add Tattoo' list or upload your own.\\n" +
      "- Adjust Tattoos: On the mannequin, tap and drag to move a tattoo. Use two fingers to pinch-to-zoom (resize) or twist (rotate). You can also use the sliders for fine adjustments after selecting a tattoo from the 'Placed Tattoos' list.\\n" +
      "- Remove Tattoos: Tap the trash icon next to a tattoo in the 'Placed Tattoos' list.\\n" +
      "- Save: Tap the 'Save Configuration' button.",
      [{ text: "OK" }]
    );
  };

  useEffect(() => {
    let initialConfig: AvatarConfiguration;
    if (user?.avatarConfiguration) {
      initialConfig = {
        ...user.avatarConfiguration,
        tattoos: user.avatarConfiguration.tattoos || [],
      };
    } else {
      initialConfig = {
        baseMannequinId: MANNEQUIN_TYPES[0].id,
        tattoos: [],
      };
    }
    setEditableAvatarConfig(initialConfig);
    setInitialAvatarConfigForComparison(initialConfig); // Store for comparison
  }, [user?.avatarConfiguration]);

  const haveChangesOccurred = () => {
    if (!initialAvatarConfigForComparison || !editableAvatarConfig) return false;
    // A simple string comparison; for more complex objects, a deep comparison library might be better
    return JSON.stringify(initialAvatarConfigForComparison) !== JSON.stringify(editableAvatarConfig);
  };

  const handleDiscardChanges = () => {
    if (haveChangesOccurred()) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them and go back?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSaveConfiguration = async () => {
    if (!editableAvatarConfig || !updateAvatarConfiguration) {
      Alert.alert("Error", "Could not save configuration.");
      return;
    }
    setLoading(true);
    try {
      await updateAvatarConfiguration(editableAvatarConfig);
      Alert.alert('Success', 'Avatar configuration saved!');
      router.back();
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
        x: 50, y: 40, width: 25, height: 25, initialWidth: 25, initialHeight: 25, rotation: 0,
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
    // If the currently selected tattoo is being updated, refresh its state for the sliders
    if (selectedTattooForControls && selectedTattooForControls.id === placementId) {
        setSelectedTattooForControls(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleRemoveTattoo = (placementIdToRemove: string) => {
    setEditableAvatarConfig(prevConfig => {
      if (!prevConfig || !prevConfig.tattoos) return prevConfig;
      const updatedTattoos = prevConfig.tattoos.filter(tattoo => tattoo.id !== placementIdToRemove);
      return { ...prevConfig, tattoos: updatedTattoos };
    });
    if (selectedTattooForControls && selectedTattooForControls.id === placementIdToRemove) {
      setSelectedTattooForControls(null); // Deselect if removed
    }
  };

  const handlePickCustomTattooImage = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions.');
          setLoading(false); return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const formData = new FormData();
        const fileName = uri.split('/').pop();
        const fileType = asset.mimeType || 'image/jpeg';

        if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('tattooImage', blob, fileName || 'upload.jpg');
        } else {
            formData.append('tattooImage', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: fileName || `tattoo-${Date.now()}.jpg`, type: fileType,
            } as any);
        }
        
        try {
          const uploadResponse = await api.uploadFile<{ message: string; filePath: string; filename: string; fileId?: string; name?: string; }>('/api/users/profile/custom-tattoo', formData, { requiresAuth: true });
          if (uploadResponse && uploadResponse.filePath) {
            const fullImageUrl = uploadResponse.filePath;
            handleSelectTattoo(
              { id: 'custom-' + Date.now() + '-' + (uploadResponse.name || uploadResponse.filename), title: uploadResponse.name || uploadResponse.filename || 'Custom Tattoo' },
              fullImageUrl
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

  const handleSelectTattooForControls = (tattooId: string | null) => { // Changed parameter to tattooId
    if (tattooId) {
      const tattoo = editableAvatarConfig?.tattoos.find(t => t.id === tattooId);
      setSelectedTattooForControls(tattoo || null);
    } else {
      setSelectedTattooForControls(null);
    }
    // setIsAvatarInteracting(!!tattooId); // Removed: Selecting for controls is not an interaction that should block scroll
  };

  const handleFineTuneTattoo = (property: 'scale' | 'rotation', value: number) => {
    if (!selectedTattooForControls) return;
    const tattooToUpdate = editableAvatarConfig?.tattoos.find(t => t.id === selectedTattooForControls.id);
    if (!tattooToUpdate) return;

    if (property === 'scale') {
      const newWidth = tattooToUpdate.initialWidth * value;
      const newHeight = tattooToUpdate.initialHeight * value;
      handleUpdateTattooPlacement(selectedTattooForControls.id, { width: newWidth, height: newHeight });
    } else if (property === 'rotation') {
      handleUpdateTattooPlacement(selectedTattooForControls.id, { rotation: value });
    }
  };

  const mannequinPanGesture = Gesture.Pan()
    .enabled(mannequinZoom > 1)
    .onBegin(() => { runOnJS(setIsAvatarInteracting)(true); })
    .onUpdate((event) => {
      mannequinTranslateX.value = mannequinBaseTranslateX.value + event.translationX;
      mannequinTranslateY.value = mannequinBaseTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      mannequinBaseTranslateX.value = mannequinTranslateX.value;
      mannequinBaseTranslateY.value = mannequinTranslateY.value;
    })
    .onFinalize(() => { runOnJS(setIsAvatarInteracting)(false); });

  const animatedMannequinStyle = useAnimatedStyle(() => ({
    width: AVATAR_DISPLAY_WIDTH, height: AVATAR_DISPLAY_HEIGHT,
    transform: [
      { translateX: mannequinTranslateX.value }, { translateY: mannequinTranslateY.value },
      { scale: mannequinZoom },
    ],
  }));
  
  useEffect(() => {
    if (mannequinZoom <= 1) {
      mannequinTranslateX.value = withTiming(0);
      mannequinTranslateY.value = withTiming(0);
      mannequinBaseTranslateX.value = 0;
      mannequinBaseTranslateY.value = 0;
    }
  }, [mannequinZoom]);

  if (!editableAvatarConfig) {
    return <ThemedView style={styles.centered}><ThemedText>Loading configuration...</ThemedText></ThemedView>;
  }

  const currentScaleValue = selectedTattooForControls && selectedTattooForControls.initialWidth
  ? selectedTattooForControls.width / selectedTattooForControls.initialWidth
  : 1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        scrollEnabled={!isAvatarInteracting} // Simplified scroll enabled logic
      >
        <ThemedView style={styles.container}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDiscardChanges} style={styles.iconButton}>
              <IconSymbol name="xmark.circle" size={26} color="#FF3B30" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.pageTitle}>Customize Avatar</ThemedText>
            <TouchableOpacity onPress={showInstructions} style={styles.iconButton}>
              <IconSymbol name="questionmark.circle" size={26} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Section: Mannequin Configuration */}
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Mannequin</ThemedText>
            <View style={styles.mannequinTypeContainer}>
              {MANNEQUIN_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.mannequinTypeButton,
                    editableAvatarConfig.baseMannequinId === type.id && styles.mannequinTypeButtonActive
                  ]}
                  onPress={() => setEditableAvatarConfig(prev => ({ ...prev!, baseMannequinId: type.id }))}
                >
                  <ThemedText style={[
                    styles.mannequinTypeButtonText,
                    editableAvatarConfig.baseMannequinId === type.id && styles.mannequinTypeButtonTextActive
                  ]}>{type.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>Zoom Mannequin: {mannequinZoom.toFixed(1)}x</ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={3}
                value={mannequinZoom}
                onValueChange={setMannequinZoom}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#D1D1D6"
                thumbTintColor="#007AFF"
              />
            </View>
          </View>

          {/* Section: Avatar Preview */}
          <View style={[styles.sectionContainer, styles.avatarPreviewSection]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Avatar Preview</ThemedText>
            <GestureDetector gesture={mannequinPanGesture}>
              <Animated.View style={[styles.avatarDisplayWrapper, animatedMannequinStyle]}>
                <AvatarDisplayComponent
                  avatarConfiguration={editableAvatarConfig} // Corrected prop name
                  onUpdateTattooPlacement={handleUpdateTattooPlacement} // Corrected prop name
                  onSelectTattoo={handleSelectTattooForControls} // Corrected prop name, signature now matches
                  // width and height are now taken from containerWidth/Height in AvatarDisplayComponent if not provided, or use its defaults
                  // We pass them here to ensure consistency with the AVATAR_DISPLAY_WIDTH/HEIGHT used for the animated wrapper
                  containerWidth={AVATAR_DISPLAY_WIDTH}
                  containerHeight={AVATAR_DISPLAY_HEIGHT}
                  isEditing={true}
                  selectedTattooId={selectedTattooForControls?.id}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Section: Adjust Selected Tattoo (Conditional) */}
          {selectedTattooForControls && (
            <View style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Adjust: {selectedTattooForControls.tattooTitle || 'Selected Tattoo'}
              </ThemedText>
              <View style={styles.sliderContainer}>
                <ThemedText style={styles.sliderLabel}>Scale: {currentScaleValue.toFixed(1)}x</ThemedText>
                <Slider
                  style={styles.slider}
                  minimumValue={0.25} 
                  maximumValue={2.5}  
                  value={currentScaleValue}
                  onValueChange={(value) => handleFineTuneTattoo('scale', value)}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#D1D1D6"
                  thumbTintColor="#007AFF"
                />
              </View>
              <View style={styles.sliderContainer}>
                <ThemedText style={styles.sliderLabel}>Rotation: {selectedTattooForControls.rotation?.toFixed(0) || 0}°</ThemedText>
                <Slider
                  style={styles.slider}
                  minimumValue={-180}
                  maximumValue={180}
                  value={selectedTattooForControls.rotation || 0}
                  onValueChange={(value) => handleFineTuneTattoo('rotation', value)}
                  step={1}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#D1D1D6"
                  thumbTintColor="#007AFF"
                />
              </View>
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, styles.deselectButton]} 
                onPress={() => handleSelectTattooForControls(null)} // Pass null to deselect
              >
                <ThemedText style={styles.secondaryButtonText}>Done Adjusting</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Section: Placed Tattoos */}
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Placed Tattoos</ThemedText>
            {editableAvatarConfig.tattoos.length === 0 ? (
              <ThemedText style={styles.emptyListText}>No tattoos placed yet.</ThemedText>
            ) : (
              editableAvatarConfig.tattoos.map(tattoo => (
                <View key={tattoo.id} style={[
                  styles.tattooListItem, 
                  selectedTattooForControls?.id === tattoo.id && styles.tattooListItemSelected
                ]}>
                  <Image 
                    source={tattoo.customImageUri ? { uri: tattoo.customImageUri } : tattoo.imageRequire} 
                    style={styles.tattooListImage} 
                  />
                  <ThemedText style={styles.tattooListTitle} numberOfLines={1}>{tattoo.tattooTitle}</ThemedText>
                  <View style={styles.tattooListActions}>
                    <TouchableOpacity onPress={() => handleSelectTattooForControls(tattoo.id)} style={styles.iconButtonSmall}>
                      <IconSymbol name="pencil.circle" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveTattoo(tattoo.id)} style={styles.iconButtonSmall}>
                      <IconSymbol name="trash" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Section: Add Tattoos */}
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Add Tattoo</ThemedText>
            <View style={styles.tattooSelectionGrid}>
              {STATIC_TATTOOS_FOR_SELECTION.map(tattooItem => (
                <TouchableOpacity
                  key={tattooItem.id}
                  style={styles.tattooSelectItem}
                  onPress={() => handleSelectTattoo(tattooItem)}
                >
                  <Image source={tattooItem.imageRequire} style={styles.tattooSelectImage} />
                  <ThemedText style={styles.tattooSelectTitle} numberOfLines={2}>{tattooItem.title}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.uploadButton]} onPress={handlePickCustomTattooImage} disabled={loading}>
              <IconSymbol name="arrow.up.circle" size={20} color="#007AFF" style={{ marginRight: 8 }}/>
              <ThemedText style={styles.secondaryButtonText}>{loading ? 'Uploading...' : 'Upload Custom Tattoo'}</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveConfiguration} disabled={loading}>
            <ThemedText style={styles.buttonText}>{loading ? 'Saving...' : 'Save Configuration'}</ThemedText>
          </TouchableOpacity>

        </ThemedView>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#161618', // Dark theme background
  },
  scrollViewContent: {
    paddingBottom: 40, 
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#161618', // Dark theme background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161618', // Dark theme background
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0, // Reduced from 5, to minimize space below header
    paddingTop: Platform.OS === 'android' ? 20 : 15, // Increased top padding to push header down
    paddingHorizontal: 5, // Add some horizontal padding if needed for icons
  },
  pageTitle: {
    fontSize: 22, // Reduced from 24
    fontWeight: 'bold',
    color: '#E0E0E0', // Light text for dark theme
    textAlign: 'center', 
    flex: 1, 
  },
  iconButton: {
    padding: 8,
  },
  iconButtonSmall: {
    padding: 6,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#1E1E1E', // Darker section background
    borderRadius: 12,
    // Removed shadow for a flatter dark theme, or use light shadow if preferred
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
    // elevation: 3,
    borderWidth: 1,
    borderColor: '#2C2C2C', // Subtle border for sections
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: '600',
    marginBottom: 10, 
    color: '#D0D0D0', // Light text for dark theme
  },
  mannequinTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  mannequinTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF', // Keep primary action color for borders
    backgroundColor: 'transparent', // Transparent background for dark theme
  },
  mannequinTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  mannequinTypeButtonText: {
    color: '#007AFF', // Primary action color for text
    fontWeight: '500',
    fontSize: 16,
  },
  mannequinTypeButtonTextActive: {
    color: '#FFFFFF', // White text when active
  },
  avatarPreviewSection: {
    alignItems: 'center', // Center the avatar display
    paddingVertical: 20, // More vertical padding
    overflow: 'hidden', // Added to contain zoomed avatar
  },
  avatarDisplayWrapper: {
    backgroundColor: '#2C2C2C', // Darker placeholder background
    borderRadius: 10,
    overflow: 'hidden', 
    borderWidth: 1,
    borderColor: '#404040', // Darker border
  },
  sliderContainer: {
    marginBottom: 15,
  },
  sliderLabel: {
    fontSize: 15,
    color: '#B0B0B0', // Lighter gray for dark theme
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    // Thumb and track colors are often system-dependent or might need specific props if using a custom slider
  },
  tattooListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A', // Darker border
    backgroundColor: 'transparent', 
    borderRadius: 8,
    marginBottom: 5,
  },
  tattooListItemSelected: {
    backgroundColor: '#007AFF20', // Primary color with low opacity for selection
    borderColor: '#007AFF',
    borderWidth: 1, 
  },
  tattooListImage: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#333333', // Darker placeholder
  },
  tattooListTitle: {
    flex: 1,
    fontSize: 16,
    color: '#E0E0E0', // Light text
  },
  tattooListActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888888', // Medium gray for dark theme
    paddingVertical: 15,
    fontSize: 15,
  },
  tattooSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tattooSelectItem: {
    width: '31%', 
    alignItems: 'center',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#252528', // Darker item background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#383838', // Darker border
  },
  tattooSelectImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#333333', // Darker placeholder
  },
  tattooSelectTitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#C0C0C0', // Lighter gray text
    height: 32, 
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25, // More rounded buttons
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#007AFF', 
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF', // White text on primary button
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#2C2C2C', // Dark background for secondary actions
    borderWidth: 1,
    borderColor: '#007AFF', // Primary color border
  },
  secondaryButtonText: {
    color: '#007AFF', // Primary color text
    fontSize: 16,
    fontWeight: '500',
  },
  uploadButton: {
    marginTop: 10,
  },
  deselectButton: {
    marginTop: 15,
    paddingVertical: 10, // Smaller padding for this button
    minHeight: 40,
  },
});
