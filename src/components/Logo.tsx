import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function Logo({ size = 100, color = '#112677' }: LogoProps) {
  const centerSize = size * 0.2;
  const rayLength = size * 0.4;
  const rayWidth = size * 0.06;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Центральный круг */}
      <View style={[
        styles.center,
        {
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          backgroundColor: '#000000',
        }
      ]} />
      
      {/* 8 лучей */}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index * 45); // 8 лучей по 45 градусов
        return (
          <View
            key={index}
            style={[
              styles.ray,
              {
                width: rayLength,
                height: rayWidth,
                backgroundColor: color,
                borderRadius: rayWidth / 2,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateX: rayLength / 2 }
                ],
              }
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    zIndex: 2,
  },
  ray: {
    position: 'absolute',
    zIndex: 1,
  },
});
