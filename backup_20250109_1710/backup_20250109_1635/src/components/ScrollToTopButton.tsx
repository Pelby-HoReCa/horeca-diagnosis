import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { palette, radii, shadows, spacing } from '../styles/theme';

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
          <Ionicons name="arrow-up" size={22} color={palette.primaryBlue} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    zIndex: 1000,
  },
  touchable: {
    width: 56,
    height: 56,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
});

