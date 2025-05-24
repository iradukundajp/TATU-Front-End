import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  starColor?: string;
  emptyStarColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onRatingChange,
  starColor = '#FFD700',
  emptyStarColor = '#D3D3D3',
}) => {
  const handleStarPress = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const renderStar = (index: number) => {
    const starNumber = index + 1;
    const isFilled = starNumber <= rating;
    const starIcon = isFilled ? 'star.fill' : 'star';
    const color = isFilled ? starColor : emptyStarColor;

    if (interactive) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handleStarPress(starNumber)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <IconSymbol name={starIcon} size={size} color={color} />
        </TouchableOpacity>
      );
    }

    return (
      <View key={index} style={styles.star}>
        <IconSymbol name={starIcon} size={size} color={color} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
  starButton: {
    marginHorizontal: 2,
    padding: 4,
  },
}); 