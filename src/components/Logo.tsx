import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function Logo({ size = 100, color = '#E84411' }: LogoProps) {
  const centerSize = size * 0.25; // Центральный белый круг
  const rayLength = size * 0.35; // Длина лучей
  const rayWidth = size * 0.15; // Толщина лучей
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Центральный белый круг */}
      <View style={[
        styles.center,
        {
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          backgroundColor: '#FFFFFF', // Белый цвет
        }
      ]} />
      
      {/* 8 оранжевых лучей с закругленными концами */}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * 45; // 8 лучей по 45 градусов
        return (
          <View
            key={index}
            style={[
              styles.ray,
              {
                width: rayLength,
                height: rayWidth,
                backgroundColor: color, // Оранжевый цвет
                borderRadius: rayWidth / 2, // Закругленные концы
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
