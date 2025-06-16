import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as tattooService from '@/services/tattoo.service';
import { TattooDesign } from '@/types/tattooDesign';

// List of common tattoo styles
const TATTOO_STYLES = [
  'All Styles',
  'Traditional',
  'Neo-Traditional',
  'Realism',
  'Watercolor',
  'Tribal',
  'Japanese',
  'Blackwork',
  'Minimalist',
  'Geometric',
  'Portrait',
  'New School',
  'Illustrative',
  'Dotwork',
  'Abstract',
  'Lettering',
  'Biomechanical',
];

// Size options
const SIZE_OPTIONS = [
  'All Sizes',
  'Small',
  'Medium',
  'Large',
  'Extra Large',
  'Custom',
];

export default function TattoosScreen() {
  const { user, isAuthenticated, isArtist } = useAuth();
  
  // For artist view
  const [myDesigns, setMyDesigns] = useState<TattooDesign[]>([]);
  
  // For client view
  const [designs, setDesigns] = useState<TattooDesign[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'grid' | 'form'>('grid');
  
  // Form states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [style, setStyle] = useState('');
  const [categories, setCategories] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [selectedStyle, setSelectedStyle] = useState('All Styles');
  const [selectedSize, setSelectedSize] = useState('All Sizes');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load data based on user role
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isArtist]);
  
  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);
  
  // Load appropriate data based on user role
  const loadData = async () => {
    setLoading(true);
    try {
      if (isArtist()) { // Changed from isArtist to isArtist()
        const myDesignsData = await tattooService.getMyTattooDesigns();
        setMyDesigns(myDesignsData);
      } else {
        await fetchDesigns();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load tattoo designs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch designs with filters for client view
  const fetchDesigns = async (page = 1) => {
    try {
      const params: any = { page, limit: 10 };
      
      // Apply filters
      if (selectedStyle !== 'All Styles') {
        params.style = selectedStyle;
      }
      
      if (selectedSize !== 'All Sizes') {
        params.size = selectedSize;
      }
      
      if (minPrice) {
        params.minPrice = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        params.maxPrice = parseFloat(maxPrice);
      }
      
      const response = await tattooService.getAllTattooDesigns(params);
      setDesigns(response.designs);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching designs:', error);
      Alert.alert('Error', 'Failed to fetch tattoo designs');
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
    fetchDesigns(1);
  };
  
  // Clear filters
  const clearFilters = () => {
    setSelectedStyle('All Styles');
    setSelectedSize('All Sizes');
    setMinPrice('');
    setMaxPrice('');
    setShowFilters(false);
    fetchDesigns(1);
  };
  
  // Pick image for new design
  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need access to your photos to upload an image');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Submit new design (artist only)
  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (!style) {
      Alert.alert('Error', 'Please select a style');
      return;
    }
    
    setSubmitting(true);
    try {
      // Create form data
      const formData = new FormData();
      
      // Handle image upload based on platform
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          const filename = 'tattoo-design' + (blob.type === 'image/png' ? '.png' : blob.type === 'image/gif' ? '.gif' : '.jpg');
          formData.append('image', blob, filename);
        } catch (error) {
          console.error('Error converting image to blob:', error);
          Alert.alert('Error', 'Failed to process the selected image');
          setSubmitting(false);
          return;
        }
      } else {
        const imageInfo = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: 'tattoo-design.jpg'
        };
        formData.append('image', imageInfo as any);
      }
      
      // Add other fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('size', size);
      formData.append('style', style);
      
      // Handle categories as an array
      if (categories.trim()) {
        const categoriesArray = categories.split(',').map(c => c.trim());
        formData.append('categories', JSON.stringify(categoriesArray));
      }
      
      // Submit the design
      await tattooService.createTattooDesign(formData);
      
      // Reset form and reload data
      resetForm();
      loadData();
      
      Alert.alert('Success', 'Your tattoo design has been added');
    } catch (error) {
      console.error('Error submitting design:', error);
      Alert.alert('Error', 'Failed to add tattoo design');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    setSelectedImage(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setSize('');
    setStyle('');
    setCategories('');
    setCurrentView('grid');
  };
  
  // Delete a design (artist only)
  const handleDeleteDesign = (design: TattooDesign) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${design.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await tattooService.deleteTattooDesign(design.id);
              setMyDesigns(current => current.filter(d => d.id !== design.id));
              Alert.alert('Success', 'Design deleted successfully');
            } catch (error) {
              console.error('Error deleting design:', error);
              Alert.alert('Error', 'Failed to delete design');
            }
          }
        }
      ]
    );
  };
  
  // Render an individual design card
  const renderDesignItem = ({ item }: { item: TattooDesign }) => {
    return (
      <TouchableFix
        style={styles.designCard}
        onPress={() => {
          // In a real app, navigate to design detail view
          Alert.alert('Design Details', `You selected: ${item.title}`);
        }}
      >
        <Image
          source={{ uri: `${item.imageUrl.startsWith('http') ? '' : 'http://localhost:5000'}${item.imageUrl}` }}
          style={styles.designImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.designInfo}>
          <ThemedText type="subtitle" numberOfLines={1}>{item.title}</ThemedText>
          <View style={styles.designMeta}>
            <ThemedText type="default" style={styles.styleTag}>{item.style}</ThemedText>
            {item.price && <ThemedText type="default">${item.price}</ThemedText>}
          </View>
          {isArtist() && ( // Changed from isArtist to isArtist()
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDesign(item)}
            >
              <IconSymbol name="trash" size={16} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableFix>
    );
  };
  
  // Render filters section
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <ThemedView style={styles.filtersContainer}>
        <ThemedText type="subtitle">Filter Designs</ThemedText>
        
        <View style={styles.filterSection}>
          <ThemedText>Style</ThemedText>
          <View style={styles.tagsContainer}>
            {TATTOO_STYLES.slice(0, 8).map(style => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.tag,
                  selectedStyle === style && styles.selectedTag
                ]}
                onPress={() => setSelectedStyle(style)}
              >
                <Text style={[
                  styles.tagText,
                  selectedStyle === style && styles.selectedTagText
                ]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <ThemedText>Size</ThemedText>
          <View style={styles.tagsContainer}>
            {SIZE_OPTIONS.map(sizeOption => (
              <TouchableOpacity
                key={sizeOption}
                style={[
                  styles.tag,
                  selectedSize === sizeOption && styles.selectedTag
                ]}
                onPress={() => setSelectedSize(sizeOption)}
              >
                <Text style={[
                  styles.tagText,
                  selectedSize === sizeOption && styles.selectedTagText
                ]}>
                  {sizeOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <ThemedText>Price Range</ThemedText>
          <View style={styles.priceInputs}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <ThemedText>to</ThemedText>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>
        
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <ThemedText>Clear</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <ThemedText style={{ color: 'white' }}>Apply Filters</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };
  
  // Render form for adding new design (artist only)
  const renderAddForm = () => {
    return (
      <ThemedView style={styles.formContainer}>
        <ThemedText type="title">Add New Design</ThemedText>
        
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <IconSymbol name="camera" size={40} color="#aaa" />
              <ThemedText type="default">Tap to select image</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.formGroup}>
          <ThemedText>Title *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Design Title"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText>Description</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <ThemedText>Price</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <ThemedText>Size</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Size"
              value={size}
              onChangeText={setSize}
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText>Style *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Tattoo Style"
            value={style}
            onChangeText={setStyle}
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText>Categories</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Categories (comma separated)"
            value={categories}
            onChangeText={setCategories}
          />
        </View>
        
        <View style={styles.formButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetForm}
          >
            <ThemedText>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={{ color: 'white' }}>Submit</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }
  
  // Artist view
  if (isArtist()) { // Changed from isArtist to isArtist()
    return (
      <ThemedView style={styles.container}>
        {currentView === 'form' ? (
          renderAddForm()
        ) : (
          <>
            <View style={styles.header}>
              <ThemedText type="title">My Tattoo Designs</ThemedText>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setCurrentView('form')}
              >
                <IconSymbol name="plus" size={22} color="white" />
              </TouchableOpacity>
            </View>
            
            {myDesigns.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="pencil.tip" size={40} color="#aaa" />
                <ThemedText type="subtitle" style={{ marginTop: 16 }}>
                  You haven't added any designs yet
                </ThemedText>
                <TouchableOpacity
                  style={[styles.submitButton, { marginTop: 16 }]}
                  onPress={() => setCurrentView('form')}
                >
                  <ThemedText style={{ color: 'white' }}>Add Your First Design</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={myDesigns}
                renderItem={renderDesignItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.designsGrid}
                numColumns={2}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            )}
          </>
        )}
      </ThemedView>
    );
  }
  
  // Client view
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Tattoo Designs</ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <IconSymbol name="slider.horizontal.3" size={22} color="white" />
        </TouchableOpacity>
      </View>
      
      {renderFilters()}
      
      {designs.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="magnifyingglass" size={40} color="#aaa" />
          <ThemedText type="subtitle" style={{ marginTop: 16 }}>
            No designs found matching your criteria
          </ThemedText>
          <TouchableOpacity
            style={[styles.submitButton, { marginTop: 16 }]}
            onPress={clearFilters}
          >
            <ThemedText style={{ color: 'white' }}>Clear Filters</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={designs}
          renderItem={renderDesignItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.designsGrid}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => {
            if (pagination.page < pagination.pages) {
              fetchDesigns(pagination.page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            pagination.page < pagination.pages ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
  },
  designsGrid: {
    padding: 4,
  },
  designCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  designImage: {
    width: '100%',
    height: 150,
  },
  designInfo: {
    padding: 8,
  },
  designMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  styleTag: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  filtersContainer: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  filterSection: {
    marginTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
  },
  selectedTag: {
    backgroundColor: '#3b82f6',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  selectedTagText: {
    fontWeight: 'bold',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceInput: {
    backgroundColor: '#2c2c2e',
    padding: 8,
    borderRadius: 4,
    width: 80,
    color: '#fff',
    marginHorizontal: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  // Form styles
  formContainer: {
    flex: 1,
    padding: 16,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#2c2c2e',
    padding: 10,
    borderRadius: 4,
    color: '#fff',
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
