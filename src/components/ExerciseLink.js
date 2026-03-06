import React, { useState } from 'react';
import { Text, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../contexts/ThemeContext';

const ExerciseLink = ({ exerciseName, style, numberOfLines }) => {
  const navigation = useNavigation();
  const COLORS = useColors();
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    navigation.navigate('ExerciseHistory', { exerciseName });
  };

  if (Platform.OS === 'web') {
    return (
      <Text
        onClick={handlePress}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={[
          style,
          {
            color: COLORS.primary,
            cursor: 'pointer',
            textDecorationLine: isHovered ? 'underline' : 'none',
          },
        ]}
        numberOfLines={numberOfLines}
      >
        {exerciseName}
      </Text>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Text
        style={[style, { color: COLORS.primary }]}
        numberOfLines={numberOfLines}
      >
        {exerciseName}
      </Text>
    </Pressable>
  );
};

export default ExerciseLink;
