import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { DiagnosisBlock } from '../data/diagnosisBlocks';
import { palette, radii, spacing } from '../styles/theme';

interface BarChartProps {
  blocks: DiagnosisBlock[];
  isAuthenticated: boolean;
}

export default function BarChart({ blocks, isAuthenticated }: BarChartProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  console.log('=== BarChart данные ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('Блоки:', blocks.map(b => ({ id: b.id, title: b.title, completed: b.completed, efficiency: b.efficiency })));
  
  // Показываем реальные данные: для пройденных блоков - эффективность, для непройденных - 0
  const displayData = blocks.map(block => ({
    ...block,
    efficiency: (block.completed && block.efficiency !== undefined) ? block.efficiency : 0,
  }));
  
  console.log('displayData:', displayData.map(b => ({ id: b.id, efficiency: b.efficiency })));

  const maxEfficiency = 100;
  const chartHeight = 360;

  const getBarColor = (efficiency: number) => {
    if (efficiency === 0) return palette.error; // Красный для 0%
    if (efficiency === undefined) return palette.gray300;
    if (efficiency >= 80) return palette.success;
    if (efficiency >= 60) return palette.primaryBlue;
    if (efficiency >= 40) return palette.primaryOrange;
    return palette.error;
  };


  const chartData = displayData.map(block => {
    const efficiency = block.efficiency ?? 0;
    // hasData = true если блок завершен
    const hasData = block.completed;
    // Для 0% показываем минимальный бар (5px), для остальных - нормальная высота
    // Учитываем padding снизу для расчета высоты
    const availableHeight = chartHeight - spacing.xs;
    const minBarHeight = 5;
    const barHeight = hasData 
      ? (efficiency > 0 ? (efficiency / maxEfficiency) * availableHeight : minBarHeight)
      : 0;
    const barColor = getBarColor(efficiency);
    return {
      block,
      efficiency,
      hasData,
      barHeight,
      barColor,
    };
  });

  const handleBarPress = (blockId: string) => {
    if (activeTooltip === blockId) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(blockId);
    }
  };

  // Генерируем линии сетки
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <View style={styles.wrapper}>
      <View 
        style={styles.container}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => setActiveTooltip(null)}
      >
        {/* Сетка */}
        <View style={styles.gridContainer}>
          {gridLines.map((line, index) => {
            // Учитываем padding снизу
            const availableHeight = chartHeight - spacing.xs;
            const linePosition = (line / maxEfficiency) * availableHeight;
            return (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  {
                    bottom: linePosition + spacing.xs,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Столбцы */}
        <View style={styles.chartContainer}>
          {chartData.map(({ block, hasData, barHeight, barColor, efficiency }, index) => {
            return (
              <Pressable
                key={block.id}
                style={styles.barWrapper}
                onPress={() => handleBarPress(block.id)}
              >
                <View style={[styles.barContainer, { minHeight: chartHeight - spacing.xs }]}>
                  {hasData && (
                    <Pressable
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                        },
                      ]}
                      onPress={() => handleBarPress(block.id)}
                    />
                  )}
                  {!hasData && (
                    <Pressable
                      style={styles.zeroBar}
                      onPress={() => handleBarPress(block.id)}
                    >
                      <View style={styles.zeroBarIndicator} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Значения над столбцами */}
        <View style={styles.valuesOverlay} pointerEvents="none">
          {chartData.map(({ block, efficiency, hasData, barHeight, barColor }) => {
            // Показываем проценты для всех завершенных блоков (включая 0%)
            // Проверяем: блок завершен И efficiency определен (может быть 0)
            const isCompleted = block.completed;
            const hasEfficiency = block.efficiency !== undefined;
            const shouldShow = isCompleted && hasEfficiency;
            
            if (!shouldShow) {
              return <View key={`val-${block.id}`} style={styles.valueWrapper} />;
            }
            
            // Для позиционирования: для 0% используем фиксированную высоту, для остальных - над баром
            const isZero = efficiency === 0;
            const displayHeight = isZero ? 15 : barHeight;
            
            return (
              <View key={`val-${block.id}`} style={styles.valueWrapper}>
                <Text
                  style={[styles.barValue, {
                    color: barColor,
                    position: 'absolute',
                    bottom: displayHeight + 8,
                    left: 0,
                    right: 0,
                    backgroundColor: 'transparent',
                    zIndex: 100,
                  }]}
                  numberOfLines={1}
                >
                  {efficiency}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* Вертикальные линии сетки */}
        <View style={styles.verticalGridContainer}>
          {chartData.map(({ block }, index) => (
            <View
              key={`v-grid-${block.id}`}
              style={[
                styles.verticalGridLine,
                index === displayData.length - 1 && styles.verticalGridLineLast,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Всплывающие подсказки - вне контейнера, чтобы не обрезались */}
      {chartData.map(({ block, barColor }, index) => {
        const isTooltipActive = activeTooltip === block.id;
        if (!isTooltipActive) return null;
        
        const totalBars = chartData.length;
        // Позиция столбца в процентах от ширины контейнера
        const barPositionPercent = ((index + 0.5) / totalBars) * 100;
        
        // Для крайних столбцов корректируем позицию, чтобы tooltip не выходил за границы экрана
        const screenWidth = Dimensions.get('window').width;
        const tooltipEstimatedWidth = 200; // Примерная ширина tooltip
        const tooltipHalfWidth = tooltipEstimatedWidth / 2;
        const safePadding = 16; // Дополнительный отступ от краев экрана для безопасности
        
        // Section имеет marginHorizontal: spacing.md, wrapper занимает всю ширину section
        // Container внутри wrapper имеет padding: spacing.md и border: 2px
        const sectionMargin = spacing.md; // margin section с каждой стороны
        const containerPadding = spacing.md; // padding container
        const containerBorder = 2; // border container
        
        // Ширина wrapper (равна ширине section, которая равна screenWidth - 2 * sectionMargin)
        const wrapperWidth = screenWidth - (sectionMargin * 2);
        // Ширина контейнера внутри wrapper (wrapperWidth - 2 * containerPadding - 2 * containerBorder)
        const containerWidth = wrapperWidth - (containerPadding * 2) - (containerBorder * 2);
        
        // Tooltip позиционируется относительно wrapper (который находится внутри section)
        // Wrapper занимает всю ширину section (screenWidth - 2 * sectionMargin)
        // Позиция столбца в пикселях относительно левого края wrapper
        const barLeftInWrapper = containerPadding + containerBorder + (barPositionPercent / 100) * containerWidth;
        
        // Позиция столбца в пикселях относительно левого края экрана
        const barLeftOnScreen = sectionMargin + barLeftInWrapper;
        
        // Проверяем границы и корректируем позицию
        // leftPosition - это процент от ширины wrapper (не контейнера!)
        let leftPosition = (barLeftInWrapper / wrapperWidth) * 100;
        let transformX = -50; // По умолчанию центрируем (в процентах)
        
        // Рассчитываем, где будет левый и правый край tooltip на экране
        // Tooltip центрируется относительно leftPosition с помощью translateX(-50%)
        const tooltipLeftEdgeOnScreen = sectionMargin + (leftPosition / 100) * wrapperWidth - tooltipHalfWidth;
        const tooltipRightEdgeOnScreen = sectionMargin + (leftPosition / 100) * wrapperWidth + tooltipHalfWidth;
        
        // Если tooltip выходит за левую границу экрана (с учетом безопасного отступа)
        if (tooltipLeftEdgeOnScreen < safePadding) {
          // Сдвигаем вправо, чтобы tooltip был виден
          const minLeftOnScreen = tooltipHalfWidth + safePadding;
          const minLeftInWrapper = minLeftOnScreen - sectionMargin;
          leftPosition = Math.max(0, (minLeftInWrapper / wrapperWidth) * 100);
          transformX = -50;
        }
        // Если tooltip выходит за правую границу экрана (с учетом безопасного отступа)
        else if (tooltipRightEdgeOnScreen > screenWidth - safePadding) {
          // Сдвигаем влево, чтобы tooltip был виден
          const maxRightOnScreen = screenWidth - tooltipHalfWidth - safePadding;
          const maxLeftInWrapper = maxRightOnScreen - sectionMargin;
          leftPosition = Math.min(100, (maxLeftInWrapper / wrapperWidth) * 100);
          transformX = -50;
        }
        
        return (
          <View
            key={`tooltip-${block.id}`}
            style={[
              styles.tooltip,
              {
                left: `${leftPosition}%`,
                top: spacing.md + 8,
                backgroundColor: barColor,
                transform: [{ translateX: `${transformX}%` }],
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              {block.title}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  container: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    height: 360,
    overflow: 'hidden',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: palette.gray200,
    opacity: 0.5,
  },
  verticalGridContainer: {
    position: 'absolute',
    top: 0,
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    flexDirection: 'row',
    zIndex: 1,
  },
  verticalGridLine: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: palette.gray200,
    opacity: 0.3,
  },
  verticalGridLineLast: {
    borderRightWidth: 0,
  },
  chartContainer: {
    position: 'absolute',
    top: 0,
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    justifyContent: 'flex-end',
    cursor: 'pointer',
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '75%',
    minHeight: 15,
    borderRadius: radii.sm,
    justifyContent: 'flex-start',
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    cursor: 'pointer',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  zeroBar: {
    width: '75%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.gray400,
    borderStyle: 'dashed',
    position: 'relative',
    opacity: 0.5,
    cursor: 'pointer',
  },
  zeroBarIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.gray400,
    marginLeft: -3,
    marginBottom: -3,
  },
  zeroBarText: {
    fontSize: 8,
    fontWeight: '600',
    color: palette.gray500,
    marginTop: 4,
  },
  valueWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  valuesOverlay: {
    position: 'absolute',
    top: 0,
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    zIndex: 3,
    pointerEvents: 'none',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 60,
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: spacing.xxs,
    height: 60,
  },
  barLabel: {
    fontSize: 8,
    color: palette.primaryBlue,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 11,
    transform: [{ rotate: '-90deg' }],
    width: 60,
    height: 20,
    textAlignVertical: 'center',
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    minWidth: 120,
    maxWidth: 200,
    zIndex: 10,
    transform: [{ translateX: -50 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

