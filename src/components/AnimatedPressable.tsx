import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AnimatedPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  pressScale?: number;
  pressFriction?: number;
  pressTension?: number;
  clampOvershoot?: boolean;
}

export default function AnimatedPressable({
  children,
  onPressIn,
  onPressOut,
  style,
  pressScale = 0.92,
  pressFriction = 5,
  pressTension = 45,
  clampOvershoot = false,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (props.disabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      friction: pressFriction,
      tension: pressTension,
      overshootClamping: clampOvershoot,
      useNativeDriver: true,
    }).start();

    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: pressFriction,
      tension: pressTension,
      overshootClamping: clampOvershoot,
      useNativeDriver: true,
    }).start();

    onPressOut?.(e);
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
