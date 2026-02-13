import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';

interface BlockGaugeProps {
  blockResults: DiagnosisBlock[];
  currentValue: number;
}

// Цвета для секций
const COLORS = {
  green: '#03A66A',
  yellow: '#FFAD1F',
  red: '#FF4D57',
  gray: '#F6F8FA',
};

// Функция для определения цвета блока
function getBlockColor(block: DiagnosisBlock, index: number): 'green' | 'yellow' | 'red' | 'gray' {
  // Если блок не пройден - серый цвет
  if (!block.completed || block.efficiency === undefined) {
    return 'gray';
  }
  
  // Определяем цвет на основе эффективности
  if (block.efficiency >= 78) return 'green';
  if (block.efficiency >= 38 && block.efficiency < 78) return 'yellow';
  return 'red';
}

// Функция для получения hex цвета
function getColorHex(color: 'green' | 'yellow' | 'red' | 'gray'): string {
  return COLORS[color];
}

// Функция для сортировки блоков по цвету
function sortBlocksByColor(blocks: DiagnosisBlock[]): DiagnosisBlock[] {
  const colorPriority = { green: 0, yellow: 1, red: 2, gray: 3 };
  
  return [...blocks].sort((a, b) => {
    const colorA = getBlockColor(a, blocks.indexOf(a));
    const colorB = getBlockColor(b, blocks.indexOf(b));
    
    const priorityA = colorPriority[colorA];
    const priorityB = colorPriority[colorB];
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Если цвета одинаковые, сохраняем исходный порядок
    return blocks.indexOf(a) - blocks.indexOf(b);
  });
}

// Параметры для спидометра
const GAUGE_SIZE = 340;
const GAUGE_HEIGHT = 150;
const RADIUS = 167;
const STROKE_WIDTH = 18;
const CENTER_X = 170;
const CENTER_Y = 122; // Нижний центр дуги
const TOTAL_BLOCKS = 10;
const TOTAL_ANGLE = 180;
const SECTION_ANGLE = TOTAL_ANGLE / TOTAL_BLOCKS; // 18 градусов на секцию

// Функция для создания пути секции
function createSectionPath(startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  
  const x1 = CENTER_X + RADIUS * Math.cos(startRad);
  const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
  const x2 = CENTER_X + RADIUS * Math.cos(endRad);
  const y2 = CENTER_Y + RADIUS * Math.sin(endRad);
  
  const largeArcFlag = SECTION_ANGLE > 180 ? 1 : 0;
  
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

// Функция для создания пути разделителя
function createDividerPath(angle: number): string {
  const rad = (angle * Math.PI) / 180;
  const x1 = CENTER_X + (RADIUS - STROKE_WIDTH / 2) * Math.cos(rad);
  const y1 = CENTER_Y + (RADIUS - STROKE_WIDTH / 2) * Math.sin(rad);
  const x2 = CENTER_X + (RADIUS + STROKE_WIDTH / 2) * Math.cos(rad);
  const y2 = CENTER_Y + (RADIUS + STROKE_WIDTH / 2) * Math.sin(rad);
  
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export default function BlockGauge({ 
  blockResults, 
  currentValue 
}: BlockGaugeProps) {
  React.useEffect(() => {
    console.log('🎯 BlockGauge загружен - VERSION 1.0.3');
  }, []);
  const sortedBlocks = useMemo(() => {
    // Убеждаемся, что у нас всегда 10 блоков для рендеринга
    const allBlocks = [...blockResults];
    while (allBlocks.length < TOTAL_BLOCKS) {
      allBlocks.push({ ...DEFAULT_BLOCKS[allBlocks.length], completed: false, efficiency: undefined });
    }
    return sortBlocksByColor(allBlocks.slice(0, TOTAL_BLOCKS));
  }, [blockResults]);

  const sections = useMemo(() => {
    const sectionsData = [];
    let currentAngle = -180; // Начинаем с левого края полукруга
    
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
      const startAngle = currentAngle;
      const endAngle = currentAngle + SECTION_ANGLE;
      
      const block = sortedBlocks[i];
      const color = getBlockColor(block, i); // Передаем индекс для случайных цветов
      const colorHex = getColorHex(color);
      
      sectionsData.push({
        index: i,
        startAngle,
        endAngle,
        path: createSectionPath(startAngle, endAngle),
        dividerAngle: endAngle, // Угол для разделителя
        color: colorHex,
        block,
      });
      
      currentAngle = endAngle;
    }
    return sectionsData;
  }, [sortedBlocks]);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_HEIGHT} viewBox="-10 -60 360 200">
        {sections.map((section) => (
          <Path
            key={section.index}
            d={section.path}
            stroke={section.color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
        
        {sections.map((section, index) => {
          if (index === sections.length - 1) return null; // Нет разделителя после последней секции
          return (
            <Path
              key={`divider-${section.index}`}
              d={createDividerPath(section.dividerAngle)}
              stroke="white"
              strokeWidth={3} // Толщина белой линии
              fill="none"
              strokeLinecap="butt"
            />
          );
        })}
        
      </Svg>
      <Text style={styles.percentageText}>
        {currentValue}%
      </Text>
      <Text style={styles.blocksText}>
        {blockResults.filter(b => b.completed && b.efficiency !== undefined).length} / {TOTAL_BLOCKS} БЛОКОВ
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: GAUGE_SIZE,
    height: GAUGE_HEIGHT + 2,
    paddingTop: 1,
  },
  percentageText: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -10 }, { translateX: 5 }],
    paddingTop: 1,
    fontSize: 56,
    fontFamily: 'Manrope-Regular',
    color: '#0A0D14',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 57,
    width: '100%',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  blocksText: {
    position: 'absolute',
    top: CENTER_Y - 1,
    left: 0,
    right: 0,
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#666666',
    textAlign: 'center',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
});

