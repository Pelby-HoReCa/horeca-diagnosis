import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
};

interface ScrollToTopButtonProps {
  onPress: () => void;
  visible: boolean;
}

export default function ScrollToTopButton({ onPress, visible }: ScrollToTopButtonProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePress = () => {
    onPress();
  };

  // Не рендерим, если не видно и никогда не было видно
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);
  
  React.useEffect(() => {
    if (visible) {
      setHasBeenVisible(true);
    }
  }, [visible]);

  if (!visible && !hasBeenVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.button,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <View style={styles.circle}>
          <Ionicons name="arrow-up" size={24} color={COLORS.blue} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  touchable: {
    width: 50,
    height: 50,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

